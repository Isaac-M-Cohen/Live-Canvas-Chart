from __future__ import annotations

import base64
import json
import struct
from pathlib import Path

from streamlit_live_canvas import figure_payload


ROOT = Path(__file__).parents[1]


class Figure:
    def __init__(self, payload: dict) -> None:
        self.payload = payload

    def to_json(self) -> str:
        return json.dumps(self.payload)


def test_static_plotly_subset_conversion() -> None:
    figure = Figure(
        {
            "data": [
                {
                    "type": "scatter",
                    "name": "Price",
                    "x": ["2026-07-22T12:00:00Z", "2026-07-22T12:01:00Z"],
                    "y": [100, 101],
                    "line": {"color": "#38d6aa"},
                    "fill": "tozeroy",
                }
            ],
            "layout": {"title": {"text": "BTC price"}, "height": 500},
        }
    )

    payload = figure_payload(figure)

    assert payload["title"] == "BTC price"
    assert payload["height"] == 500
    assert payload["value_format"] == "currency"
    assert payload["series"][0]["points"][1]["value"] == 101


def test_plotly_typed_arrays_are_decoded_without_numpy() -> None:
    encoded = base64.b64encode(struct.pack("<2d", 63_000.0, 63_100.0)).decode()
    figure = Figure(
        {
            "data": [
                {
                    "type": "scatter",
                    "x": ["2026-07-22T12:00:00Z", "2026-07-22T12:01:00Z"],
                    "y": {"dtype": "f8", "bdata": encoded},
                }
            ],
            "layout": {},
        }
    )

    values = [point["value"] for point in figure_payload(figure)["series"][0]["points"]]

    assert values == [63_000.0, 63_100.0]


def test_canvas_allows_page_wheel_scrolling() -> None:
    source = (ROOT / "packages" / "live-canvas-chart" / "src" / "index.ts").read_text()
    built_assets = list(
        (ROOT / "streamlit_live_canvas" / "frontend" / "build").glob("index-*.js")
    )

    assert "preventDefault" not in source
    assert len(built_assets) == 1
    assert "preventDefault" not in built_assets[0].read_text()


def test_latest_point_has_a_right_edge_gutter() -> None:
    source = (ROOT / "packages" / "live-canvas-chart" / "src" / "index.ts").read_text()

    assert "const timeWidth = Math.max(1, plotWidth - 8)" in source


def test_hover_tracks_the_closest_visible_rendered_line() -> None:
    source = (ROOT / "packages" / "live-canvas-chart" / "src" / "index.ts").read_text()

    assert "pointOnTrace(trace.coordinates, px)" in source
    assert "Math.abs(state.pointerY - point[1])" in source
    assert "chosen.trace.line.name" in source
    assert "context.arc(px, chosen.py, 4" in source
