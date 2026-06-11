# Comfoair ventilation Lovelace card

A custom Lovelace card for ComfoAir ventilation systems.

## Features

- Inline SVG airflow visualization
- Dynamic airflow colors based on temperatures
- Animated airflow when fan is active
- Safe fallbacks for unavailable entities
- Configurable entity names
- No PNG assets required

## Installation with HACS

1. Copy this repository into your HACS custom repositories.
2. Install the card.
3. Make sure the Lovelace resource is loaded as a module

`hacsfileslovelace-comfoaircomfoair-card.js`

4. Restart Home Assistant if needed.
5. Add the card to your dashboard.

## Manual installation

1. Copy `comfoair-card.js` to

`configwwwcommunitylovelace-comfoaircomfoair-card.js`

2. Add this Lovelace resource

`localcommunitylovelace-comfoaircomfoair-card.js`

Resource type `module`

3. Restart Home Assistant or hard refresh your browser.

## Basic configuration

```yaml
type customcomfoair-card
entity climate.comfoair
``