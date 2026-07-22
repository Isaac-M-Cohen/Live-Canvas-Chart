# Live Canvas Chart

[![CI](https://github.com/Isaac-M-Cohen/Live-Canvas-Chart/actions/workflows/ci.yml/badge.svg)](https://github.com/Isaac-M-Cohen/Live-Canvas-Chart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-38d6aa.svg)](LICENSE)

A framework-neutral Canvas chart engine for fixed history and high-frequency streaming time series.

Live Canvas Chart keeps incoming points in the browser, draws with HTML Canvas, and updates without rebuilding the surrounding application. The same engine powers plain JavaScript, a Web Component, React, and Streamlit.

## Packages

| Package | Use it from | Status |
| --- | --- | --- |
| `live-canvas-chart` | JavaScript, TypeScript, Vue, Svelte, Angular, Electron | Core |
| `live-canvas-chart/web-component` | Plain HTML and any custom-element host | Core |
| `live-canvas-chart-react` | React and Next.js client components | Adapter |
| `streamlit-live-canvas` | Python and Streamlit | Adapter |

## Features

- Static data and streaming data use the same schema
- Direct `append()` updates without framework rerenders
- Optional WebSocket ingestion
- Smooth Canvas lines, fills, markers, bars, multiple axes, and stacked panels
- Automatic visible-range scaling
- Button-only time zoom; mouse-wheel and trackpad gestures scroll the surrounding page normally
- Lightweight hover layer with aggregate values for every visible line
- First-class trade/event point overlays with buy/sell shapes, descriptions, and custom hover fields
- Horizontal rules, event lines, and shaded time bands
- Web Component and typed React APIs
- Dataset conversion helpers and a Plotly migration adapter for Streamlit applications

## Core JavaScript API

Build the workspace first:

```bash
git clone https://github.com/Isaac-M-Cohen/Live-Canvas-Chart.git
cd Live-Canvas-Chart
npm install
npm run build
```

```ts
import { LiveCanvasChart, pointOverlaysFromRecords, pointsFromRecords } from "live-canvas-chart";

const chart = new LiveCanvasChart(document.querySelector("#chart")!, {
  title: "BTC perpetual",
  valueFormat: "currency",
  series: [
    {
      name: "Price",
      color: "#ffad55",
      primary: true,
      fill: true,
      points: pointsFromRecords(history),
    },
  ],
  pointOverlays: pointOverlaysFromRecords(trades, {
    timestamp: "executedAt",
    value: "price",
    label: "side",
    description: "reason",
    group: "Trades",
    kind: "side",
    fields: { Confidence: "confidence", Contracts: "quantity" },
  }),
});

chart.append("Price", {
  timestamp: new Date().toISOString(),
  value: 118_250.42,
});
```

The public instance methods are `setData`, `append`, `fit`, `zoomIn`, `zoomOut`, and `destroy`.

## Point overlays and hover details

Use `pointOverlays` for individual events that should stand out from continuous datasets: buys, sells, model signals, pivots, news, or annotations. When the vertical crosshair reaches a marker timestamp, its description and ordered custom fields appear regardless of the pointer's height. The same tooltip also includes every visible line's value at that time.

```ts
const overlays = [{
  timestamp: "2026-07-22T19:20:05Z",
  value: 119_284.25,
  label: "BUY",
  description: "Momentum and volume confirmed the entry.",
  group: "Trades",
  kind: "buy", // automatically uses the buy color and triangle
  fields: [
    { label: "Confidence", value: 87.4, format: "percent", decimals: 1 },
    { label: "Contracts", value: 2, format: "number" },
    { label: "Strategy", value: "15-minute lag" },
  ],
}];
```

Markers support `circle`, `square`, `diamond`, `triangle-up`, and `triangle-down`, along with custom color and size. Set `showTimestamp` or `showValue` to `false` to remove default tooltip rows. Tooltip field values may use `text`, `number`, `currency`, `percent`, or `datetime` formatting.

Pointer movement is drawn on a separate transparent Canvas layer, so static lines and large marker collections are not repainted on every mouse event. The endpoint marker is reserved for charts connected to `streamUrl`; static charts end with the line itself.

Static chart headers display the chart title instead of an arbitrary final value. Charts connected to `streamUrl` retain the live-value headline and title metadata.

For ordinary records, `pointsFromRecords()` and `pointOverlaysFromRecords()` map column names or accessor functions into the chart schema. They have Python equivalents, so dataframe-like data does not need to be manually reshaped.

## Web Component

```ts
import "live-canvas-chart/web-component";

const element = document.querySelector("live-canvas-chart");
element.data = chartData;
element.appendPoints("Price", nextPoint);
```

```html
<live-canvas-chart style="display:block;height:480px"></live-canvas-chart>
```

This is the simplest integration for Vue, Svelte, Angular, server-rendered pages, and ordinary HTML applications.

## React

```tsx
import { LiveCanvas } from "live-canvas-chart-react";

export function PriceChart({ data }) {
  return <LiveCanvas data={data} height={480} />;
}
```

The component exposes an imperative ref with `append`, `fit`, `zoomIn`, and `zoomOut`, allowing high-frequency points to bypass React state updates.

## Streamlit

Install the Python adapter directly from GitHub:

```bash
pip install "streamlit-live-canvas @ git+https://github.com/Isaac-M-Cohen/Live-Canvas-Chart.git"
```

```python
from streamlit_live_canvas import chart, records_to_overlays, records_to_points

history_points = records_to_points(history_df, timestamp="time", value="price")
trade_points = records_to_overlays(
    trades_df,
    timestamp="executed_at",
    value="price",
    label="side",
    description="reason",
    group="Trades",
    kind="side",
    fields={"Confidence": "confidence", "Contracts": "quantity"},
)

chart(
    [{"name": "Price", "color": "#38d6aa", "points": history_points, "primary": True}],
    key="btc-price",
    title="BTC history",
    value_format="currency",
    point_overlays=trade_points,
)
```

The Streamlit adapter also offers `plotly_chart(existing_figure, key="migrated")`. Marker-only Plotly traces are automatically converted into hoverable point overlays; trace text becomes the description and `customdata` becomes additional tooltip fields.

## Generic WebSocket protocol

A stream may emit one point:

```json
{"timestamp":"2026-07-22T19:20:05Z","value":119284.25}
```

It may also emit a list of points or a named-series batch:

```json
{"series":"Price","points":[{"timestamp":"2026-07-22T19:20:05Z","value":119284.25}]}
```

## Repository layout

```text
packages/live-canvas-chart/  Framework-neutral engine and Web Component
packages/react/              React adapter
streamlit_live_canvas/       Python and Streamlit adapter
examples/                    Browser examples
```

## Development

```bash
npm install
npm run typecheck
npm run build
pip install -e ".[devel]"
pytest -q
streamlit run example.py
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the release checklist. Licensed under the [MIT License](LICENSE).
