export type Point = { timestamp: string; value: number };
export type Series = {
  name: string;
  color: string;
  points: Point[];
  width?: number;
  dash?: string;
  fill?: boolean;
  primary?: boolean;
  panel?: string;
  axis?: "main" | "secondary";
  style?: "line" | "bar";
  show_line?: boolean;
  show_markers?: boolean;
};
export type Rule = { value?: number; timestamp?: string; color?: string; dash?: string; label?: string; panel?: string };
export type Band = { start: string; end: string; color?: string; opacity?: number; label?: string };
export type Panel = { id: string; domain?: [number, number]; label?: string };
export type ChartTarget = Element | ShadowRoot;
export type ChartData = {
  series: Series[];
  title?: string;
  valueFormat?: "number" | "currency" | "percent";
  currency?: string;
  decimals?: number;
  windowMs?: number | null;
  streamUrl?: string | null;
  streamSeries?: string | null;
  verticalLines?: Rule[];
  horizontalLines?: Rule[];
  bands?: Band[];
  panels?: Panel[];
  emptyMessage?: string;
};
type ChartState = {
  parent: ChartTarget;
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  tooltip: HTMLElement;
  quote: HTMLElement;
  meta: HTMLElement;
  legend: HTMLElement;
  status: HTMLElement;
  data: ChartData;
  hidden: Set<string>;
  view: [number, number] | null;
  pointerX: number | null;
  width: number;
  height: number;
  frame: number | null;
  resizeObserver: ResizeObserver;
  socket: WebSocket | null;
  reconnectTimer: number | null;
  closed: boolean;
};

export const LIVE_CANVAS_HTML = `
<section class="slc-chart">
  <header class="slc-head">
    <div class="slc-quote">
      <strong class="slc-value">—</strong>
      <span class="slc-meta"></span>
    </div>
    <div class="slc-controls" aria-label="Chart zoom controls">
      <button type="button" data-action="zoom-out" aria-label="Zoom out">−</button>
      <button type="button" data-action="fit">Fit</button>
      <button type="button" data-action="zoom-in" aria-label="Zoom in">+</button>
    </div>
  </header>
  <div class="slc-legend" aria-label="Series visibility"></div>
  <div class="slc-stage">
    <canvas class="slc-canvas" role="img"></canvas>
    <div class="slc-tooltip" hidden></div>
  </div>
  <footer class="slc-foot">
    <span class="slc-status"></span>
    <span>Hover to inspect · buttons zoom time</span>
  </footer>
</section>`;

