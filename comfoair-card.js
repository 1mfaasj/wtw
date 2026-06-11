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
    this.config = config;
  }

  getState(e) {
    return this.hass?.states?.[e]?.state || "-";
  }

  getNum(e) {
    const v = Number(this.getState(e));
    return isNaN(v) ? null : v;
  }

  // ✅ beterde kleur schaal
  tempColor(t) {
    if (t == null) return "#999";

    if (t < 10) return "#4da6ff";        // blauw
    if (t < 18) return "#7d8cff";        // blauw → paars
    if (t < 22) return "#c58bba";        // paars/roze
    if (t < 26) return "#ff7f7f";        // licht rood
    return "#ff4d4d";                    // fel rood
  }

  flow() {

    const outside = this.getNum('sensor.comfoair_outside_temperature');
    const exhaust = this.getNum('sensor.comfoair_exhaust_temperature');
    const ret     = this.getNum('sensor.comfoair_return_temperature');
    const supply  = this.getNum('sensor.comfoair_supply_temperature');

    const center = 20;

    return html`
    <div class="flow">
      <svg viewBox="0 0 300 150">

        <defs>
          <linearGradient id="a" x1="150" y1="75" x2="10" y2="30">
            <stop offset="0%" stop-color="${this.tempColor(center)}"/>
            <stop offset="100%" stop-color="${this.tempColor(outside)}"/>
          </linearGradient>

          <linearGradient id="b" x1="10" y1="120" x2="150" y2="75">
            <stop offset="0%" stop-color="${this.tempColor(exhaust)}"/>
            <stop offset="100%" stop-color="${this.tempColor(center)}"/>
          </linearGradient>

          <linearGradient id="c" x1="290" y1="30" x2="150" y2="75">
            <stop offset="0%" stop-color="${this.tempColor(ret)}"/>
            <stop offset="100%" stop-color="${this.tempColor(center)}"/>
          </linearGradient>

          <linearGradient id="d" x1="150" y1="75" x2="290" y2="120">
            <stop offset="0%" stop-color="${this.tempColor(center)}"/>
            <stop offset="100%" stop-color="${this.tempColor(supply)}"/>
          </linearGradient>
        </defs>

        <!-- lijnen -->
        <path d="M150 75 L90 30 L10 30" class="line" stroke="url(#a)"/>
        <path d="M10 120 L90 120 L150 75" class="line" stroke="url(#b)"/>
        <path d="M290 30 L210 30 L150 75" class="line" stroke="url(#c)"/>
        <path d="M150 75 L210 120 L290 120" class="line" stroke="url(#d)"/>

        <!-- ✅ nette pijlen -->
        <g fill="white">
          <!-- linksboven -->
          <polygon points="30,30 42,24 42,28 56,28 56,32 42,32 42,36"/>

          <!-- linksonder -->
          <polygon points="30,120 18,114 18,118 4,118 4,122 18,122 18,126"/>

          <!-- rechtsboven -->
          <polygon points="270,30 258,24 258,28 244,28 244,32 258,32 258,36"/>

          <!-- rechtsonder -->
          <polygon points="270,120 282,114 282,118 296,118 296,122 282,122 282,126"/>
        </g>

      </svg>
    </div>`;
  }

  render() {
    return html`
    <ha-card>
      <div class="bg">

        ${this.flow()}

      </div>
    </ha-card>
    `;
  }

  static get styles() {
    return css`
      .bg {
        height: 200px;
        position: relative;
      }

      .flow {
        position:absolute;
        inset:0;
      }

      svg {
        width:100%;
        height:100%;
      }

      .line {
        stroke-width: 16;
        fill:none;
        stroke-linecap:round;
        filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3));
      }
    `;
  }
}

customElements.define("comfoair-card", ComfoAirCard);
