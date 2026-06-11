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

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  interpolateColor(c1, c2, factor) {
    const result = c1.map((start, i) => Math.round(start + factor * (c2[i] - start)));
    return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
  }

  tempToColor(temp) {
    if (temp === null || temp === undefined || Number.isNaN(temp)) {
      return "#9aa0a6";
    }

    const t = this.clamp((temp - 0) / 30, 0, 1);

    const cold = [151, 184, 255];
    const mid = [214, 190, 214];
    const warm = [255, 128, 128];

    if (t < 0.5) {
      return this.interpolateColor(cold, mid, t / 0.5);
    }
    return this.interpolateColor(mid, warm, (t - 0.5) / 0.5);
  }

  getValidTemps(...temps) {
    return temps.filter((v) => typeof v === "number" && !Number.isNaN(v));
  }

  getCenterTemp() {
    const climateTemp = this.getAttrNumber(this.config.entity, "temperature");
    if (climateTemp !== null) return climateTemp;

    const outside = this.getNumber(this._entity("outside_temperature"));
    const exhaust = this.getNumber(this._entity("exhaust_temperature"));
    const ret = this.getNumber(this._entity("return_temperature"));
    const supply = this.getNumber(this._entity("supply_temperature"));

    const valid = this.getValidTemps(outside, exhaust, ret, supply);
    if (!valid.length) return 20;

    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  getFlowSvg() {
    const outsideTemp = this.getNumber(this._entity("outside_temperature"));
    const exhaustTemp = this.getNumber(this._entity("exhaust_temperature"));
    const returnTemp = this.getNumber(this._entity("return_temperature"));
    const supplyTemp = this.getNumber(this._entity("supply_temperature"));
    const centerTemp = this.getCenterTemp();

    const outsideColor = this.tempToColor(outsideTemp);
    const exhaustColor = this.tempToColor(exhaustTemp);
    const returnColor = this.tempToColor(returnTemp);
    const supplyColor = this.tempToColor(supplyTemp);
    const centerColor = this.tempToColor(centerTemp);

    const animatedClass = this.isFanActive() ? "flow-dash animate-flow" : "flow-dash";

    const gradOutside = `${this._uid}-grad-outside`;
    const gradExhaust = `${this._uid}-grad-exhaust`;
    const gradReturn = `${this._uid}-grad-return`;
    const gradSupply = `${this._uid}-grad-supply`;
    const shadow = `${this._uid}-flow-shadow`;

    return html`
      <div class="flow">
        <svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <linearGradient id="${gradOutside}" gradientUnits="userSpaceOnUse" x1="10" y1="30" x2="150" y2="75">
              <stop offset="0%" stop-color="${outsideColor}"></stop>
              <stop offset="100%" stop-color="${centerColor}"></stop>
            </linearGradient>

            <linearGradient id="${gradExhaust}" gradientUnits="userSpaceOnUse" x1="150" y1="75" x2="10" y2="120">
              <stop offset="0%" stop-color="${centerColor}"></stop>
              <stop offset="100%" stop-color="${exhaustColor}"></stop>
            </linearGradient>

            <linearGradient id="${gradReturn}" gradientUnits="userSpaceOnUse" x1="290" y1="30" x2="150" y2="75">
              <stop offset="0%" stop-color="${returnColor}"></stop>
              <stop offset="100%" stop-color="${centerColor}"></stop>
            </linearGradient>

            <linearGradient id="${gradSupply}" gradientUnits="userSpaceOnUse" x1="150" y1="75" x2="290" y2="120">
              <stop offset="0%" stop-color="${centerColor}"></stop>
              <stop offset="100%" stop-color="${supplyColor}"></stop>
            </linearGradient>

            <filter id="${shadow}" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.35)"></feDropShadow>
            </filter>
          </defs>

          <path
            d="M10 30 L90 30 L150 75"
            class="flow-line"
            stroke="url(#${gradOutside})"
            filter="url(#${shadow})"
          ></path>

          <path
            d="M150 75 L90 120 L10 120"
            class="flow-line"
            stroke="url(#${gradExhaust})"
            filter="url(#${shadow})"
          ></path>

          <path
            d="M290 30 L210 30 L150 75"
            class="flow-line"
            stroke="url(#${gradReturn})"
            filter="url(#${shadow})"
          ></path>

          <path
            d="M150 75 L210 120 L290 120"
            class="flow-line"
            stroke="url(#${gradSupply})"
            filter="url(#${shadow})"
          ></path>

          <path d="M10 30 L90 30 L150 75" class="${animatedClass}"></path>
          <path d="M150 75 L90 120 L10 120" class="${animatedClass}"></path>
          <path d="M290 30 L210 30 L150 75" class="${animatedClass} reverse"></path>
          <path d="M150 75 L210 120 L290 120" class="${animatedClass}"></path>

          <polygon
            points="16,30 30,22 30,26 42,26 42,34 30,34 30,38"
            fill="#ffffff"
            opacity="0.9"
          ></polygon>

          <polygon
            points="44,120 30,112 30,116 18,116 18,124 30,124 30,128"
            fill="#ffffff"
            opacity="0.9"
          ></polygon>

          <polygon
            points="284,30 270,22 270,26 258,26 258,34 270,34 270,38"
            fill="#ffffff"
            opacity="0.9"
            transform="rotate(180 271 30)"
          ></polygon>

          <polygon
            points="256,120 270,112 270,116 282,116 282,124 270,124 270,128"
            fill="#ffffff"
            opacity="0.9"
          ></polygon>
        </svg>
      </div>
    `;
  }

  getFanTmpl() {
    return this.getState(this._entity("supply_fan_active")) === "on"
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

    const unitTemp = this.getAttrNumber(this.config.entity, "temperature");

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
        fill: none;
        stroke-width: 18;
        stroke-linecap: butt;
        stroke-linejoin: round;
      }

      .flow-dash {
        fill: none;
        stroke: rgba(255, 255, 255, 0.8);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 2 10;
        opacity: 0;
      }

      .animate-flow {
        opacity: 1;
        animation: flowMove 1.4s linear infinite;
      }

      .animate-flow.reverse {
        animation: flowMoveReverse 1.4s linear infinite;
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

      @keyframes flowMove {
        from {
          stroke-dashoffset: 24;
        }
        to {
          stroke-dashoffset: 0;
        }
      }

      @keyframes flowMoveReverse {
        from {
          stroke-dashoffset: 0;
        }
        to {
          stroke-dashoffset: 24;
        }
      }
    `;
  }
}

customElements.define("comfoair-card", ComfoAirCard);
