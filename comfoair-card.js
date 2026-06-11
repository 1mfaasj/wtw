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
      throw new Error("Missing required 'entity' in card config");
    }

    this.config = {
      title: config.title || "",
      entity: config.entity,
      entities: {
        outside_temperature: "sensor.comfoair_outside_temperature",
        intake_fan_rpm: "sensor.comfoair_intake_fan_rpm",
        exhaust_temperature: "sensor.comfoair_exhaust_temperature",
        exhaust_fan_rpm: "sensor.comfoair_exhaust_fan_rpm",
        return_temperature: "sensor.comfoair_return_temperature",
        return_air_level: "sensor.comfoair_return_air_level",
        supply_temperature: "sensor.comfoair_supply_temperature",
        supply_air_level: "sensor.comfoair_supply_air_level",
        filter_status: "sensor.comfoair_filter_status",
        supply_fan_active: "binary_sensor.comfoair_supply_fan_active",
        bypass_open: "binary_sensor.comfoair_bypass_open",
        preheating_state: "binary_sensor.comfoair_preheating_state",
        summer_mode: "binary_sensor.comfoair_summer_mode"
      },
      ...config,
      entities: {
        outside_temperature: "sensor.comfoair_outside_temperature",
        intake_fan_rpm: "sensor.comfoair_intake_fan_rpm",
        exhaust_temperature: "sensor.comfoair_exhaust_temperature",
        exhaust_fan_rpm: "sensor.comfoair_exhaust_fan_rpm",
        return_temperature: "sensor.comfoair_return_temperature",
        return_air_level: "sensor.comfoair_return_air_level",
        supply_temperature: "sensor.comfoair_supply_temperature",
        supply_air_level: "sensor.comfoair_supply_air_level",
        filter_status: "sensor.comfoair_filter_status",
        supply_fan_active: "binary_sensor.comfoair_supply_fan_active",
        bypass_open: "binary_sensor.comfoair_bypass_open",
        preheating_state: "binary_sensor.comfoair_preheating_state",
        summer_mode: "binary_sensor.comfoair_summer_mode",
        ...(config.entities || {})
      }
    };
  }

  getCardSize() {
    return 7;
  }

  _entity(key) {
    return this.config?.entities?.[key];
  }

  getState(entityId) {
    if (!entityId) return "-";
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj || stateObj.state === "unavailable" || stateObj.state === "unknown") {
      return "-";
    }
    return stateObj.state;
  }

  getNumber(entityId) {
    const raw = this.getState(entityId);
    if (raw === "-") return null;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
  }

  getAttr(entityId, attr) {
    if (!entityId) return "-";
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj || !stateObj.attributes || stateObj.attributes[attr] === undefined || stateObj.attributes[attr] === null) {
      return "-";
    }
    return stateObj.attributes[attr];
  }

  getAttrNumber(entityId, attr) {
    const raw = this.getAttr(entityId, attr);
    if (raw === "-") return null;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
  }

  formatTemp(value) {
    if (value === null || value === undefined || value === "-") return "-";
    return `${Math.round(value)}°C`;
  }

  formatRpm(value) {
    if (value === null || value === undefined || value === "-") return "-";
    return `${Math.trunc(value)} rpm`;
  }

  formatPercent(value) {
    if (value === null || value === undefined || value === "-") return "-";
    return `${Math.trunc(value)}%`;
  }

  isFanActive() {
    const intake = this.getNumber(this._entity("intake_fan_rpm"));
    const exhaust = this.getNumber(this._entity("exhaust_fan_rpm"));

    if ((intake !== null && intake > 0) || (exhaust !== null && exhaust > 0)) {
      return true;
    }

    return this.getState(this._entity("supply_fan_active")) === "on";
  }

  getFanIcon() {
    const mode = this.getAttr(this.config.entity, "fan_mode");
    return ({
      auto: "fan",
      off: "fan-off",
      low: "fan-speed-1",
      medium: "fan-speed-2",
      high: "fan-speed-3"
    })[mode] || "fan";
  }

  getCenterTemperature() {
    const climateTemp = this.getAttrNumber(this.config.entity, "temperature");
    if (climateTemp !== null) return climateTemp;

    const temps = [
      this.getNumber(this._entity("outside_temperature")),
      this.getNumber(this._entity("exhaust_temperature")),
      this.getNumber(this._entity("return_temperature")),
      this.getNumber(this._entity("supply_temperature"))
    ].filter(v => typeof v === "number" && !Number.isNaN(v));

    if (!temps.length) return null;

    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    return avg;
  }

  // rijker kleurverloop voor ventilatietemp
  tempToColor(temp) {
    if (temp === null || temp === undefined || Number.isNaN(temp)) {
      return "#b7b7b7";
    }

    if (temp <= 8) return "#4da6ff";     // koud blauw
    if (temp <= 14) return "#6f8dff";    // koel blauw-paars
    if (temp <= 18) return "#9d79d6";    // paars
    if (temp <= 21) return "#c07ab4";    // paars-roze
    if (temp <= 24) return "#ea7b8f";    // warm roze/rood
    return "#ff5e5e";                    // rood
  }

  getFlowSvg() {
    const outside = this.getNumber(this._entity("outside_temperature"));
    const exhaust = this.getNumber(this._entity("exhaust_temperature"));
    const ret = this.getNumber(this._entity("return_temperature"));
    const supply = this.getNumber(this._entity("supply_temperature"));
    const center = this.getCenterTemperature() ?? 20;

    const g1 = `${this._uid}-g1`;
    const g2 = `${this._uid}-g2`;
    const g3 = `${this._uid}-g3`;
    const g4 = `${this._uid}-g4`;
    const shadow = `${this._uid}-shadow`;

    return html`
      <div class="flow">
        <svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <linearGradient id="${g1}" x1="150" y1="75" x2="10" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${this.tempToColor(center)}"></stop>
              <stop offset="100%" stop-color="${this.tempToColor(outside)}"></stop>
            </linearGradient>

            <linearGradient id="${g2}" x1="10" y1="120" x2="150" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${this.tempToColor(exhaust)}"></stop>
              <stop offset="100%" stop-color="${this.tempToColor(center)}"></stop>
            </linearGradient>

            <linearGradient id="${g3}" x1="290" y1="30" x2="150" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${this.tempToColor(ret)}"></stop>
              <stop offset="100%" stop-color="${this.tempToColor(center)}"></stop>
            </linearGradient>

            <linearGradient id="${g4}" x1="150" y1="75" x2="290" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${this.tempToColor(center)}"></stop>
              <stop offset="100%" stop-color="${this.tempToColor(supply)}"></stop>
            </linearGradient>

            <filter id="${shadow}" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="1.6" flood-color="#000000" flood-opacity="0.28"></feDropShadow>
            </filter>
          </defs>

          <!-- flow lijnen -->
          <path d="M150 75 L90 30 L10 30" class="flow-line" stroke="url(#${g1})" filter="url(#${shadow})"></path>
          <path d="M10 120 L90 120 L150 75" class="flow-line" stroke="url(#${g2})" filter="url(#${shadow})"></path>
          <path d="M290 30 L210 30 L150 75" class="flow-line" stroke="url(#${g3})" filter="url(#${shadow})"></path>
          <path d="M150 75 L210 120 L290 120" class="flow-line" stroke="url(#${g4})" filter="url(#${shadow})"></path>

          <!-- middenblokje -->
          <rect x="140" y="65" width="20" height="20" rx="4" class="center-block" filter="url(#${shadow})"></rect>

          <!-- pijlen -->
          <g class="arrow-group">
            <!-- linksboven: naar links -->
            <polygon points="22,30 34,22 34,27 50,27 50,33 34,33 34,38"></polygon>

            <!-- linksonder: naar rechts -->
            <polygon points="22,120 10,112 10,117 26,117 26,123 10,123 10,128" transform="translate(20,0)"></polygon>

            <!-- rechtsboven: naar links -->
            <polygon points="250,30 262,22 262,27 278,27 278,33 262,33 262,38"></polygon>

            <!-- rechtsonder: naar links -->
            <polygon points="250,120 262,112 262,117 278,117 278,123 262,123 262,128"></polygon>
          </g>
        </svg>
      </div>
    `;
  }

  getFanTmpl() {
    return this.isFanActive()
      ? html`<ha-icon icon="mdi:fan"></ha-icon>`
      : html`<ha-icon class="inactive" icon="mdi:fan"></ha-icon>`;
  }

  getAirFilterTmpl() {
    return this.getState(this._entity("filter_status")) === "Full"
      ? html`<ha-icon class="warning" icon="mdi:air-filter"></ha-icon>`
      : html`<ha-icon class="inactive" icon="mdi:air-filter"></ha-icon>`;
  }

  getBypassTmpl() {
    return this.getState(this._entity("bypass_open")) === "on"
      ? html`<ha-icon icon="mdi:electric-switch"></ha-icon>`
      : html`<ha-icon class="inactive" icon="mdi:electric-switch"></ha-icon>`;
  }

  getPreHeatTmpl() {
    return this.getState(this._entity("preheating_state")) === "on"
      ? html`<ha-icon icon="mdi:radiator"></ha-icon>`
      : html`<ha-icon class="inactive" icon="mdi:radiator"></ha-icon>`;
  }

  getSummerModeTmpl() {
    return this.getState(this._entity("summer_mode")) === "off"
      ? html`<ha-icon icon="mdi:snowflake"></ha-icon>`
      : html`<ha-icon class="inactive" icon="mdi:weather-sunny"></ha-icon>`;
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const outsideTemp = this.getNumber(this._entity("outside_temperature"));
    const intakeRpm = this.getNumber(this._entity("intake_fan_rpm"));
    const exhaustTemp = this.getNumber(this._entity("exhaust_temperature"));
    const exhaustRpm = this.getNumber(this._entity("exhaust_fan_rpm"));

    const unitTemp = this.getCenterTemperature();

    const returnTemp = this.getNumber(this._entity("return_temperature"));
    const returnAir = this.getNumber(this._entity("return_air_level"));
    const supplyTemp = this.getNumber(this._entity("supply_temperature"));
    const supplyAir = this.getNumber(this._entity("supply_air_level"));

    return html`
      <ha-card>
        ${this.config.title ? html`<div class="card-title">${this.config.title}</div>` : ""}

        <div class="container">
          <div class="bg">
            ${this.getFlowSvg()}

            <div class="flex-container">
              <div class="flex-col-out">
                <div class="value">${this.formatTemp(outsideTemp)}</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:speedometer"></ha-icon>
                  <span>${this.formatRpm(intakeRpm)}</span>
                </div>

                <div class="value">${this.formatTemp(exhaustTemp)}</div>
                <div class="fan-state">
                  <ha-icon icon="mdi:speedometer"></ha-icon>
                  <span>${this.formatRpm(exhaustRpm)}</span>
                </div>
              </div>

              <div class="flex-col-main">
                <div class="main-temp">${this.formatTemp(unitTemp)}</div>
                <div>
                  <ha-icon
                    class="${this.isFanActive() ? "spin" : ""}"
                    icon="mdi:${this.getFanIcon()}">
                  </ha-icon>
                </div>
              </div>

              <div class="flex-col-in">
                <div class="value">${this.formatTemp(returnTemp)}</div>
                <div class="fan-state right">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  <span>${this.formatPercent(returnAir)}</span>
                </div>

                <div class="value">${this.formatTemp(supplyTemp)}</div>
                <div class="fan-state right">
                  <ha-icon icon="mdi:fan"></ha-icon>
                  <span>${this.formatPercent(supplyAir)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="info-row">
          ${this.getFanTmpl()}
          ${this.getAirFilterTmpl()}
          ${this.getBypassTmpl()}
          ${this.getPreHeatTmpl()}
          ${this.getSummerModeTmpl()}
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      ha-card {
        overflow: hidden;
      }

      .card-title {
        padding: 12px 16px 0 16px;
        font-size: 1rem;
        font-weight: 600;
      }

      .container {
        padding: 12px 12px 0 12px;
      }

      .bg {
        position: relative;
        min-height: 210px;
        border-radius: 18px;
      }

      .flow {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
      }

      .flow svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      .flow-line {
        stroke-width: 16;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .center-block {
        fill: rgba(190, 118, 165, 0.95);
      }

      .arrow-group polygon {
        fill: rgba(255, 255, 255, 0.96);
      }

      .flex-container {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        min-height: 210px;
      }

      .flex-col-out,
      .flex-col-in {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 110px;
        padding: 4px 0;
      }

      .flex-col-in {
        text-align: right;
      }

      .flex-col-main {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        padding: 18px 0 42px 0;
        text-align: center;
        min-width: 80px;
      }

      .main-temp {
        font-size: 2.2rem;
        line-height: 1;
        font-weight: 700;
      }

      .value {
        font-size: 1.05rem;
        line-height: 1.2;
      }

      .fan-state {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 1rem;
        line-height: 1.2;
      }

      .fan-state.right {
        justify-content: flex-end;
      }

      .spin {
        animation: spin 2s linear infinite;
      }

      .info-row {
        background: rgba(0, 0, 0, 0.2);
        margin-top: 10px;
        padding: 8px 10px;
        box-shadow: 0px -2.5px 3px rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: space-around;
        align-items: center;
      }

      .inactive {
        opacity: 0.45;
      }

      .warning {
        color: #d80707;
      }

      ha-icon {
        --mdc-icon-size: 22px;
      }

      .flex-col-main ha-icon {
        --mdc-icon-size: 30px;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
  }
}

customElements.define("comfoair-card", ComfoAirCard);
