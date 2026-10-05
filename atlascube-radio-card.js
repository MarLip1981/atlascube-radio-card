/* AtlasCube Radio Card v0.3
 * https://github.com/MarLip1981/atlascube-radio-card
 */

class AtlasCubeRadioCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._bound = false;
    this._deviceRegistry = null;
    this._entityRegistry = null;
    this._registryLoading = false;
    this._artCache = new Map();
    this._artRequestId = 0;
    this._lastTrackForArtwork = "";
    this._artData = null;
  }

  setConfig(config) {
    this._config = {
      show_source: true,
      show_volume: true,
      show_artwork: false,
      ...config,
      radio: { ...(config?.radio || {}) }
    };

    this._render();
  }

  static getConfigElement() {
    return document.createElement("atlascube-radio-card-editor");
  }

  static getStubConfig() {
    return {
      show_source: true,
      show_volume: true,
      show_artwork: false,
      radio: {}
    };
  }

  _isConfigured() {
    const r = this._config?.radio || {};
    return [
      "station", "title", "playback", "volume", "source",
      "previous", "play", "stop", "next"
    ].every(key => !!r[key]);
  }

  set hass(hass) {
    this._hass = hass;

    const track = this._value(this._config?.radio?.title, "");
    if (track !== this._lastTrackForArtwork) {
      this._lastTrackForArtwork = track;
      this._loadArtwork(track);
    }

    if (!this._registryLoading && (!this._deviceRegistry || !this._entityRegistry)) {
      this._loadRegistries().then(() => this._render());
    }

    this._render();
  }

  async _loadRegistries() {
    if (!this._hass || this._registryLoading) return;

    this._registryLoading = true;

    try {
      const [devices, entities] = await Promise.all([
        this._hass.callWS({ type: "config/device_registry/list" }),
        this._hass.callWS({ type: "config/entity_registry/list" })
      ]);

      this._deviceRegistry = devices || [];
      this._entityRegistry = entities || [];
    } catch (err) {
      console.warn("AtlasCube Radio Card: nie udało się pobrać rejestru urządzeń.", err);
    } finally {
      this._registryLoading = false;
    }
  }

  getCardSize() {
    if (this._config?.show_artwork) return 9;
    return this._config?.show_source === false ? 4 : 5;
  }

  _state(id) {
    return this._hass?.states?.[id];
  }

  _value(id, fallback = "") {
    return this._state(id)?.state ?? fallback;
  }

  _online() {
    const r = this._config.radio || {};
    const availability = r.availability;

    // v0.3: MQTT availability is not read directly by the browser.
    // Home Assistant applies the MQTT availability topic to the native
    // AtlasCube entities, so their "unavailable" state is the frontend-safe
    // representation of the MQTT online/offline state.
    //
    // Keep an explicitly configured availability entity as an override.
    if (availability) {
      const state = this._value(availability, "unavailable");
      return state !== "unavailable" && state !== "unknown" && state !== "off";
    }

    const states = [r.station, r.title, r.playback, r.volume, r.source]
      .map(id => id ? this._state(id)?.state : undefined)
      .filter(state => state !== undefined);

    if (!states.length) return false;

    return states.some(state =>
      state !== "unavailable" && state !== "unknown"
    );
  }

  _webUrl() {
    const r = this._config?.radio || {};
    const entityIds = [
      r.station, r.title, r.playback, r.volume, r.source,
      r.previous, r.play, r.stop, r.next
    ].filter(Boolean);

    const entityRegistry = this._entityRegistry || [];
    const deviceRegistry = this._deviceRegistry || [];

    for (const entityId of entityIds) {
      const entity = entityRegistry.find(item => item.entity_id === entityId);
      if (!entity?.device_id) continue;

      const device = deviceRegistry.find(item => item.id === entity.device_id);
      if (device?.configuration_url) {
        return device.configuration_url;
      }
    }

    return null;
  }

  _playing() {
    return this._value(this._config.radio?.playback) === "playing";
  }

  async _press(entityId) {
    if (!this._hass || !entityId) return;
    await this._hass.callService("button", "press", {
      entity_id: entityId
    });
  }

  async _setVolume(value) {
    if (!this._hass) return;
    await this._hass.callService("number", "set_value", {
      entity_id: this._config.radio.volume,
      value
    });
  }

  _status() {
    if (!this._online()) {
      return { icon: "mdi:wifi-off", color: "#f44336", playing: false };
    }

    if (this._playing()) {
      return { icon: "mdi:music-note", color: "#4caf50", playing: true };
    }

    return { icon: "mdi:radio", color: "rgba(255,255,255,.60)", playing: false };
  }

  _icon(name) {
    return `<ha-icon icon="${name}"></ha-icon>`;
  }

  _parseTrack(value) {
    const text = String(value || "").trim();
    const match = text.match(/^(.+?)\s+-\s+(.+)$/);
    if (!match) return { artist: "", title: text };
    return { artist: match[1].trim(), title: match[2].trim() };
  }

  _normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  _scoreArtworkResult(result, artist, title) {
    const wantedArtist = this._normalize(artist);
    const wantedTitle = this._normalize(title);
    const resultArtist = this._normalize(result.artistName);
    const resultTitle = this._normalize(result.trackName);
    let score = 0;

    if (resultArtist === wantedArtist) score += 100;
    else if (resultArtist.includes(wantedArtist) || wantedArtist.includes(resultArtist)) score += 40;

    if (resultTitle === wantedTitle) score += 100;
    else if (resultTitle.includes(wantedTitle) || wantedTitle.includes(resultTitle)) score += 40;

    return score;
  }

  async _loadArtwork(rawTrack) {
    const { artist, title } = this._parseTrack(rawTrack);
    const requestId = ++this._artRequestId;

    this._artData = { artist, title, artwork: null, album: "" };
    this._render();

    if (!rawTrack || !title) return;

    const cacheKey = this._normalize(rawTrack);

    if (this._artCache.has(cacheKey)) {
      this._artData = {
        artist,
        title,
        ...this._artCache.get(cacheKey)
      };
      this._render();
      return;
    }

    try {
      const query = encodeURIComponent(artist + " " + title);
      const url = `https://itunes.apple.com/search?term=${query}&country=PL&media=music&entity=song&limit=10`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (requestId !== this._artRequestId) return;

      const results = Array.isArray(data.results) ? data.results : [];
      let best = null;
      let bestScore = -1;

      for (const result of results) {
        const score = this._scoreArtworkResult(result, artist, title);
        if (score > bestScore) {
          bestScore = score;
          best = result;
        }
      }

      const artwork = best?.artworkUrl100
        ? best.artworkUrl100
            .replace(/100x100bb\./i, "600x600bb.")
            .replace(/^http:/i, "https:")
        : null;

      const result = {
        artwork,
        album: best?.collectionName || "",
        matchScore: bestScore
      };

      this._artCache.set(cacheKey, result);
      this._artData = { artist, title, ...result };
      this._render();
    } catch (err) {
      if (requestId !== this._artRequestId) return;
      this._artData = { artist, title, artwork: null, album: "" };
      this._render();
    }
  }

  _render() {
    if (!this._config || !this._hass) return;

    if (!this._isConfigured()) {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display:block; width:100%; }
          .setup {
            border-radius:26px;
            padding:24px;
            background:rgba(255,255,255,.045);
            border:1px solid rgba(255,193,7,.30);
            color:var(--primary-text-color);
            text-align:center;
          }
          .setup ha-icon {
            --mdc-icon-size:38px;
            color:#ffc107;
          }
          .setup-title { font-size:17px; font-weight:600; margin-top:8px; }
          .setup-text { font-size:13px; opacity:.65; margin-top:6px; }
        </style>
        <ha-card class="setup">
          <ha-icon icon="mdi:radio-tower"></ha-icon>
          <div class="setup-title">AtlasCube Radio</div>
          <div class="setup-text">Skonfiguruj kartę w edytorze, aby rozpocząć.</div>
        </ha-card>
      `;
      return;
    }

    const r = this._config.radio;
    const online = this._online();
    const playing = this._playing();
    const station = this._value(r.station, "AtlasCube");
    const titleState = this._value(r.title, "");
    const title = titleState && titleState !== "unknown" && titleState !== "unavailable"
      ? titleState
      : "Brak informacji o utworze";

    const artwork = this._artData?.artwork || "";
    const artArtist = this._artData?.artist || "";
    const artTitle = this._artData?.title || title;
    const album = this._artData?.album || "";

    const background = artwork
      ? `
        <img class="blur-bg-image" src="${artwork}" alt="" aria-hidden="true">
        <div class="art-shade"></div>
      `
      : `
        <div class="art-fallback-bg"></div>
      `;

    const cover = artwork
      ? `<img class="cover" src="${artwork}" alt="Okładka">`
      : `<div class="cover no-cover"><ha-icon class="fallback-radio ${playing ? "rainbow" : "idle"}" icon="mdi:radio"></ha-icon></div>`;

    const status = this._status();
    const volume = Number(this._value(r.volume, 0)) || 0;
    const source = this._value(r.source, "");
    const webUrl = this._webUrl();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        * {
          box-sizing: border-box;
        }

        .card {
          border-radius: 26px;
          padding: 10px;
          overflow: hidden;
          transition: all .4s ease;
          color: var(--primary-text-color);
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.08);
        }

        .card.playing {
          background:
            radial-gradient(
              circle at 50% 42%,
              rgba(33,150,243,.18) 0%,
              rgba(33,150,243,.06) 38%,
              rgba(0,0,0,.18) 100%
            );
          border-color: rgba(33,150,243,.35);
          box-shadow:
            0 0 18px rgba(33,150,243,.16),
            inset 0 0 30px rgba(33,150,243,.04);
        }

        .card.offline {
          background: rgba(25,25,25,.45);
          border-color: rgba(255,255,255,.05);
          filter: grayscale(.7);
          opacity: .55;
        }


        .art-area {
          position: relative;
          min-height: 405px;
          margin: -10px -10px 8px;
          overflow: hidden;
          border-radius: 24px 24px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .blur-bg-image,
        .art-shade,
        .art-fallback-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .blur-bg-image {
          display: block;
          object-fit: cover;
          object-position: center;
          filter: blur(24px);
          transform: scale(1.0);
          opacity: .82;
          z-index: 0;
        }

        .art-shade {
          z-index: 1;
          background: linear-gradient(
            180deg,
            rgba(0,0,0,.18),
            rgba(0,0,0,.58)
          );
        }

        .art-fallback-bg {
          z-index: 0;
          background: radial-gradient(
            circle at 50% 42%,
            rgba(33,150,243,.18) 0%,
            rgba(33,150,243,.06) 38%,
            rgba(0,0,0,.18) 100%
          );
        }

        .art-content {
          position: relative;
          z-index: 2;
          min-height: 405px;
          padding: 18px 14px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .art-station {
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: .04em;
          opacity: .88;
          text-align: center;
        }

        .cover {
          width: 220px;
          height: 220px;
          border-radius: 14px;
          object-fit: cover;
          box-shadow: 0 8px 30px rgba(0,0,0,.45);
          background: rgba(0,0,0,.25);
        }

        .no-cover {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fallback-radio {
          --mdc-icon-size: 92px;
          width: 92px;
          height: 92px;
        }

        .fallback-radio.idle {
          color: rgba(255,255,255,.55);
        }

        .fallback-radio.rainbow {
          color: #ff0000;
          animation: atlas-rainbow 4s linear infinite;
        }

        .art-artist {
          margin-top: 18px;
          font-size: 16px;
          opacity: .82;
          text-align: center;
        }

        .art-title {
          margin-top: 5px;
          font-size: 23px;
          font-weight: 600;
          line-height: 1.2;
          text-align: center;
        }

        .art-album {
          margin-top: 8px;
          font-size: 14px;
          opacity: .68;
          text-align: center;
        }

        .header {
          height: 76px;
          padding: 8px 14px;
          border-radius: 20px;
          display: grid;
          grid-template-areas: "icon text status";
          grid-template-columns: 48px 1fr 28px;
          column-gap: 12px;
          align-items: center;
        }

        .header.web {
          cursor: pointer;
        }

        .header.web:active {
          transform: scale(.995);
        }

        .radio-icon {
          grid-area: icon;
          width: 38px;
          height: 38px;
        }

        .radio-icon.rainbow {
          color: #ff0000;
          animation: atlas-rainbow 4s linear infinite;
        }

        .radio-icon.offline {
          color: rgba(255,255,255,.25);
        }

        .radio-icon.idle {
          color: rgba(255,255,255,.55);
        }

        .texts {
          grid-area: text;
          min-width: 0;
          display: grid;
          grid-template-rows: 1fr 1fr;
        }

        .station {
          align-self: end;
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .title {
          align-self: start;
          font-size: 12px;
          opacity: .65;
          line-height: 18px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status {
          grid-area: status;
          justify-self: center;
          width: 22px;
          height: 22px;
        }

        .status.playing {
          animation: atlas-status-pulse 1.8s ease-in-out infinite;
        }

        .source {
          height: 42px;
          margin: 0 4px 5px;
          padding: 0 10px;
          border-radius: 15px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.06);
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--primary-text-color);
          font-size: 12px;
          opacity: .8;
        }

        .source ha-icon {
          --mdc-icon-size: 21px;
          color: rgba(33,150,243,.85);
        }

        .source select {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: 0;
          outline: 0;
          color: inherit;
          font: inherit;
        }

        .source option {
          color: #111;
        }

        .controls {
          min-height: 66px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,.07);
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .skip {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          border-radius: 20px;
          background: rgba(255,255,255,.045);
          display: grid;
          place-items: center;
        }

        .skip ha-icon {
          --mdc-icon-size: 27px;
          color: rgba(255,255,255,.7);
        }

        .main {
          width: 66px;
          height: 66px;
          flex: 0 0 66px;
          margin: 0 10px;
          border-radius: 50%;
          display: grid;
          place-items: center;
        }

        .main.playing {
          background: rgba(33,150,243,.20);
          border-color: rgba(33,150,243,.55);
          box-shadow: 0 0 22px rgba(33,150,243,.30);
        }

        .main.stopped {
          background: rgba(255,255,255,.08);
          border-color: rgba(255,255,255,.10);
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }

        .main ha-icon {
          --mdc-icon-size: 31px;
        }

        .main.playing ha-icon {
          color: #2196f3;
        }

        .main.stopped ha-icon {
          color: rgba(255,255,255,.9);
        }

        .volume {
          height: 44px;
          margin: 5px 4px 0;
          padding: 0 8px;
          border-radius: 15px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.06);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .volume button {
          width: 30px;
          height: 30px;
          padding: 0;
          border: 0;
          background: transparent;
          display: grid;
          place-items: center;
        }

        .volume button ha-icon {
          --mdc-icon-size: 21px;
        }

        .volume input {
          flex: 1;
          min-width: 0;
          accent-color: #2196f3;
        }

        @keyframes atlas-rainbow {
          0% { filter: hue-rotate(0deg) drop-shadow(0 0 4px rgba(255,0,0,.8)); }
          25% { filter: hue-rotate(90deg) drop-shadow(0 0 7px rgba(0,255,0,.8)); }
          50% { filter: hue-rotate(180deg) drop-shadow(0 0 8px rgba(0,220,255,.85)); }
          75% { filter: hue-rotate(270deg) drop-shadow(0 0 8px rgba(180,0,255,.85)); }
          100% { filter: hue-rotate(360deg) drop-shadow(0 0 4px rgba(255,0,0,.8)); }
        }

        @keyframes atlas-status-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 1px rgba(76,175,80,.2)); }
          50% { transform: scale(1.12); filter: drop-shadow(0 0 6px rgba(76,175,80,.7)); }
        }
      </style>

      <ha-card class="card ${playing ? "playing" : ""} ${!online ? "offline" : ""}">
        ${this._config.show_artwork ? `
          <div class="art-area">
            ${background}
            <div class="art-content">
              <div class="art-station">${this._escape(station)}</div>
              ${cover}
              <div class="art-artist">${this._escape(artArtist || (titleState ? this._parseTrack(titleState).artist : "") || "Nieznany wykonawca")}</div>
              <div class="art-title">${this._escape(artTitle)}</div>
              ${album ? `<div class="art-album">${this._escape(album)}</div>` : ""}
            </div>
          </div>
        ` : ""}

        <div class="header ${webUrl ? "web" : ""}" id="header" title="${webUrl ? "Otwórz panel AtlasCube" : ""}">
          <ha-icon
            class="radio-icon ${playing && online ? "rainbow" : online ? "idle" : "offline"}"
            icon="mdi:radio">
          </ha-icon>

          <div class="texts">
            <div class="station">${this._escape(station)}</div>
            <div class="title">${this._escape(title)}</div>
          </div>

          <ha-icon
            class="status ${status.playing ? "playing" : ""}"
            style="color:${status.color}"
            icon="${status.icon}">
          </ha-icon>
        </div>

        ${this._config.show_source ? `
          <div class="source">
            <ha-icon icon="mdi:audio-input-stereo-minijack"></ha-icon>
            <select id="source">
              ${this._sourceOptions(source)}
            </select>
          </div>
        ` : ""}

        <div class="controls">
          <button class="skip" id="previous" aria-label="Poprzednia stacja">
            <ha-icon icon="mdi:skip-previous"></ha-icon>
          </button>

          <button class="main ${playing ? "playing" : "stopped"}" id="playstop" aria-label="${playing ? "Stop" : "Play"}">
            <ha-icon icon="mdi:${playing ? "stop" : "play"}"></ha-icon>
          </button>

          <button class="skip" id="next" aria-label="Następna stacja">
            <ha-icon icon="mdi:skip-next"></ha-icon>
          </button>
        </div>

        ${this._config.show_volume ? `
          <div class="volume">
            <button id="mute" aria-label="Wycisz">
              <ha-icon icon="mdi:${volume === 0 ? "volume-mute" : "volume-high"}"
                style="color:${volume === 0 ? "#f44336" : "rgba(255,255,255,.65)"}">
              </ha-icon>
            </button>
            <input id="volume" type="range" min="0" max="100" step="1" value="${volume}">
          </div>
        ` : ""}
      </ha-card>
    `;

    this._wire();
  }

  _sourceOptions(current) {
    const entity = this._state(this._config.radio.source);
    const options = entity?.attributes?.options || [];

    if (!options.length) {
      return `<option selected>${this._escape(current)}</option>`;
    }

    return options.map(option => `
      <option value="${this._escapeAttr(option)}" ${String(option) === String(current) ? "selected" : ""}>
        ${this._escape(option)}
      </option>
    `).join("");
  }

  _wire() {
    const root = this.shadowRoot;
    if (!root) return;

    const webUrl = this._webUrl();
    root.querySelector("#header")?.addEventListener("click", () => {
      if (webUrl) window.open(webUrl, "_blank", "noopener,noreferrer");
    });

    root.querySelector("#previous")?.addEventListener("click", () =>
      this._press(this._config.radio.previous)
    );

    root.querySelector("#next")?.addEventListener("click", () =>
      this._press(this._config.radio.next)
    );

    root.querySelector("#playstop")?.addEventListener("click", () =>
      this._press(
        this._playing()
          ? this._config.radio.stop
          : this._config.radio.play
      )
    );

    root.querySelector("#mute")?.addEventListener("click", () =>
      this._setVolume(0)
    );

    root.querySelector("#volume")?.addEventListener("change", event =>
      this._setVolume(Number(event.target.value))
    );

    root.querySelector("#source")?.addEventListener("change", async event => {
      if (!this._hass) return;

      await this._hass.callService("select", "select_option", {
        entity_id: this._config.radio.source,
        option: event.target.value
      });
    });
  }

  _escape(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _escapeAttr(value) {
    return this._escape(value);
  }
}



class AtlasCubeRadioCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = { show_source: true, show_volume: true, show_artwork: false, radio: {} };
    this._autoDetected = false;
    this._deviceRegistry = null;
    this._entityRegistry = null;
  }

  setConfig(config) {
    this._config = {
      show_source: true,
      show_volume: true,
      show_artwork: false,
      ...config,
      radio: { ...(config?.radio || {}) }
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._autoDetected && this._hass) {
      this._autoDetected = true;
      this._autoDetect().then(() => this._render());
    }

    this._render();
  }

  _states() {
    return Object.values(this._hass?.states || {});
  }

  async _loadRegistries() {
    if (!this._hass) return;
    try {
      const [devices, entities] = await Promise.all([
        this._hass.callWS({ type: "config/device_registry/list" }),
        this._hass.callWS({ type: "config/entity_registry/list" })
      ]);
      this._deviceRegistry = devices || [];
      this._entityRegistry = entities || [];
    } catch (err) {
      console.warn("AtlasCube Radio Card: nie udało się pobrać rejestru urządzeń.", err);
    }
  }

  _atlasDevice() {
    const devices = this._deviceRegistry || [];
    return devices.find(device => {
      const identifiers = (device.identifiers || []).map(pair =>
        Array.isArray(pair) ? pair.join(":") : String(pair)
      );
      return String(device.manufacturer || "").toLowerCase() === "atlascube" ||
        identifiers.some(id => id.toLowerCase().includes("atlascube"));
    }) || null;
  }

  _find(role) {
    const states = this._states();
    const atlasDevice = this._atlasDevice();
    const atlasDeviceId = atlasDevice?.id;
    const registryByEntity = new Map(
      (this._entityRegistry || []).map(entity => [entity.entity_id, entity])
    );
    const atlas = atlasDeviceId
      ? states.filter(state => registryByEntity.get(state.entity_id)?.device_id === atlasDeviceId)
      : states.filter(s => /atlascube/i.test(s.entity_id + " " + (s.attributes?.friendly_name || "")));

    const rules = {
      station: [
        s => /stacja|station/i.test(s.entity_id),
        s => /stacja|station/i.test(s.attributes?.friendly_name || "")
      ],
      title: [
        s => /tytul|title|utwor|track/i.test(s.entity_id),
        s => /tytuł|tytul|utwór|utwor|track|title/i.test(s.attributes?.friendly_name || "")
      ],
      playback: [
        s => /playback/i.test(s.entity_id),
        s => /playback/i.test(s.attributes?.friendly_name || "")
      ],
      volume: [
        s => s.entity_id.startsWith("number.") && /glosnosc|volume/i.test(s.entity_id),
        s => s.entity_id.startsWith("number.") && /głośność|glosnosc|volume/i.test(s.attributes?.friendly_name || "")
      ],
      source: [
        s => s.entity_id.startsWith("select.") && /source|źródło|zrodlo/i.test(s.entity_id + " " + (s.attributes?.friendly_name || ""))
      ],
      previous: [
        s => s.entity_id.startsWith("button.") && /previous|prev|poprzed/i.test(s.entity_id + " " + (s.attributes?.friendly_name || ""))
      ],
      play: [
        s => s.entity_id.startsWith("button.") && /play|odtworz/i.test(s.entity_id + " " + (s.attributes?.friendly_name || "")) && !/display|replay/i.test(s.entity_id)
      ],
      stop: [
        s => s.entity_id.startsWith("button.") && /stop|zatrzymaj/i.test(s.entity_id + " " + (s.attributes?.friendly_name || ""))
      ],
      next: [
        s => s.entity_id.startsWith("button.") && /next|następ|nastep/i.test(s.entity_id + " " + (s.attributes?.friendly_name || ""))
      ]
    };

    for (const predicate of (rules[role] || [])) {
      const hit = atlas.find(predicate);
      if (hit) return hit.entity_id;
    }
    return "";
  }

  async _autoDetect() {
    if (!this._deviceRegistry || !this._entityRegistry) {
      await this._loadRegistries();
    }
    const r = this._config.radio;
    for (const role of [
      "station", "title", "playback", "volume", "source",
      "previous", "play", "stop", "next"
    ]) {
      if (!r[role]) {
        const found = this._find(role);
        if (found) r[role] = found;
      }
    }

    // v0.3: do not create an availability dependency on a ping helper
    // or a guessed binary_sensor. MQTT availability is already applied by
    // Home Assistant to the native AtlasCube entities.
    //
    // If v0.2.1 previously auto-selected an IP-named ping sensor, remove it
    // so the card can test the native MQTT-derived availability path.
    if (
      r.availability &&
      /^binary_sensor\\.\\d{1,3}(?:_\\d{1,3}){3}$/.test(r.availability)
    ) {
      delete r.availability;
    }

    this._config.radio = { ...r };
    this._fire();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }

  _set(key, value) {
    this._config = {
      ...this._config,
      radio: {
        ...this._config.radio,
        [key]: value
      }
    };
    this._fire();
  }

  _entityOptions(role) {
    const domainMap = {
      station: ["sensor"],
      title: ["sensor"],
      playback: ["sensor"],
      volume: ["number"],
      source: ["select"],
      previous: ["button"],
      play: ["button"],
      stop: ["button"],
      next: ["button"],
      availability: ["binary_sensor"]
    };

    const domains = domainMap[role] || [];
    const states = this._states()
      .filter(s => domains.includes(s.entity_id.split(".")[0]))
      .sort((a, b) => a.entity_id.localeCompare(b.entity_id));

    return states.map(s => {
      const name = s.attributes?.friendly_name || s.entity_id;
      const selected = s.entity_id === this._config.radio[role] ? "selected" : "";
      return `<option value="${this._escapeAttr(s.entity_id)}" ${selected}>${this._escape(name)} — ${this._escape(s.entity_id)}</option>`;
    }).join("");
  }

  _field(role, label) {
    const value = this._config.radio[role] || "";
    return `
      <label>
        <span>${label}</span>
        <select data-role="${role}">
          <option value="">— wybierz encję —</option>
          ${this._entityOptions(role)}
        </select>
      </label>
    `;
  }

  _escape(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _escapeAttr(value) {
    return this._escape(value);
  }

  _render() {
    const r = this._config.radio;
    const complete = [
      "station", "title", "playback", "volume", "source",
      "previous", "play", "stop", "next"
    ].every(k => !!r[k]);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .box {
          padding:16px;
          border-radius:16px;
          background:var(--card-background-color,#fff);
          color:var(--primary-text-color);
        }
        h2 { margin:0 0 4px; font-size:18px; }
        p { margin:0 0 16px; opacity:.65; font-size:13px; }
        .auto {
          width:100%;
          min-height:42px;
          margin-bottom:16px;
          border:1px solid var(--divider-color);
          border-radius:10px;
          background:var(--secondary-background-color);
          color:var(--primary-text-color);
          font:inherit;
          cursor:pointer;
        }
        label { display:block; margin:0 0 12px; }
        label span {
          display:block;
          margin:0 0 5px;
          font-size:12px;
          opacity:.75;
        }
        select {
          width:100%;
          min-height:40px;
          padding:0 8px;
          border:1px solid var(--divider-color);
          border-radius:9px;
          background:var(--secondary-background-color);
          color:var(--primary-text-color);
          font:inherit;
        }
        .checks {
          display:grid;
          grid-template-columns:1fr 1fr 1fr;
          gap:10px;
          margin-top:4px;
        }
        .checks label {
          display:flex;
          align-items:center;
          gap:8px;
          margin:0;
          font-size:13px;
        }
        .checks span { margin:0; font-size:13px; }
        .ok {
          margin-top:12px;
          font-size:12px;
          color:var(--success-color,#43a047);
        }
      </style>

      <div class="box">
        <h2>AtlasCube Radio</h2>
        <p>Karta wykrywa AtlasCube i korzysta z natywnej dostępności MQTT przez stany jego encji.</p>

        <button class="auto" id="auto">🔎 Automatycznie wykryj AtlasCube</button>

        ${this._field("station", "Nazwa stacji")}
        ${this._field("title", "Tytuł utworu")}
        ${this._field("playback", "Stan odtwarzania")}
        ${this._field("volume", "Głośność")}
        ${this._field("source", "Źródło")}
        ${this._field("previous", "Poprzednia")}
        ${this._field("play", "Play")}
        ${this._field("stop", "Stop")}
        ${this._field("next", "Następna")}
        ${this._field("availability", "Dostępność — tylko ręczny override")}

        <div class="checks">
          <label>
            <input type="checkbox" id="show_artwork" ${this._config.show_artwork === true ? "checked" : ""}>
            <span>Okładka utworu</span>
          </label>
          <label>
            <input type="checkbox" id="show_source" ${this._config.show_source !== false ? "checked" : ""}>
            <span>Pokaż źródło</span>
          </label>
          <label>
            <input type="checkbox" id="show_volume" ${this._config.show_volume !== false ? "checked" : ""}>
            <span>Pokaż głośność</span>
          </label>
        </div>

        ${complete ? '<div class="ok">✓ Konfiguracja kompletna — karta jest gotowa.</div>' : ""}
      </div>
    `;

    this.shadowRoot.querySelector("#auto")?.addEventListener("click", () => {
      this._autoDetected = true;
      this._autoDetect();
      this._render();
    });

    this.shadowRoot.querySelectorAll("select[data-role]").forEach(el => {
      el.addEventListener("change", e => {
        this._set(e.target.dataset.role, e.target.value);
        this._render();
      });
    });

    this.shadowRoot.querySelector("#show_artwork")?.addEventListener("change", e => {
      this._config.show_artwork = e.target.checked;
      this._fire();
      this._render();
    });

    this.shadowRoot.querySelector("#show_source")?.addEventListener("change", e => {
      this._config.show_source = e.target.checked;
      this._fire();
    });

    this.shadowRoot.querySelector("#show_volume")?.addEventListener("change", e => {
      this._config.show_volume = e.target.checked;
      this._fire();
    });
  }
}

customElements.define("atlascube-radio-card-editor", AtlasCubeRadioCardEditor);


customElements.define("atlascube-radio-card", AtlasCubeRadioCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "atlascube-radio-card",
  name: "AtlasCube Radio Card",
  description: "Compact modern radio card for AtlasCube in Home Assistant",
  preview: true,
  documentationURL: "https://github.com/MarLip1981/atlascube-radio-card"
});
