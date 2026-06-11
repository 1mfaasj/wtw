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
      flow_directions: {
        top_left: "to_edge",
        bottom_left: "to_center",
        top_right: "to_center",
        bottom_right: "to_edge"
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
      },
      flow_directions: {
        top_left: "to_edge",
        bottom_left: "to_center",
        top_right: "to_center",
        bottom_right: "to_edge",
        ...(config.flow_directions || {})
      }
    };
  }

  getCardSize() {
    return 7;
  }

  _entity(key) {
    return this.config?.entities?.[key];
  }

  _flowDir(key) {
    return this.config?.flow_directions?.[key] || "to_edge";
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

  interpolateColor(c1, c2, factor) {
    const result = c1.map((start, i) => Math.round(start + factor * (c2[i] - start)));
    return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
  }

  tempToColor(temp) {
    if (temp === null || temp === undefined || Number.isNaN(temp)) {
      return "#9aa0a6";
    }

    // Praktischer bereik voor ventilatie:
    // <=10°C blauw
    // 10-18°C blauw -> lila
    // 18-25°C lila -> rood
    // >25°C rood
    if (temp <= 10) {
      return "rgb(120, 170, 255)";
    }

    if (temp <= 18) {
      const factor = (temp - 10) / 8;
      return this.interpolateColor(
        [120, 170, 255],
        [214, 190, 214],
        factor
      );
    }

    if (temp <= 25) {
      const factor = (temp - 18) / 7;
      return this.interpolateColor(
        [214, 190, 214],
        [255, 110, 110],
        factor
      );
    }

    return "rgb(255, 90, 90)";
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

  getSegmentDefinition(key) {
    const defs = {
      top_left: {
        edge: [10, 30],
        corner: [90, 30],
        center: [150, 75],
        edgeTempEntity: "outside_temperature",
        edgeSide: "left"
      },
      bottom_left: {
        edge: [10, 120],
        corner: [90, 120],
        center: [150, 75],
        edgeTempEntity: "exhaust_temperature",
        edgeSide: "left"
      },
      top_right: {
        edge: [290, 30],
        corner: [210, 30],
        center: [150, 75],
        edgeTempEntity: "return_temperature",
        edgeSide: "right"
      },
      bottom_right: {
        edge: [290, 120],
        corner: [210, 120],
        center: [150, 75],
        edgeTempEntity: "supply_temperature",
        edgeSide: "right"
      }
    };

    return defs[key];
  }

  buildSegmentPath(key) {
    const def = this.getSegmentDefinition(key);
    const dir = this._flowDir(key);

    if (dir === "to_center") {
      return `M${def.edge[0]} ${def.edge[1]} L${def.corner[0]} ${def.corner[1]} L${def.center[0]} ${def.center[1]}`;
    }

    return `M${def.center[0]} ${def.center[1]} L${def.corner[0]} ${def.corner[1]} L${def.edge[0]} ${def.edge[1]}`;
  }

  buildGradient(key, gradientId, centerColor) {
    const def = this.getSegmentDefinition(key);
    const dir = this._flowDir(key);
    const edgeTemp = this.getNumber(this._entity(def.edgeTempEntity));
    const edgeColor = this.tempToColor(edgeTemp);

    let x1, y1, x2, y2, startColor, endColor;

    if (dir === "to_center") {
      x1 = def.edge[0];
      y1 = def.edge[1];
      x2 = def.center[0];
      y2 = def.center[1];
      startColor = edgeColor;
      endColor = centerColor;
    } else {
      x1 = def.center[0];
      y1 = def.center[1];
      x2 = def.edge[0];
      y2 = def.edge[1];
      startColor = centerColor;
      endColor = edgeColor;
    }

    return html`
      <linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        <stop offset="0%" stop-color="${startColor}"></stop>
        <stop offset="100%" stop-color="${endColor}"></stop>
      </linearGradient>
    `;
  }

  getArrowRotation(key) {
    const def = this.getSegmentDefinition(key);
    const dir = this._flowDir(key);

    if (def.edgeSide === "left") {
      return dir === "to_center" ? 0 : 180;
    }

    return dir === "to_center" ? 180 : 0;
  }

  renderArrow(key) {
    const def = this.getSegmentDefinition(key);
    const dir = this._flowDir(key);

    // Pijl bewust op het rechte buitenste deel zetten
    const x = def.edgeSide === "left" ? 36 : 264;
    const y = def.edge[1];

    const angle =
      def.edgeSide === "left"
        ? (dir === "to_center" ? 0 : 180)
        : (dir === "to_center" ? 180 : 0);

    return html`
      <g transform="translate(${x} ${y}) rotate(${angle})">
        <polygon
          points="0,0 12,-7 12,-3 24,-3 24,3 12,3 12,7"
          fill="#ffffff"
          opacity="0.95">
        </polygon>
      </g>
    `;
  }

  getFlowSvg() {
    const centerTemp = this.getCenterTemp();
    const centerColor = this.tempToColor(centerTemp);

    const shadow = `${this._uid}-flow-shadow`;
    const gradTopLeft = `${this._uid}-grad-top-left`;
    const gradBottomLeft = `${this._uid}-grad-bottom-left`;
    const gradTopRight = `${this._uid}-grad-top-right`;
    const gradBottomRight = `${this._uid}-grad-bottom-right`;

    const topLeftPath = this.buildSegmentPath("top_left");
    const bottomLeftPath = this.buildSegmentPath("bottom_left");
    const topRightPath = this.buildSegmentPath("top_right");
    const bottomRightPath = this.buildSegmentPath("bottom_right");

    const animatedClass = this.isFanActive() ? "flow-dash animate-flow" : "flow-dash";

    return html`
      <div class="flow">
        <svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            ${this.buildGradient("top_left", gradTopLeft, centerColor)}
            ${this.buildGradient("bottom_left", gradBottomLeft, centerColor)}
            ${this.buildGradient("top_right", gradTopRight, centerColor)}
            ${this.buildGradient("bottom_right", gradBottomRight, centerColor)}

            <filter id="${shadow}" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(0,0,0,0.35)"></feDropShadow>
            </filter>
          </defs>

          <!-- basislijnen -->
          <path d="${topLeftPath}" class="flow-line" stroke="url(#${gradTopLeft})" filter="url(#${shadow})"></path>
          <path d="${bottomLeftPath}" class="flow-line" stroke="url(#${gradBottomLeft})" filter="url(#${shadow})"></path>
          <path d="${topRightPath}" class="flow-line" stroke="url(#${gradTopRight})" filter="url(#${shadow})"></path>
          <path d="${bottomRightPath}" class="flow-line" stroke="url(#${gradBottomRight})" filter="url(#${shadow})"></path>

          <!-- stippellijnen altijd zichtbaar, animatie alleen bij fan actief -->
          <path d="${topLeftPath}" class="${animatedClass}"></path>
          <path d="${bottomLeftPath}" class="${animatedClass}"></path>
          <path d="${topRightPath}" class="${animatedClass}"></path>
          <path d="${bottomRightPath}" class="${animatedClass}"></path>

          <!-- pijlen -->
          ${this.renderArrow("top_left")}
          ${this.renderArrow("bottom_left")}
          ${this.renderArrow("top_right")}
          ${this.renderArrow("bottom_right")}
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
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .flow-dash {
        fill: none;
        stroke: rgba(255, 255, 255, 0.85);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 2 10;
        opacity: 0.55;
      }

      .animate-flow {
        opacity: 0.95;
        animation: flowMove 1.2s linear infinite;
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
    `;
  }
}

customElements.define("comfoair-card", ComfoAirCard);