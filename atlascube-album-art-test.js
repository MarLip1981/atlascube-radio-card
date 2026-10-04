/* AtlasCube Album Art Test
 * Test branch: test/album-art
 * Does not modify the stable AtlasCube Radio Card.
 */

class AtlasCubeAlbumArtTest extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._lastTrack = null;
    this._result = null;
    this._loading = false;
    this._error = "";
    this._cache = new Map();
  }

  setConfig(config) {
    this._config = {
      entity: "sensor.atlascube_radio_tytul_utworu",
      ...config
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();

    const track = this._track();

    if (track && track !== this._lastTrack) {
      this._lastTrack = track;
      this._lookup(track);
    }
  }

  getCardSize() {
    return 6;
  }

  _track() {
    const state = this._hass?.states?.[this._config.entity];
    if (!state) return "";

    const value = String(state.state || "").trim();

    if (!value || value === "unknown" || value === "unavailable") {
      return "";
    }

    return value;
  }

  _splitTrack(value) {
    const match = String(value || "").match(/^(.+?)\s+-\s+(.+)$/);

    if (!match) {
      return {
        artist: "",
        title: String(value || "").trim()
      };
    }

    return {
      artist: match[1].trim(),
      title: match[2].trim()
    };
  }

  _normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  _score(item, parsed) {
    const artist = this._normalize(parsed.artist);
    const title = this._normalize(parsed.title);
    const itemArtist = this._normalize(item.artistName);
    const itemTitle = this._normalize(item.trackName);

    let score = 0;

    if (artist && itemArtist === artist) score += 100;
    else if (artist && itemArtist.includes(artist)) score += 40;

    if (title && itemTitle === title) score += 100;
    else if (title && itemTitle.includes(title)) score += 40;

    return score;
  }

  async _lookup(track) {
    if (this._loading) return;

    if (this._cache.has(track)) {
      this._result = this._cache.get(track);
      this._error = "";
      this._render();
      return;
    }

    const parsed = this._splitTrack(track);

    this._loading = true;
    this._result = null;
    this._error = "";
    this._render();

    try {
      const term = parsed.artist && parsed.title
        ? parsed.artist + " " + parsed.title
        : track;

      const url =
        "https://itunes.apple.com/search" +
        "?term=" + encodeURIComponent(term) +
        "&country=PL" +
        "&media=music" +
        "&entity=song" +
        "&limit=10";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();

      const results = Array.isArray(data.results)
        ? data.results.filter(item =>
            item.wrapperType === "track" &&
            item.artworkUrl100
          )
        : [];

      results.sort((a, b) =>
        this._score(b, parsed) - this._score(a, parsed)
      );

      if (!results.length) {
        this._cache.set(track, null);
        this._result = null;
      } else {
        const item = results[0];

        this._result = {
          artist: item.artistName || "",
          title: item.trackName || "",
          album: item.collectionName || "",
          artwork: String(item.artworkUrl100)
            .replace(/100x100/g, "600x600")
            .replace(/^http:/, "https:")
        };

        this._cache.set(track, this._result);
      }
    } catch (error) {
      console.warn("AtlasCube Album Art Test:", error);
      this._error = error?.message || "Błąd wyszukiwania";
      this._result = null;
    }

    this._loading = false;
    this._render();
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _render() {
    if (!this.shadowRoot) return;

    const track = this._track();
    const parsed = this._splitTrack(track);
    const result = this._result;

    const hasArtwork = !!result?.artwork;

    const background = hasArtwork
      ? `
        linear-gradient(
          rgba(0,0,0,.56),
          rgba(0,0,0,.72)
        ),
        url("${result.artwork}")
      `
      : `
        radial-gradient(
          circle at 50% 42%,
          rgba(33,150,243,.18) 0%,
          rgba(33,150,243,.06) 38%,
          rgba(0,0,0,.18) 100%
        )
      `;

    let status = "Brak okładki — używany jest obecny fallback.";

    if (this._loading) {
      status = "🔎 Szukam okładki…";
    } else if (hasArtwork) {
      status = "✅ Znaleziono okładkę";
    } else if (this._error) {
      status = "⚠️ Błąd wyszukiwania — fallback";
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display:block;
          width:100%;
        }

        * {
          box-sizing:border-box;
        }

        .card {
          position:relative;
          min-height:430px;
          overflow:hidden;
          border-radius:26px;
          padding:18px;
          color:var(--primary-text-color);
          background:${background};
          background-size:cover;
          background-position:center;
          border:1px solid rgba(33,150,243,.35);
          box-shadow:
            0 0 18px rgba(33,150,243,.16),
            inset 0 0 30px rgba(33,150,243,.04);
          font-family:var(
            --ha-card-font-family,
            sans-serif
          );
        }

        .blur {
          position:absolute;
          inset:-35px;
          background:${background};
          background-size:cover;
          background-position:center;
          filter:blur(20px);
          transform:scale(1.08);
          opacity:${hasArtwork ? ".62" : "0"};
          z-index:0;
        }

        .shade {
          position:absolute;
          inset:0;
          background:
            linear-gradient(
              180deg,
              rgba(0,0,0,.18),
              rgba(0,0,0,.78)
            );
          z-index:1;
        }

        .content {
          position:relative;
          z-index:2;
          min-height:390px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          text-align:center;
        }

        .badge {
          position:absolute;
          top:0;
          left:0;
          padding:4px 8px;
          border-radius:7px;
          background:rgba(255,193,7,.15);
          border:1px solid rgba(255,193,7,.28);
          color:#ffc107;
          font-size:10px;
          font-weight:700;
          letter-spacing:.5px;
        }

        .art {
          width:210px;
          height:210px;
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 10px 35px rgba(0,0,0,.55);
          background:
            radial-gradient(
              circle at 50% 42%,
              rgba(33,150,243,.18) 0%,
              rgba(33,150,243,.06) 38%,
              rgba(0,0,0,.18) 100%
            );
        }

        .art img {
          display:block;
          width:100%;
          height:100%;
          object-fit:cover;
        }

        .no-art {
          width:210px;
          height:210px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:16px;
          background:
            radial-gradient(
              circle at 50% 42%,
              rgba(33,150,243,.18) 0%,
              rgba(33,150,243,.06) 38%,
              rgba(0,0,0,.18) 100%
            );
          border:1px solid rgba(33,150,243,.25);
          opacity:.75;
        }

        .title {
          margin-top:18px;
          font-size:24px;
          line-height:1.25;
          font-weight:600;
          text-shadow:0 2px 8px rgba(0,0,0,.8);
        }

        .artist {
          margin-top:7px;
          font-size:18px;
          opacity:.9;
          text-shadow:0 2px 7px rgba(0,0,0,.8);
        }

        .album {
          margin-top:5px;
          font-size:13px;
          opacity:.68;
        }

        .raw {
          margin-top:14px;
          max-width:100%;
          font-size:11px;
          opacity:.5;
          word-break:break-word;
        }

        .status {
          position:absolute;
          left:12px;
          right:12px;
          bottom:10px;
          z-index:3;
          text-align:center;
          font-size:11px;
          opacity:.68;
        }

        .error {
          margin-top:5px;
          color:#ff8a80;
        }
      </style>

      <div class="card">
        <div class="blur"></div>
        <div class="shade"></div>

        <div class="content">
          <div class="badge">ALBUM ART TEST</div>

          ${hasArtwork
            ? `
              <div class="art">
                <img
                  src="${result.artwork}"
                  alt="Okładka utworu"
                >
              </div>
            `
            : `
              <div class="no-art">
                Brak okładki
              </div>
            `
          }

          <div class="title">
            ${this._escape(parsed.title || track || "Brak utworu")}
          </div>

          ${parsed.artist
            ? `
              <div class="artist">
                ${this._escape(parsed.artist)}
              </div>
            `
            : ""
          }

          ${result?.album
            ? `
              <div class="album">
                ${this._escape(result.album)}
              </div>
            `
            : ""
          }

          <div class="raw">
            Sensor: ${this._escape(this._config.entity)}
            <br>
            Wartość: ${this._escape(track || "brak")}
          </div>
        </div>

        <div class="status">
          ${status}
          ${this._error
            ? `<div class="error">${this._escape(this._error)}</div>`
            : ""
          }
        </div>
      </div>
    `;
  }
}

customElements.define(
  "atlascube-album-art-test",
  AtlasCubeAlbumArtTest
);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "atlascube-album-art-test",
  name: "AtlasCube Album Art Test",
  description: "Test wyszukiwania okładek utworów AtlasCube",
  preview: true
});
