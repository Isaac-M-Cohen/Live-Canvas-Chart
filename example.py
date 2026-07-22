from __future__ import annotations

from datetime import datetime, timedelta, timezone
from math import sin

import streamlit as st

from streamlit_live_canvas import chart, records_to_overlays


st.set_page_config(page_title="Streamlit Live Canvas", layout="wide")
st.title("Streamlit Live Canvas")
st.caption("One renderer for fixed history and high-frequency WebSocket updates.")

now = datetime.now(timezone.utc)
price = [
    {
        "timestamp": (now - timedelta(minutes=119 - index)).isoformat(),
        "value": 63_000 + index * 1.8 + sin(index / 7) * 80,
    }
    for index in range(120)
]
trend = []
for index, point in enumerate(price):
    window = price[max(0, index - 9) : index + 1]
    trend.append({"timestamp": point["timestamp"], "value": sum(item["value"] for item in window) / len(window)})

chart(
    [
        {"name": "Price", "color": "#ffad55", "points": price, "primary": True, "fill": True, "width": 2.4},
        {"name": "10-minute trend", "color": "#67a9ff", "points": trend, "dash": "dot"},
    ],
    key="example",
    title="BTC demonstration",
    height=520,
    value_format="currency",
    vertical_lines=[{"timestamp": now.isoformat(), "label": "Now"}],
    point_overlays=records_to_overlays(
        [
            {
                "timestamp": price[48]["timestamp"],
                "value": price[48]["value"],
                "side": "BUY",
                "reason": "Trend confirmation",
                "confidence": 87.4,
            },
            {
                "timestamp": price[88]["timestamp"],
                "value": price[88]["value"],
                "side": "SELL",
                "reason": "Target reached",
                "confidence": 82.1,
            },
        ],
        label="side",
        description="reason",
        group="Trades",
        kind="side",
        fields={"Confidence": "confidence"},
    ),
)
