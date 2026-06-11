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

  // ✅ temperatuur → kleur omzetting (goede schaal)
  tempToColor(temp) {
    if (temp == null) return "#bdbdbd";

    if (temp <= 10) return "rgb(120,170,255)";
    if (temp <= 18) {
      const f = (temp - 10) / 8;
      return `rgb(${120 + f*94}, ${170 + f*20}, ${255 - f*41})`;
    }
    if (temp <= 25) {
      const f = (temp - 18) / 7;
      return `rgb(${214 + f*41}, ${190 - f*80}, ${214 - f*80})`;
    }
    return "rgb(255,90,90)";
  }

  getFlowSvg() {

    const outside = this.getNumber('sensor.comfoair_outside_temperature');
    const exhaust = this.getNumber('sensor.comfoair_exhaust_temperature');
    const ret = this.getNumber('sensor.comfoair_return_temperature');
    const supply = this.getNumber('sensor.comfoair_supply_temperature');

    const center = 20;

    const cOutside = this.tempToColor(outside);
    const cExhaust = this.tempToColor(exhaust);
    const cReturn  = this.tempToColor(ret);
    const cSupply  = this.tempToColor(supply);
    const cCenter  = this.tempToColor(center);

    return html`
    <div class="flow">
      <svg viewBox="0 0 300 150">

        <defs>
          <linearGradient id="g1" x1="150" y1="75" x2="10" y2="30">
            <stop offset="0%" stop-color="${cCenter}" />
            <stop offset="100%" stop-color="${cOutside}" />
          </linearGradient>

          <linearGradient id="g2" x1="10" y1="120" x2="150" y2="75">
            <stop offset="0%" stop-color="${cExhaust}" />
            <stop offset="100%" stop-color="${cCenter}" />
          </linearGradient>

          <linearGradient id="g3" x1="290" y1="30" x2="150" y2="75">
            <stop offset="0%" stop-color="${cReturn}" />
            <stop offset="100%" stop-color="${cCenter}" />
          </linearGradient>

          <linearGradient id="g4" x1="150" y1="75" x2="290" y2="120">
            <stop offset="0%" stop-color="${cCenter}" />
            <stop offset="100%" stop-color="${cSupply}" />
          </linearGradient>
        </defs>

        <!-- lijnen -->
        <path d="M150 75 L90 30 L10 30" class="line" stroke="url(#g1)"></path>
        <path d="M10 120 L90 120 L150 75" class="line" stroke="url(#g2)"></path>
        <path d="M290 30 L210 30 L150 75" class="line" stroke="url(#g3)"></path>
        <path d="M150 75 L210 120 L290 120" class="line" stroke="url(#g4)"></path>

        <!-- pijlen -->
        <polygon points="16,30 30,22 30,38" class="arrow"></polygon>
        <polygon points="44,120 30,112 30,128" class="arrow"></polygon>
        <polygon points="256,30 270,22 270,38" class="arrow"></polygon>
        <polygon points="256,120 270,112 270,128" class="arrow"></polygon>

      </svg>
    </div>
    `;
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
              <ha-icon class="${this.isFanActive() ? 'spin' : ''}" icon="mdi:fan"></ha-icon>
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
        stroke-width: 18;
        fill: none;
      }

      .arrow {
        fill: white;
        opacity: 0.9;
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
