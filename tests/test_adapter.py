from __future__ import annotations

import base64
import json
import struct
from pathlib import Path

from streamlit_live_canvas import figure_payload, records_to_overlays, records_to_points


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


def test_hover_uses_a_separate_layer_and_aggregates_visible_lines() -> None:
    source = (ROOT / "packages" / "live-canvas-chart" / "src" / "index.ts").read_text()

    assert 'class="slc-hover-canvas"' in source
    assert "function renderHover(state: ChartState)" in source
    assert "scheduleHover(state)" in source
    assert "pointOnTrace(trace.coordinates, px)" in source
    assert "traceValues.push" in source
    assert "showAggregateTooltip" in source
    assert 'heading.textContent = "Graph values"' in source


def test_static_charts_do_not_draw_the_stream_endpoint_marker() -> None:
    source = (ROOT / "packages" / "live-canvas-chart" / "src" / "index.ts").read_text()

    assert "if (data.streamUrl && current" in source


def test_static_chart_header_shows_title_instead_of_latest_value() -> None:
    source = (ROOT / "packages" / "live-canvas-chart" / "src" / "index.ts").read_text()

    assert "if (state.data.streamUrl)" in source
    assert 'state.quote.textContent = state.data.title || primary?.name || "Chart"' in source


def test_plotly_marker_traces_become_hoverable_point_overlays() -> None:
    figure = Figure(
        {
            "data": [
                {
                    "type": "scatter",
                    "name": "Price",
                    "x": ["2026-07-22T12:00:00Z", "2026-07-22T12:01:00Z"],
                    "y": [100, 101],
                    "mode": "lines",
                },
                {
                    "type": "scatter",
                    "name": "BUY",
                    "x": ["2026-07-22T12:01:00Z"],
                    "y": [101],
                    "mode": "markers",
                    "text": ["Downtrend entry confirmed"],
                    "customdata": [[0.87, 1]],
                    "marker": {"color": "#38d6aa", "size": 12, "symbol": "triangle-up"},
                },
            ],
            "layout": {"title": "Trades"},
        }
    )

    payload = figure_payload(figure)
    overlay = payload["point_overlays"][0]

    assert len(payload["series"]) == 1
    assert overlay["label"] == "BUY"
    assert overlay["description"] == "Downtrend entry confirmed"
    assert overlay["shape"] == "triangle-up"
    assert overlay["fields"] == [
        {"label": "Detail 1", "value": 0.87},
        {"label": "Detail 2", "value": 1},
    ]


def test_record_conversion_helpers_map_dataset_fields() -> None:
    records = [
        {
            "executed_at": "2026-07-22T12:01:00Z",
            "price": 101.25,
            "side": "BUY",
            "reason": "Momentum confirmation",
            "confidence": 0.91,
        }
    ]

    points = records_to_points(records, timestamp="executed_at", value="price")
    overlays = records_to_overlays(
        records,
        timestamp="executed_at",
        value="price",
        label="side",
        description="reason",
        group="Trades",
        kind="side",
        fields={"Confidence": "confidence"},
    )

    assert points == [{"timestamp": "2026-07-22T12:01:00Z", "value": 101.25}]
    assert overlays[0]["label"] == "BUY"
    assert overlays[0]["group"] == "Trades"
    assert overlays[0]["fields"] == [{"label": "Confidence", "value": 0.91}]


def test_point_overlays_use_crosshair_x_and_safe_custom_tooltips() -> None:
    source = (ROOT / "packages" / "live-canvas-chart" / "src" / "index.ts").read_text()

    assert "pointOverlaysFromRecords" in source
    assert "nearestOverlaysAtX" in source
    assert "Math.abs(nearest.px - px) > 10" in source
    assert "Math.hypot" not in source
    assert "showAggregateTooltip" in source
    assert "textContent = overlay.description" in source
    assert "normaliseFields(overlay.fields)" in source
