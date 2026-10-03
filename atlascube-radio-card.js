/* AtlasCube Radio Card
 * https://github.com/MarLip1981/atlascube-radio-card
 */

class AtlasCubeRadioCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._bound = false;
  }

  setConfig(config) {
    if (!config || !config.radio) {
      throw new Error("AtlasCube Radio Card: missing 'radio' configuration.");
    }

    const required = [
      "station", "title", "playback", "volume", "source",
      "previous", "play", "stop", "next", "availability"
    ];

    for (const key of required) {
      if (!config.radio[key]) {
        throw new Error(`AtlasCube Radio Card: missing radio.${key}`);
      }
    }

    this._config = {
      show_source: true,
      show_volume: true,
      ...config,
      radio: { ...config.radio }
    };

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return this._config?.show_source === false ? 4 : 5;
  }

  _state(id) {
    return this._hass?.states?.[id];
  }

  _value(id, fallback = "") {
    return this._state(id)?.state ?? fallback;
  }

  _online() {
    return this._value(this._config.radio.availability) === "on";
  }

  _playing() {
    return this._value(this._config.radio.playback) === "playing";
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

  _render() {
    if (!this._config || !this._hass) return;

    const r = this._config.radio;
    const online = this._online();
    const playing = this._playing();
    const station = this._value(r.station, "AtlasCube");
    const titleState = this._value(r.title, "");
    const title = titleState && titleState !== "unknown" && titleState !== "unavailable"
      ? titleState
      : "Brak informacji o utworze";

    const status = this._status();
    const volume = Number(this._value(r.volume, 0)) || 0;
    const source = this._value(r.source, "");

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
        <div class="header">
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

customElements.define("atlascube-radio-card", AtlasCubeRadioCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "atlascube-radio-card",
  name: "AtlasCube Radio Card",
  description: "Compact modern radio card for AtlasCube in Home Assistant",
  preview: true
});
