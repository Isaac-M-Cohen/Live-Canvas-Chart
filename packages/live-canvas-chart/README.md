# Live Canvas Chart

Framework-neutral Canvas charts for fixed history and high-frequency streaming time series.

```bash
npm install live-canvas-chart
```

```ts
import { LiveCanvasChart, pointOverlaysFromRecords, pointsFromRecords } from "live-canvas-chart";

const chart = new LiveCanvasChart(document.querySelector("#chart")!, {
  title: "BTC",
  valueFormat: "currency",
  series: [{ name: "Price", color: "#ffad55", points: pointsFromRecords(history), primary: true }],
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

chart.append("Price", { timestamp: new Date().toISOString(), value: 118_250.42 });
```

For a custom element, import `live-canvas-chart/web-component` and use `<live-canvas-chart>`.
