import {
  LitElement,
  html,
  css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class ComfoAirCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  constructor() {
    super();
    this._uid = `comfoair-${Math.random().toString(36).slice(2, 10)}`;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Missing required 'entity'");
    }

    this.config = config;
  }

  getCardSize() {
    return 7;
  }

  getState(entity) {
    const s = this.hass?.states?.[entity];
    if (!s || s.state === "unavailable" || s.state === "unknown") return "-";
    return s.state;
  }

  getNumber(entity) {
    const v = Number(this.getState(entity));
    return isNaN(v) ? null : v;
  }

  formatTemp(v) {
    return v == null ? "-" : `${Math.round(v)}°C`;
  }

  formatRpm(v) {
    return v == null ? "-" : `${Math.trunc(v)} rpm`;
  }

  formatPercent(v) {
    return v == null ? "-" : `${Math.trunc(v)}%`;
  }

  isFanActive() {
    const a = this.getNumber('sensor.comfoair_intake_fan_rpm');
    const b = this.getNumber('sensor.comfoair_exhaust_fan_rpm');
    return (a > 0) || (b > 0);
  }

  getFanIcon() {
    return "fan";
  }

  getFlowSvg() {
    const active = this.isFanActive();

    return html`
    <div class="flow">
      <svg viewBox="0 0 300 150">

        <!-- lijnen -->
        <path d="M150 75 L90 30 L10 30" class="line"></path>
        <path d="M10 120 L90 120 L150 75" class="line"></path>
        <path d="M290 30 L210 30 L150 75" class="line"></path>
        <path d="M150 75 L210 120 L290 120" class="line"></path>

        <!-- stippels CORRECTE richting -->
        <path d="M150 75 L90 30 L10 30"
              class="dash ${active ? 'forward' : ''}"></path>

        <path d="M10 120 L90 120 L150 75"
              class="dash ${active ? 'forward' : ''}"></path>

        <path d="M290 30 L210 30 L150 75"
              class="dash ${active ? 'reverse' : ''}"></path>

        <path d="M150 75 L210 120 L290 120"
              class="dash ${active ? 'forward' : ''}"></path>

        <!-- pijlen -->
        <polygon points="16,30 30,22 30,38" />
        <polygon points="44,120 30,112 30,128" />
        <polygon points="256,30 270,22 270,38" />
        <polygon points="256,120 270,112 270,128" />

      </svg>
    </div>
    `;
  }

  render() {
    return html`
    <ha-card>
      <div class="container">
        <div class="bg">
          ${this.getFlowSvg()}

          <div class="flex">
            <div>
              ${this.formatTemp(this.getNumber('sensor.comfoair_outside_temperature'))}
              <br>
              ${this.formatRpm(this.getNumber('sensor.comfoair_intake_fan_rpm'))}
            </div>

            <div class="center">
              ${this.formatTemp(20)}
              <br>
              <ha-icon class="${this.isFanActive() ? 'spin' : ''}" icon="${this.getFanIcon()}"></ha-icon>
            </div>

            <div>
              ${this.formatTemp(this.getNumber('sensor.comfoair_supply_temperature'))}
              <br>
              ${this.formatPercent(this.getNumber('sensor.comfoair_supply_air_level'))}
            </div>
          </div>

        </div>
      </div>
    </ha-card>
    `;
  }

  static get styles() {
    return css`

      .bg {
        position: relative;
        height: 200px;
      }

      .flow {
        position: absolute;
        inset: 0;
      }

      svg {
        width: 100%;
        height: 100%;
      }

      .line {
        stroke: #d7a4aa;
        stroke-width: 18;
        fill: none;
      }

      .dash {
        stroke: white;
        stroke-width: 3;
        stroke-dasharray: 2 10;
        fill: none;
        opacity: 0.7;
      }

      /* ✅ juiste richtingen */
      .forward {
        animation: fwd 1.2s linear infinite;
      }

      .reverse {
        animation: rev 1.2s linear infinite;
      }

      @keyframes fwd {
        from { stroke-dashoffset: 24; }
        to   { stroke-dashoffset: 0; }
      }

      @keyframes rev {
        from { stroke-dashoffset: 0; }
        to   { stroke-dashoffset: 24; }
      }

      .spin {
        animation: spin 2s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }

      .flex {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: space-between;
      }

      .center {
        text-align: center;
      }

    `;
  }
}

customElements.define("comfoair-card", ComfoAirCard);