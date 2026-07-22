"""Streamlit Live Canvas: fast Canvas charts for static and streaming series."""

from __future__ import annotations

import base64
import json
import math
import struct
from collections.abc import Iterable, Mapping, Sequence
from datetime import date, datetime
from importlib.metadata import PackageNotFoundError, distribution
from pathlib import Path
from typing import Any, Literal, TypedDict

import streamlit as st


class Point(TypedDict):
    timestamp: str
    value: float


class Series(TypedDict, total=False):
    name: str
    color: str
    points: list[Point]
    width: float
    dash: str
    fill: bool
    primary: bool
    panel: str
    axis: Literal["main", "secondary"]
    style: Literal["line", "bar"]
    show_line: bool
    show_markers: bool


_COMPONENT_HTML = """<div class="streamlit-live-canvas-root"></div>"""
_COMPONENT_CSS = """:host { display: block; height: 100%; width: 100%; }"""


_component: Any | None = None


def _get_component() -> Any:
    """Register lazily so conversion helpers also work outside a Streamlit runtime."""

    global _component
    if _component is None:
        js: str
        try:
            distribution("streamlit-live-canvas")
            js = "index-*.js"
        except PackageNotFoundError:
            assets = Path(__file__).parent / "frontend" / "build"
            matches = list(assets.glob("index-*.js"))
            if len(matches) != 1:
                raise RuntimeError("Build Streamlit Live Canvas with `npm run build` before use.")
            js = matches[0].read_text()
        _component = st.components.v2.component(
            "streamlit-live-canvas.streamlit_live_canvas",
            js=js,
            html=_COMPONENT_HTML,
            css=_COMPONENT_CSS,
        )
    return _component


def chart(
    series: Sequence[Series | Mapping[str, Any]],
    *,
    key: str,
    height: int = 420,
    title: str | None = None,
    value_format: Literal["number", "currency", "percent"] = "number",
    currency: str = "USD",
    decimals: int = 2,
    window_ms: int | None = None,
    stream_url: str | None = None,
    stream_series: str | None = None,
    vertical_lines: Sequence[Mapping[str, Any]] = (),
    horizontal_lines: Sequence[Mapping[str, Any]] = (),
    bands: Sequence[Mapping[str, Any]] = (),
    panels: Sequence[Mapping[str, Any]] = (),
    empty_message: str = "No chart data",
) -> None:
    """Render static data, or append live points from a WebSocket.

    The optional WebSocket may send ``{"timestamp": ..., "value": ...}``, a
    list of those points, or ``{"series": name, "points": [...]}`` messages.
    Existing points stay on the canvas; only incoming points are appended.
    """

    payload = {
        "series": [_normalise_series(item, index) for index, item in enumerate(series)],
        "title": title or "",
        "valueFormat": value_format,
        "currency": currency,
        "decimals": max(0, min(8, int(decimals))),
        "windowMs": int(window_ms) if window_ms else None,
        "streamUrl": stream_url,
        "streamSeries": stream_series,
        "verticalLines": [_json_safe(dict(item)) for item in vertical_lines],
        "horizontalLines": [_json_safe(dict(item)) for item in horizontal_lines],
        "bands": [_json_safe(dict(item)) for item in bands],
        "panels": [_json_safe(dict(item)) for item in panels],
        "emptyMessage": empty_message,
    }
    _get_component()(data=payload, key=key, width="stretch", height=height)


def plotly_chart(
    figure: Any,
    *,
    key: str,
    height: int | None = None,
    value_format: Literal["auto", "number", "currency", "percent"] = "auto",
) -> None:
    """Render a Plotly figure through the Canvas engine.

    This adapter supports lines, filled lines, markers, bars, subplot domains,
    horizontal/vertical rules, and shaded time ranges. Plotly remains optional.
    """

    payload = figure_payload(figure, value_format=value_format)
    chart(
        payload["series"],
        key=key,
        height=height or payload["height"],
        title=payload["title"],
        value_format=payload["value_format"],
        vertical_lines=payload["vertical_lines"],
        horizontal_lines=payload["horizontal_lines"],
        bands=payload["bands"],
        panels=payload["panels"],
        empty_message=payload["empty_message"],
    )


