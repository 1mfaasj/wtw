import {
  LitElement,
  html,
  css,
  svg
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
    // Robuuster: animeer zodra rpm > 0
    const intake = this.getNumber(this._entity("intake_fan_rpm"));
    const exhaust = this.getNumber(this._entity("exhaust_fan_rpm"));

    if ((intake !== null && intake > 0) || (exhaust !== null && exhaust > 0)) {
      return true;
    }

    // fallback
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
      return "#b8b8b8";
    }

    // Ventilatie-vriendelijk bereik
    // <=10 blauw
    // 10-18 naar lila
    // 18-25 naar rood
    // >25 rood
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
      return `M ${def.edge[0]} ${def.edge[1]} L ${def.corner[0]} ${def.corner[1]} L ${def.center[0]} ${def.center[1]}`;
    }

    return `M ${def.center[0]} ${def.center[1]} L ${def.corner[0]} ${def.corner[1]} L ${def.edge[0]} ${def.edge[1]}`;
  }

  getGradientData(key, centerColor) {
    const def = this.getSegmentDefinition(key);
    const dir = this._flowDir(key);
    const edgeTemp = this.getNumber(this._entity(def.edgeTempEntity));
    const edgeColor = this.tempToColor(edgeTemp);

    if (dir === "to_center") {
      return {
        x1: def.edge[0],
        y1: def.edge[1],
        x2: def.center[0],
        y2: def.center[1],
        startColor: edgeColor,
        endColor: centerColor
      };
    }

    return {
      x1: def.center[0],
      y1: def.center[1],
      x2: def.edge[0],
      y2: def.edge[1],
      startColor: centerColor,
      endColor: edgeColor
    };
  }

  getArrowRotation(key) {
    const def = this.getSegmentDefinition(key);
    const dir = this._flowDir(key);

    if (def.edgeSide === "left") {
      return dir === "to_center" ? 0 : 180;
    }

    return dir === "to_center" ? 180 : 0;
  }

  renderArrowSvg(key) {
    const def = this.getSegmentDefinition(key);
    const angle = this.getArrowRotation(key);

    // netjes op horizontale buitenste lijn
    const x = def.edgeSide === "left" ? 34 : 266;
    const y = def.edge[1];

    return svg`
      <g transform="translate(${x} ${y}) rotate(${angle})">
        <polygon
          points="-12,-7 2,-7 2,-11 16,0 2,11 2,7 -12,7"
          fill="#ffffff"
          opacity="0.95">
        </polygon>
      </g>
    `;
  }

  getFlowSvg() {
    const centerTemp = this.getCenterTemp();
    const centerColor = this.tempToColor(centerTemp);

    const shadow = `${this._uid}-shadow`;
    const gradTopLeft = `${this._uid}-gtl`;
    const gradBottomLeft = `${this._uid}-gbl`;
    const gradTopRight = `${this._uid}-gtr`;
    const gradBottomRight = `${this._uid}-gbr`;

    const topLeftPath = this.buildSegmentPath("top_left");
    const bottomLeftPath = this.buildSegmentPath("bottom_left");
    const topRightPath = this.buildSegmentPath("top_right");
    const bottomRightPath = this.buildSegmentPath("bottom_right");

    const gtl = this.getGradientData("top_left", centerColor);
    const gbl = this.getGradientData("bottom_left", centerColor);
    const gtr = this.getGradientData("top_right", centerColor);
    const gbr = this.getGradientData("bottom_right", centerColor);

    const dashClass = this.isFanActive() ? "flow-dash animate-flow" : "flow-dash";

    return svg`
      <svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="${gradTopLeft}" gradientUnits="userSpaceOnUse" x1="${gtl.x1}" y1="${gtl.y1}" x2="${gtl.x2}" y2="${gtl.y2}">
            <stop offset="0%" stop-color="${gtl.startColor}"></stop>
            <stop offset="100%" stop-color="${gtl.endColor}"></stop>
          </linearGradient>

          <linearGradient id="${gradBottomLeft}" gradientUnits="userSpaceOnUse" x1="${gbl.x1}" y1="${gbl.y1}" x2="${gbl.x2}" y2="${gbl.y2}">
            <stop offset="0%" stop-color="${gbl.startColor}"></stop>
            <stop offset="100%" stop-color="${gbl.endColor}"></stop>
          </linearGradient>

          <linearGradient id="${gradTopRight}" gradientUnits="userSpaceOnUse" x1="${gtr.x1}" y1="${gtr.y1}" x2="${gtr.x2}" y2="${gtr.y2}">
            <stop offset="0%" stop-color="${gtr.startColor}"></stop>
            <stop offset="100%" stop-color="${gtr.endColor}"></stop>
          </linearGradient>

          <linearGradient id="${gradBottomRight}" gradientUnits="userSpaceOnUse" x1="${gbr.x1}" y1="${gbr.y1}" x2="${gbr.x2}" y2="${gbr.y2}">
            <stop offset="0%" stop-color="${gbr.startColor}"></stop>
            <stop offset="100%" stop-color="${gbr.endColor}"></stop>
          </linearGradient>

          <filter id="${shadow}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.3" flood-color="#000000" flood-opacity="0.28"></feDropShadow>
          </filter>
        </defs>

        <!-- basis -->
        <path d="${topLeftPath}" class="flow-line" stroke="url(#${gradTopLeft})" filter="url(#${shadow})"></path>
        <path d="${bottomLeftPath}" class="flow-line" stroke="url(#${gradBottomLeft})" filter="url(#${shadow})"></path>
        <path d="${topRightPath}" class="flow-line" stroke="url(#${gradTopRight})" filter="url(#${shadow})"></path>
        <path d="${bottomRightPath}" class="flow-line" stroke="url(#${gradBottomRight})" filter="url(#${shadow})"></path>

        <!-- witte stippel-overlay -->
        <path d="${topLeftPath}" class="${dashClass}"></path>
        <path d="${bottomLeftPath}" class="${dashClass}"></path>
        <path d="${topRightPath}" class="${dashClass}"></path>
        <path d="${bottomRightPath}" class="${dashClass}"></path>

        <!-- pijlen -->
        ${this.renderArrowSvg("top_left")}
        ${this.renderArrowSvg("bottom_left")}
        ${this.renderArrowSvg("top_right")}
        ${this.renderArrowSvg("bottom_right")}
      </svg>
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
            <div class="flow">
              ${this.getFlowSvg()}
            </div>

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
        stroke: rgba(255, 255, 255, 0.86);
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
