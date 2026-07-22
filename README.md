# Streamlit Live Canvas

[![CI](https://github.com/Isaac-M-Cohen/Streamlit-Live-Canvas/actions/workflows/ci.yml/badge.svg)](https://github.com/Isaac-M-Cohen/Streamlit-Live-Canvas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-38d6aa.svg)](LICENSE)

A low-chrome, high-frequency Canvas chart component for Streamlit. It renders ordinary static time series and can append WebSocket points without redrawing the Streamlit page.

## Features

- Static and streaming data use the same public API
- Smooth Canvas lines, filled areas, markers, bars, multiple axes, and stacked panels
- Automatic visible-range scaling
- Hover inspection and explicit zoom buttons; trackpad zoom is disabled
- Clickable series legend for overlays
- Horizontal rules, vertical event lines, and shaded time bands
- Optional adapter for existing Plotly figures
- No directional arrows or trading opinions in the renderer

## Install

```bash
pip install "streamlit-live-canvas @ git+https://github.com/Isaac-M-Cohen/Streamlit-Live-Canvas.git"
```

For local development:

```bash
pip install -e .
cd streamlit_live_canvas/frontend
npm install
npm run build
```

## Static data

```python
from datetime import datetime, timedelta, timezone

import streamlit as st
from streamlit_live_canvas import chart

now = datetime.now(timezone.utc)
points = [
    {"timestamp": (now + timedelta(minutes=i)).isoformat(), "value": 100 + i * 0.4}
    for i in range(60)
]

chart(
    [{"name": "Price", "color": "#38d6aa", "points": points, "primary": True, "fill": True}],
    key="static-price",
    title="Static price history",
    value_format="currency",
)
```

## Live WebSocket data

Pass the same starting series plus `stream_url`. The socket may emit one point,
a list of points, or a named-series batch:

```json
{"series":"Price","points":[{"timestamp":"2026-07-22T19:20:05Z","value":119284.25}]}
```

```python
chart(
    [{"name": "Price", "color": "#ffad55", "points": history, "primary": True, "fill": True}],
    key="live-price",
    title="Live price",
    value_format="currency",
    window_ms=3 * 60 * 60 * 1000,
    stream_url="ws://localhost:8765/prices",
    stream_series="Price",
)
```

The browser appends accepted points directly to its in-memory series. It does not wait for a Streamlit rerun.

## Plotly migration adapter

```python
from streamlit_live_canvas import plotly_chart

plotly_chart(existing_figure, key="migrated", height=500)
```

The adapter covers the common time-series subset: scatter lines, filled areas,
markers, bars, candlestick close paths, subplot domains, rules, and time bands.
It intentionally does not attempt to reproduce every Plotly chart type.

## Development

```bash
cd streamlit_live_canvas/frontend
npm run typecheck
npm run build
cd ../..
streamlit run example.py
```

Licensed under MIT. See [LICENSE](LICENSE).