def figure_payload(
    figure: Any,
    *,
    value_format: Literal["auto", "number", "currency", "percent"] = "auto",
) -> dict[str, Any]:
    """Convert a Plotly-compatible figure to the serialisable chart schema."""

    raw = json.loads(figure.to_json()) if hasattr(figure, "to_json") else _json_safe(figure)
    layout = raw.get("layout", {})
    traces = raw.get("data", [])
    palette = ["#38d6aa", "#67a9ff", "#f3bd59", "#b98cff", "#ff6685", "#8e98a4"]
    output: list[Series] = []
    for index, trace in enumerate(traces):
        trace_type = str(trace.get("type", "scatter")).lower()
        if trace_type == "candlestick":
            values = trace.get("close", [])
        else:
            values = trace.get("y", [])
        x_values = trace.get("x", list(range(len(values))))
        points = _points(x_values, values)
        if not points:
            continue
        line = trace.get("line") or {}
        marker = trace.get("marker") or {}
        color = _first_color(line.get("color") or marker.get("color"), palette[index % len(palette)])
        mode = str(trace.get("mode", "lines" if trace_type != "bar" else ""))
        axis_ref = str(trace.get("yaxis", "y"))
        layout_axis = layout.get("yaxis" + axis_ref[1:], {}) if axis_ref != "y" else layout.get("yaxis", {})
        overlaying = layout_axis.get("overlaying")
        panel = str(overlaying) if overlaying else axis_ref
        item: Series = {
            "name": str(trace.get("name") or f"Series {index + 1}"),
            "color": color,
            "points": points,
            "width": float(line.get("width", 2) or 2),
            "dash": str(line.get("dash", "solid")),
            "fill": bool(trace.get("fill") and trace.get("fill") != "none"),
            "primary": index == 0,
            "panel": panel,
            "axis": "secondary" if overlaying else "main",
            "style": "bar" if trace_type == "bar" else "line",
            "show_line": trace_type in {"scatter", "scattergl", "candlestick"} and "markers" not in mode.replace("lines+markers", ""),
            "show_markers": "markers" in mode,
        }
        if "lines" in mode:
            item["show_line"] = True
        if trace_type == "candlestick":
            item["name"] = str(trace.get("name") or "Close")
            item["show_line"] = True
        output.append(item)

    title = _layout_text(layout.get("title"))
    panels = _plotly_panels(layout, output)
    vertical_lines: list[dict[str, Any]] = []
    horizontal_lines: list[dict[str, Any]] = []
    bands: list[dict[str, Any]] = []
    for shape in layout.get("shapes", []):
        line = shape.get("line") or {}
        style = {
            "color": line.get("color") or shape.get("fillcolor") or "#71808f",
            "dash": line.get("dash", "dot"),
            "label": _layout_text(shape.get("label")),
        }
        x0, x1, y0, y1 = shape.get("x0"), shape.get("x1"), shape.get("y0"), shape.get("y1")
        if x0 is not None and x1 is not None and _is_time_like(x0) and _is_time_like(x1):
            if str(x0) == str(x1):
                vertical_lines.append({**style, "timestamp": _timestamp(x0)})
            else:
                bands.append({
                    **style,
                    "start": _timestamp(x0),
                    "end": _timestamp(x1),
                    "opacity": float(shape.get("opacity", 0.1) or 0.1),
                })
        elif _finite(y0) and _finite(y1) and float(y0) == float(y1):
            horizontal_lines.append({**style, "value": float(y0), "panel": _shape_panel(shape)})

    annotations = layout.get("annotations", [])
    empty_message = next((_layout_text(item.get("text")) for item in annotations if item.get("text")), "No chart data")
    inferred = _infer_value_format(layout, title) if value_format == "auto" else value_format
    return {
        "series": output,
        "title": title,
        "height": int(layout.get("height", 430) or 430),
        "value_format": inferred,
        "vertical_lines": vertical_lines,
        "horizontal_lines": horizontal_lines,
        "bands": bands,
        "panels": panels,
        "empty_message": empty_message,
    }