export const LIVE_CANVAS_CSS = `
:host, .live-canvas-host { display: block; height: 100%; width: 100%; }
* { box-sizing: border-box; }
.slc-chart {
  background: var(--live-canvas-background, #090d10);
  color: var(--live-canvas-text, #d8dee6);
  display: grid;
  font-family: var(--live-canvas-font, var(--st-font, Inter, ui-sans-serif, system-ui, sans-serif));
  grid-template-rows: 42px 0 minmax(160px, 1fr) 24px;
  height: 100%; min-height: 220px; overflow: hidden; width: 100%;
}
.slc-chart[data-has-legend="true"] { grid-template-rows: 42px 30px minmax(160px, 1fr) 24px; }
.slc-head { align-items: center; display: flex; gap: 12px; min-width: 0; padding: 0 12px; }
.slc-quote { align-items: baseline; display: flex; gap: 9px; min-width: 0; overflow: hidden; }
.slc-value {
  color: var(--live-canvas-value, #f4f7fa); font-size: 23px; font-variant-numeric: tabular-nums;
  font-weight: 720; letter-spacing: -.025em; white-space: nowrap;
}
.slc-meta { color: var(--live-canvas-muted, #7f8995); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.slc-controls { display: flex; gap: 3px; margin-left: auto; }
.slc-controls button, .slc-legend button {
  appearance: none; background: transparent; border: 0; border-radius: 5px;
  color: var(--live-canvas-muted, #8e98a4); cursor: pointer;
  font: 600 11px/26px var(--live-canvas-font, var(--st-font, Inter, ui-sans-serif, system-ui, sans-serif));
  height: 26px; padding: 0 7px;
}
.slc-controls button { min-width: 27px; }
.slc-controls button:hover, .slc-controls button:focus-visible,
.slc-legend button:hover, .slc-legend button:focus-visible {
  background: rgba(255,255,255,.07); color: var(--live-canvas-value, #f4f7fa); outline: none;
}
.slc-legend { align-items: center; display: none; gap: 3px; overflow-x: auto; padding: 0 9px; scrollbar-width: none; white-space: nowrap; }
.slc-chart[data-has-legend="true"] .slc-legend { display: flex; }
.slc-legend button { align-items: center; display: inline-flex; flex: 0 0 auto; gap: 6px; }
.slc-legend button::before { background: var(--series-color); border-radius: 50%; content: ""; height: 7px; width: 7px; }
.slc-legend button[data-hidden="true"] { opacity: .38; text-decoration: line-through; }
.slc-stage { min-height: 0; position: relative; }
.slc-canvas { display: block; height: 100%; touch-action: pan-y; width: 100%; }
.slc-tooltip {
  background: rgba(17,22,27,.95); border: 1px solid rgba(255,255,255,.09); border-radius: 6px;
  color: #eef2f6; font-size: 11px; font-variant-numeric: tabular-nums; line-height: 1.45;
  max-width: 260px; padding: 6px 8px; pointer-events: none; position: absolute;
  transform: translate(-50%, -100%); white-space: nowrap; z-index: 2;
}
.slc-foot { align-items: center; color: var(--live-canvas-muted, #626d78); display: flex; font-size: 10px; justify-content: space-between; padding: 0 12px; }
.slc-status::before { background: #71808f; border-radius: 50%; content: ""; display: inline-block; height: 6px; margin-right: 6px; width: 6px; }
.slc-status[data-state="live"]::before { background: #38d6aa; }
.slc-status[data-state="offline"]::before { background: #ff6685; }
@media (max-width: 560px) { .slc-meta, .slc-foot span:last-child { display: none; } }
`;

const GRID = "rgba(136,149,163,.14)";
const MUTED = "#626d78";

