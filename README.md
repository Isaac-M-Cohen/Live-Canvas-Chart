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
- Button-only time zoom, with trackpad zoom disabled
- Hover inspection and toggleable overlays
- Horizontal rules, event lines, and shaded time bands
- Web Component and typed React APIs
- Plotly migration adapter for Streamlit applications

## Core JavaScript API

Build the workspace first:

```bash
git clone https://github.com/Isaac-M-Cohen/Live-Canvas-Chart.git
cd Live-Canvas-Chart
npm install
npm run build
```

```ts
import { LiveCanvasChart } from "live-canvas-chart";

const chart = new LiveCanvasChart(document.querySelector("#chart")!, {
  title: "BTC perpetual",
  valueFormat: "currency",
  series: [
    {
      name: "Price",
      color: "#ffad55",
      primary: true,
      fill: true,
      points: history,
    },
  ],
});

chart.append("Price", {
  timestamp: new Date().toISOString(),
  value: 118_250.42,
});
```

The public instance methods are `setData`, `append`, `fit`, `zoomIn`, `zoomOut`, and `destroy`.

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
from streamlit_live_canvas import chart

chart(
    [{"name": "Price", "color": "#38d6aa", "points": history, "primary": True}],
    key="btc-price",
    title="BTC history",
    value_format="currency",
)
```

The Streamlit adapter also offers `plotly_chart(existing_figure, key="migrated")` for migrating common Plotly time-series figures to the Canvas engine.

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