def _normalise_series(item: Mapping[str, Any], index: int) -> Series:
    palette = ["#38d6aa", "#67a9ff", "#f3bd59", "#b98cff", "#ff6685", "#8e98a4"]
    points = item.get("points", [])
    normalised: Series = {
        "name": str(item.get("name") or f"Series {index + 1}"),
        "color": str(item.get("color") or palette[index % len(palette)]),
        "points": _points_from_records(points),
        "width": float(item.get("width", 2) or 2),
        "dash": str(item.get("dash", "solid")),
        "fill": bool(item.get("fill", False)),
        "primary": bool(item.get("primary", index == 0)),
        "panel": str(item.get("panel", "y")),
        "axis": "secondary" if item.get("axis") == "secondary" else "main",
        "style": "bar" if item.get("style") == "bar" else "line",
        "show_line": bool(item.get("show_line", item.get("style") != "bar")),
        "show_markers": bool(item.get("show_markers", False)),
    }
    return normalised


def _points(x_values: Iterable[Any], y_values: Iterable[Any]) -> list[Point]:
    points: list[Point] = []
    for x_value, y_value in zip(_vector(x_values), _vector(y_values), strict=False):
        if not _finite(y_value):
            continue
        points.append({"timestamp": _timestamp(x_value), "value": float(y_value)})
    return points


def _vector(values: Any) -> list[Any]:
    """Decode Plotly 6 typed-array JSON while keeping the adapter dependency-free."""

    if isinstance(values, Mapping) and values.get("bdata") and values.get("dtype"):
        dtype = str(values["dtype"])
        endian = ">" if dtype.startswith(">") else "<"
        token = dtype.lstrip("<>=|")
        formats = {"f8": "d", "f4": "f", "i1": "b", "i2": "h", "i4": "i", "u1": "B", "u2": "H", "u4": "I"}
        code = formats.get(token)
        if not code:
            return []
        raw = base64.b64decode(str(values["bdata"]))
        size = struct.calcsize(code)
        if not raw or len(raw) % size:
            return []
        return list(struct.unpack(f"{endian}{len(raw) // size}{code}", raw))
    if isinstance(values, Sequence) and not isinstance(values, (str, bytes, bytearray)):
        return list(values)
    return []


def _points_from_records(records: Iterable[Mapping[str, Any]]) -> list[Point]:
    return [
        {"timestamp": _timestamp(item["timestamp"]), "value": float(item["value"])}
        for item in records
        if item.get("timestamp") is not None and _finite(item.get("value"))
    ]


def _plotly_panels(layout: Mapping[str, Any], series: Sequence[Series]) -> list[dict[str, Any]]:
    panel_ids = list(dict.fromkeys(item.get("panel", "y") for item in series)) or ["y"]
    output = []
    for panel_id in panel_ids:
        key = "yaxis" + str(panel_id)[1:] if panel_id != "y" else "yaxis"
        axis = layout.get(key, {})
        domain = axis.get("domain", [0, 1])
        output.append({
            "id": panel_id,
            "domain": [float(domain[0]), float(domain[1])],
            "label": _layout_text(axis.get("title")),
        })
    return output


def _shape_panel(shape: Mapping[str, Any]) -> str:
    yref = str(shape.get("yref", "y"))
    return "y" if yref == "paper" else yref


def _infer_value_format(layout: Mapping[str, Any], title: str) -> Literal["number", "currency", "percent"]:
    axis = layout.get("yaxis", {})
    clue = " ".join((str(axis.get("tickformat", "")), _layout_text(axis.get("title")), title)).lower()
    if "%" in clue or "percent" in clue or "probability" in clue:
        return "percent"
    if "$" in clue or any(word in clue for word in ("price", "equity", "p/l", "portfolio", "value")):
        return "currency"
    return "number"


def _layout_text(value: Any) -> str:
    if isinstance(value, Mapping):
        return str(value.get("text", ""))
    return str(value or "")


def _timestamp(value: Any) -> str:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value)).isoformat()
    return str(value)


def _finite(value: Any) -> bool:
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


def _is_time_like(value: Any) -> bool:
    if isinstance(value, (datetime, date)):
        return True
    text = str(value)
    return "-" in text or "T" in text or ":" in text


def _first_color(value: Any, fallback: str) -> str:
    if isinstance(value, Sequence) and not isinstance(value, str):
        value = next((item for item in value if item), fallback)
    return str(value or fallback)


def _json_safe(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [_json_safe(item) for item in value]
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if hasattr(value, "item"):
        return value.item()
    return value


__all__ = ["Point", "Series", "chart", "figure_payload", "plotly_chart"]