function finite(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function timestamp(value: string | number): number {
  return typeof value === "number" ? value : Date.parse(value);
}

function sorted(points: Point[] = []): Point[] {
  return points
    .filter((point) => Number.isFinite(timestamp(point.timestamp)) && finite(point.value) !== null)
    .map((point) => ({ timestamp: point.timestamp, value: Number(point.value) }))
    .sort((left, right) => timestamp(left.timestamp) - timestamp(right.timestamp));
}

function normalise(data: ChartData): ChartData {
  return {
    ...data,
    series: (data.series || []).map((series, index) => ({
      ...series,
      name: series.name || `Series ${index + 1}`,
      color: series.color || "#67a9ff",
      points: sorted(series.points),
      panel: series.panel || "y",
      axis: series.axis || "main",
      style: series.style || "line",
      show_line: series.show_line ?? series.style !== "bar",
      show_markers: series.show_markers ?? false,
    })),
  };
}

function rgba(color: string, alpha: number): string {
  const match = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return color;
  const clean = match[1].length === 3 ? match[1].split("").map((part) => part + part).join("") : match[1];
  const value = Number.parseInt(clean, 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
}

function dashPattern(dash = "solid"): number[] {
  if (dash === "dot") return [2, 5];
  if (dash === "dash") return [7, 5];
  if (dash === "dashdot") return [7, 4, 2, 4];
  return [];
}

function formatValue(data: ChartData, value: number, compact = false): string {
  if (!Number.isFinite(value)) return "—";
  const decimals = compact ? Math.min(1, data.decimals ?? 2) : data.decimals ?? 2;
  if (data.valueFormat === "currency") {
    return value.toLocaleString(undefined, {
      style: "currency",
      currency: data.currency || "USD",
      minimumFractionDigits: compact ? 0 : decimals,
      maximumFractionDigits: decimals,
    });
  }
  if (data.valueFormat === "percent") return `${value.toFixed(decimals)}%`;
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function formatTime(value: number, span: number): string {
  const options: Intl.DateTimeFormatOptions = span > 172_800_000
    ? { month: "short", day: "numeric" }
    : { hour: "numeric", minute: "2-digit", ...(span <= 120_000 ? { second: "2-digit" } : {}) };
  return new Date(value).toLocaleString(undefined, options);
}

function extent(series: Series[]): [number, number] | null {
  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;
  for (const line of series) {
    for (const point of line.points) {
      const next = timestamp(point.timestamp);
      if (!Number.isFinite(next)) continue;
      start = Math.min(start, next);
      end = Math.max(end, next);
    }
  }
  return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null;
}

function visibleDomain(series: Series[], panel: string, axis: string, start: number, end: number): [number, number] {
  const values: number[] = [];
  for (const line of series) {
    if ((line.panel || "y") !== panel || (line.axis || "main") !== axis) continue;
    for (const point of line.points) {
      const time = timestamp(point.timestamp);
      if (time >= start && time <= end && Number.isFinite(point.value)) values.push(point.value);
    }
  }
  if (!values.length) return [0, 1];
  let minimum = Math.min(...values);
  let maximum = Math.max(...values);
  const spread = maximum - minimum;
  const padding = Math.max(spread * 0.1, Math.abs(maximum || 1) * 0.00005);
  minimum -= padding;
  maximum += padding;
  if (minimum === maximum) return [minimum - 0.5, maximum + 0.5];
  return [minimum, maximum];
}

function panelLayout(state: ChartState, top: number, bottom: number): Array<{ id: string; top: number; bottom: number }> {
  const ids = [...new Set(state.data.series.map((series) => series.panel || "y"))];
  const configured = state.data.panels || [];
  if (!ids.length) return [{ id: "y", top, bottom }];
  if (configured.length) {
    return ids.map((id) => {
      const config = configured.find((item) => item.id === id);
      const domain = config?.domain || [0, 1];
      return {
        id,
        top: bottom - domain[1] * (bottom - top),
        bottom: bottom - domain[0] * (bottom - top),
      };
    });
  }
  const gap = ids.length > 1 ? 12 : 0;
  const panelHeight = (bottom - top - gap * (ids.length - 1)) / ids.length;
  return ids.map((id, index) => ({
    id,
    top: top + index * (panelHeight + gap),
    bottom: top + index * (panelHeight + gap) + panelHeight,
  }));
}

function tracePath(context: CanvasRenderingContext2D, coordinates: Array<[number, number]>): void {
  if (!coordinates.length) return;
  context.beginPath();
  context.moveTo(coordinates[0][0], coordinates[0][1]);
  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const current = coordinates[index];
    const next = coordinates[index + 1];
    context.quadraticCurveTo(current[0], current[1], (current[0] + next[0]) / 2, (current[1] + next[1]) / 2);
  }
  if (coordinates.length > 1) context.lineTo(...coordinates[coordinates.length - 1]);
}

function displayPoints(points: Point[], start: number, end: number, maxCount: number): Point[] {
  const visible = points.filter((point) => {
    const time = timestamp(point.timestamp);
    return time >= start && time <= end;
  });
  if (visible.length <= maxCount) return visible;
  const bucketSize = Math.ceil(visible.length / maxCount);
  const output: Point[] = [];
  for (let index = 0; index < visible.length; index += bucketSize) {
    const bucket = visible.slice(index, index + bucketSize);
    output.push({
      timestamp: new Date(bucket.reduce((sum, point) => sum + timestamp(point.timestamp), 0) / bucket.length).toISOString(),
      value: bucket.reduce((sum, point) => sum + point.value, 0) / bucket.length,
    });
  }
  if (output[output.length - 1]?.timestamp !== visible[visible.length - 1].timestamp) output.push(visible[visible.length - 1]);
  return output;
}

function render(state: ChartState): void {
  state.frame = null;
  const { context, data, width, height } = state;
  if (!width || !height) return;
  context.clearRect(0, 0, width, height);
  const visibleSeries = data.series.filter((series) => !state.hidden.has(series.name));
  const dataExtent = extent(visibleSeries);
  if (!dataExtent) {
    context.fillStyle = MUTED;
    context.font = "12px sans-serif";
    context.fillText(data.emptyMessage || "No chart data", 14, 24);
    return;
  }
  if (!state.view) fit(state);
  if (!state.view) return;
  const [start, end] = state.view;
  const span = Math.max(1, end - start);
  const plot = { left: 12, right: Math.max(60, width - 72), top: 8, bottom: height - 27 };
  const plotWidth = Math.max(1, plot.right - plot.left);
  const panels = panelLayout(state, plot.top, plot.bottom);
  const x = (value: string | number) => plot.left + ((timestamp(value) - start) / span) * plotWidth;

  context.save();
  context.strokeStyle = GRID;
  context.fillStyle = MUTED;
  context.font = "10px sans-serif";
  for (const panel of panels) {
    const main = visibleDomain(visibleSeries, panel.id, "main", start, end);
    context.setLineDash([2, 5]);
    for (let index = 0; index < 4; index += 1) {
      const ratio = index / 3;
      const py = panel.top + ratio * (panel.bottom - panel.top);
      context.beginPath();
      context.moveTo(plot.left, py);
      context.lineTo(plot.right, py);
      context.stroke();
      context.textAlign = "left";
      context.fillText(formatValue(data, main[1] - ratio * (main[1] - main[0]), true), plot.right + 8, py + 3);
    }
  }
  context.setLineDash([]);
  for (let index = 0; index < 4; index += 1) {
    const ratio = index / 3;
    const time = start + ratio * span;
    context.textAlign = index === 0 ? "left" : index === 3 ? "right" : "center";
    context.fillText(formatTime(time, span), plot.left + ratio * plotWidth, height - 8);
  }
  context.restore();

  context.save();
  context.beginPath();
  context.rect(plot.left, plot.top, plotWidth, plot.bottom - plot.top);
  context.clip();
  for (const band of data.bands || []) {
    const left = x(band.start);
    const right = x(band.end);
    if (right < plot.left || left > plot.right) continue;
    context.fillStyle = rgba(band.color || "#71808f", band.opacity ?? 0.1);
    context.fillRect(left, plot.top, right - left, plot.bottom - plot.top);
  }
  for (const rule of data.verticalLines || []) {
    if (!rule.timestamp) continue;
    const px = x(rule.timestamp);
    context.strokeStyle = rule.color || "#71808f";
    context.setLineDash(dashPattern(rule.dash || "dot"));
    context.beginPath();
    context.moveTo(px, plot.top);
    context.lineTo(px, plot.bottom);
    context.stroke();
  }

  for (const line of visibleSeries) {
    const panel = panels.find((item) => item.id === (line.panel || "y")) || panels[0];
    const domain = visibleDomain(visibleSeries, panel.id, line.axis || "main", start, end);
    const y = (value: number) => panel.bottom - ((value - domain[0]) / (domain[1] - domain[0])) * (panel.bottom - panel.top);
    const points = displayPoints(line.points, start, end, Math.max(100, Math.floor(plotWidth)));
    const coordinates = points.map((point) => [x(point.timestamp), y(point.value)] as [number, number]);
    if (!coordinates.length) continue;
    if (line.style === "bar") {
      const barWidth = Math.max(2, Math.min(18, plotWidth / Math.max(1, points.length) * 0.72));
      const zero = Math.max(panel.top, Math.min(panel.bottom, y(0)));
      points.forEach((point, index) => {
        const py = y(point.value);
        context.fillStyle = point.value >= 0 ? rgba(line.color, .82) : "rgba(255,102,133,.82)";
        context.fillRect(coordinates[index][0] - barWidth / 2, Math.min(py, zero), barWidth, Math.max(1, Math.abs(zero - py)));
      });
      continue;
    }
    if (line.fill && coordinates.length > 1) {
      tracePath(context, coordinates);
      context.lineTo(coordinates[coordinates.length - 1][0], panel.bottom);
      context.lineTo(coordinates[0][0], panel.bottom);
      context.closePath();
      const gradient = context.createLinearGradient(0, panel.top, 0, panel.bottom);
      gradient.addColorStop(0, rgba(line.color, .20));
      gradient.addColorStop(1, rgba(line.color, .01));
      context.fillStyle = gradient;
      context.fill();
    }
    if (line.show_line !== false) {
      tracePath(context, coordinates);
      context.strokeStyle = line.color;
      context.globalAlpha = line.primary ? 1 : .76;
      context.lineWidth = line.width || 2;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.setLineDash(dashPattern(line.dash));
      context.stroke();
    }
    if (line.show_markers) {
      context.fillStyle = line.color;
      context.globalAlpha = 1;
      for (const [px, py] of coordinates) {
        context.beginPath();
        context.arc(px, py, 4, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = "#090d10";
        context.lineWidth = 1.5;
        context.stroke();
      }
    }
  }

  for (const rule of data.horizontalLines || []) {
    if (finite(rule.value) === null) continue;
    const panel = panels.find((item) => item.id === (rule.panel || "y")) || panels[0];
    const domain = visibleDomain(visibleSeries, panel.id, "main", start, end);
    const py = panel.bottom - ((Number(rule.value) - domain[0]) / (domain[1] - domain[0])) * (panel.bottom - panel.top);
    context.strokeStyle = rule.color || "#71808f";
    context.setLineDash(dashPattern(rule.dash || "dot"));
    context.beginPath();
    context.moveTo(plot.left, py);
    context.lineTo(plot.right, py);
    context.stroke();
  }
  context.restore();

  const primary = visibleSeries.find((line) => line.primary) || visibleSeries[0];
  const current = primary?.points[primary.points.length - 1];
  if (current && timestamp(current.timestamp) >= start && timestamp(current.timestamp) <= end) {
    const panel = panels.find((item) => item.id === (primary.panel || "y")) || panels[0];
    const domain = visibleDomain(visibleSeries, panel.id, primary.axis || "main", start, end);
    const px = x(current.timestamp);
    const py = panel.bottom - ((current.value - domain[0]) / (domain[1] - domain[0])) * (panel.bottom - panel.top);
    context.save();
    context.strokeStyle = rgba(primary.color, .72);
    context.setLineDash([3, 5]);
    context.beginPath();
    context.moveTo(plot.left, py);
    context.lineTo(plot.right, py);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#090d10";
    context.strokeStyle = primary.color;
    context.lineWidth = 2.4;
    context.beginPath();
    context.arc(px, py, 4.5, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  if (state.pointerX !== null && state.pointerX >= plot.left && state.pointerX <= plot.right && primary) {
    const target = start + ((state.pointerX - plot.left) / plotWidth) * span;
    const hover = primary.points.reduce<Point | null>((best, point) => {
      if (!best) return point;
      return Math.abs(timestamp(point.timestamp) - target) < Math.abs(timestamp(best.timestamp) - target) ? point : best;
    }, null);
    if (hover) {
      const px = x(hover.timestamp);
      context.strokeStyle = "rgba(216,222,230,.32)";
      context.beginPath();
      context.moveTo(px, plot.top);
      context.lineTo(px, plot.bottom);
      context.stroke();
      state.tooltip.hidden = false;
      state.tooltip.textContent = `${formatTime(timestamp(hover.timestamp), span)} · ${primary.name} ${formatValue(data, hover.value)}`;
      state.tooltip.style.left = `${Math.min(width - 90, Math.max(90, px))}px`;
      state.tooltip.style.top = `${Math.max(32, plot.top + 30)}px`;
    }
  } else {
    state.tooltip.hidden = true;
  }
}

function schedule(state: ChartState): void {
  if (state.frame !== null || state.closed) return;
  state.frame = requestAnimationFrame(() => render(state));
}

function resize(state: ChartState): void {
  const bounds = state.canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  state.width = Math.max(1, Math.floor(bounds.width));
  state.height = Math.max(1, Math.floor(bounds.height));
  state.canvas.width = Math.floor(state.width * ratio);
  state.canvas.height = Math.floor(state.height * ratio);
  state.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  schedule(state);
}

function fit(state: ChartState): void {
  const dataExtent = extent(state.data.series.filter((line) => !state.hidden.has(line.name)));
  if (!dataExtent) return;
  const [minimum, maximum] = dataExtent;
  const end = maximum === minimum ? maximum + 1 : maximum;
  const configured = finite(state.data.windowMs);
  state.view = configured && configured > 0 ? [Math.max(minimum, end - configured), end] : [minimum, end];
  schedule(state);
}

function zoom(state: ChartState, factor: number): void {
  if (!state.view) return;
  const center = (state.view[0] + state.view[1]) / 2;
  const half = Math.max(1_000, (state.view[1] - state.view[0]) * factor / 2);
  state.view = [center - half, center + half];
  schedule(state);
}

function updateHeader(state: ChartState): void {
  const primary = state.data.series.find((line) => line.primary) || state.data.series[0];
  const point = primary?.points[primary.points.length - 1];
  state.quote.textContent = point ? formatValue(state.data, point.value) : "—";
  state.meta.textContent = [state.data.title, point ? formatTime(timestamp(point.timestamp), 60_000) : ""].filter(Boolean).join(" · ");
  state.canvas.setAttribute("aria-label", `${state.data.title || primary?.name || "Time series"} chart`);
}

function updateLegend(state: ChartState): void {
  state.legend.replaceChildren();
  state.root.dataset.hasLegend = state.data.series.length > 1 ? "true" : "false";
  for (const line of state.data.series) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = line.name;
    button.style.setProperty("--series-color", line.color);
    button.dataset.hidden = state.hidden.has(line.name) ? "true" : "false";
    button.onclick = () => {
      if (state.hidden.has(line.name)) state.hidden.delete(line.name);
      else state.hidden.add(line.name);
      button.dataset.hidden = state.hidden.has(line.name) ? "true" : "false";
      updateHeader(state);
      schedule(state);
    };
    state.legend.append(button);
  }
}

function incomingPoints(message: unknown): { series?: string; points: Point[] } {
  const body = typeof message === "string" ? JSON.parse(message) : message;
  if (Array.isArray(body)) return { points: body as Point[] };
  if (!body || typeof body !== "object") return { points: [] };
  const record = body as Record<string, unknown>;
  if (Array.isArray(record.points)) return { series: String(record.series || ""), points: record.points as Point[] };
  if (record.timestamp !== undefined && record.value !== undefined) return { points: [record as Point] };
  return { points: [] };
}

function append(state: ChartState, name: string | undefined, points: Point[]): void {
  const target = state.data.series.find((line) => line.name === (name || state.data.streamSeries))
    || state.data.series.find((line) => line.primary)
    || state.data.series[0];
  if (!target) return;
  const newest = timestamp(target.points[target.points.length - 1]?.timestamp || 0);
  const accepted = sorted(points).filter((point) => timestamp(point.timestamp) > newest);
  if (!accepted.length) return;
  target.points = [...target.points, ...accepted].slice(-20_000);
  if (state.data.windowMs) fit(state);
  updateHeader(state);
  schedule(state);
}

function connect(state: ChartState): void {
  if (!state.data.streamUrl || state.closed) return;
  if (state.socket && (state.socket.readyState === WebSocket.OPEN || state.socket.readyState === WebSocket.CONNECTING)) return;
  const socket = new WebSocket(state.data.streamUrl);
  state.socket = socket;
  state.status.dataset.state = "connecting";
  state.status.textContent = "Connecting";
  socket.onopen = () => {
    state.status.dataset.state = "live";
    state.status.textContent = "Live";
  };
  socket.onmessage = (event) => {
    try {
      const message = incomingPoints(event.data);
      append(state, message.series, message.points);
    } catch {
      // Ignore malformed messages without interrupting the chart.
    }
  };
  socket.onerror = () => socket.close();
  socket.onclose = () => {
    if (state.closed) return;
    state.status.dataset.state = "offline";
    state.status.textContent = "Reconnecting";
    if (state.reconnectTimer !== null) clearTimeout(state.reconnectTimer);
    state.reconnectTimer = window.setTimeout(() => connect(state), 900);
  };
}

function prepareTarget(parent: ChartTarget): HTMLElement {
  const style = document.createElement("style");
  style.textContent = LIVE_CANVAS_CSS;
  const host = document.createElement("div");
  host.className = "live-canvas-host";
  host.innerHTML = LIVE_CANVAS_HTML;
  parent.replaceChildren(style, host);
  return host;
}

function mount(parent: ChartTarget, data: ChartData): ChartState | null {
  const host = prepareTarget(parent);
  const root = host.querySelector<HTMLElement>(".slc-chart");
  const canvas = host.querySelector<HTMLCanvasElement>(".slc-canvas");
  const tooltip = host.querySelector<HTMLElement>(".slc-tooltip");
  const quote = host.querySelector<HTMLElement>(".slc-value");
  const meta = host.querySelector<HTMLElement>(".slc-meta");
  const legend = host.querySelector<HTMLElement>(".slc-legend");
  const status = host.querySelector<HTMLElement>(".slc-status");
  const zoomIn = host.querySelector<HTMLButtonElement>('[data-action="zoom-in"]');
  const zoomOut = host.querySelector<HTMLButtonElement>('[data-action="zoom-out"]');
  const fitButton = host.querySelector<HTMLButtonElement>('[data-action="fit"]');
  const context = canvas?.getContext("2d", { alpha: true, desynchronized: true });
  if (!root || !canvas || !context || !tooltip || !quote || !meta || !legend || !status || !zoomIn || !zoomOut || !fitButton) return null;
  const state: ChartState = {
    parent, root, canvas, context, tooltip, quote, meta, legend, status,
    data: normalise(data), hidden: new Set(), view: null, pointerX: null,
    width: 0, height: 0, frame: null, socket: null, reconnectTimer: null,
    resizeObserver: new ResizeObserver(() => resize(state)), closed: false,
  };
  zoomIn.onclick = () => zoom(state, .5);
  zoomOut.onclick = () => zoom(state, 2);
  fitButton.onclick = () => fit(state);
  canvas.onpointermove = (event) => {
    const bounds = canvas.getBoundingClientRect();
    state.pointerX = event.clientX - bounds.left;
    schedule(state);
  };
  canvas.onpointerleave = () => {
    state.pointerX = null;
    tooltip.hidden = true;
    schedule(state);
  };
  state.resizeObserver.observe(canvas);
  status.textContent = state.data.streamUrl ? "Connecting" : "Static dataset";
  status.dataset.state = state.data.streamUrl ? "connecting" : "static";
  updateLegend(state);
  updateHeader(state);
  fit(state);
  resize(state);
  connect(state);
  return state;
}

function destroy(state: ChartState): void {
  state.closed = true;
  if (state.frame !== null) cancelAnimationFrame(state.frame);
  if (state.reconnectTimer !== null) clearTimeout(state.reconnectTimer);
  if (state.socket) state.socket.close();
  state.resizeObserver.disconnect();
  state.parent.replaceChildren();
}

export class LiveCanvasChart {
  private readonly state: ChartState;

  constructor(target: ChartTarget, data: ChartData) {
    const state = mount(target, data);
    if (!state) throw new Error("Live Canvas Chart could not create its rendering surface.");
    this.state = state;
  }

  setData(data: ChartData, options: { preserveView?: boolean } = {}): void {
    const priorUrl = this.state.data.streamUrl;
    this.state.data = normalise(data);
    this.state.hidden = new Set(
      [...this.state.hidden].filter((name) => this.state.data.series.some((line) => line.name === name)),
    );
    if (priorUrl !== this.state.data.streamUrl) {
      if (this.state.socket) {
        this.state.socket.onclose = null;
        this.state.socket.close();
      }
      this.state.socket = null;
      this.state.status.textContent = this.state.data.streamUrl ? "Connecting" : "Static dataset";
      this.state.status.dataset.state = this.state.data.streamUrl ? "connecting" : "static";
      connect(this.state);
    }
    updateLegend(this.state);
    updateHeader(this.state);
    if (options.preserveView === false) {
      this.state.view = null;
      fit(this.state);
    }
    schedule(this.state);
  }

  append(seriesName: string | undefined, points: Point | Point[]): void {
    append(this.state, seriesName, Array.isArray(points) ? points : [points]);
  }

  fit(): void {
    fit(this.state);
  }

  zoomIn(): void {
    zoom(this.state, .5);
  }

  zoomOut(): void {
    zoom(this.state, 2);
  }

  destroy(): void {
    destroy(this.state);
  }
}

export function createChart(target: ChartTarget, data: ChartData): LiveCanvasChart {
  return new LiveCanvasChart(target, data);
}
