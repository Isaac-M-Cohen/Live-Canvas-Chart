export type Point = { timestamp: string; value: number };
export type TooltipValue = string | number | boolean | null;
export type TooltipField = {
  label: string;
  value: TooltipValue;
  format?: "auto" | "text" | "number" | "currency" | "percent" | "datetime";
  decimals?: number;
};
export type OverlayShape = "circle" | "square" | "diamond" | "triangle-up" | "triangle-down";
export type PointOverlay = {
  id?: string;
  timestamp: string;
  value: number;
  label?: string;
  description?: string;
  group?: string;
  kind?: string;
  color?: string;
  size?: number;
  shape?: OverlayShape;
  panel?: string;
  axis?: "main" | "secondary";
  fields?: TooltipField[] | Record<string, TooltipValue>;
  showTimestamp?: boolean;
  showValue?: boolean;
  showInLegend?: boolean;
};
export type DataRecord = Record<string, unknown>;
export type DataAccessor = string | ((record: DataRecord, index: number) => unknown);
export type PointConversion = { timestamp?: DataAccessor; value?: DataAccessor };
export type OverlayConversion = PointConversion & {
  id?: DataAccessor;
  label?: DataAccessor;
  description?: DataAccessor;
  group?: DataAccessor;
  kind?: DataAccessor;
  color?: DataAccessor;
  size?: DataAccessor;
  shape?: DataAccessor;
  panel?: DataAccessor;
  axis?: DataAccessor;
  fields?: Record<string, DataAccessor>;
  showTimestamp?: boolean;
  showValue?: boolean;
  showInLegend?: boolean;
};
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
  pointOverlays?: PointOverlay[];
  emptyMessage?: string;
};
type RenderedTrace = {
  line: Series;
  panel: { id: string; top: number; bottom: number };
  domain: [number, number];
  coordinates: Array<[number, number]>;
};
type RenderedOverlay = { overlay: PointOverlay; px: number; py: number };
type RenderGeometry = {
  plot: { left: number; right: number; top: number; bottom: number };
  start: number;
  span: number;
  timeWidth: number;
  traces: RenderedTrace[];
  overlays: RenderedOverlay[];
};
type ChartState = {
  parent: ChartTarget;
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  hoverCanvas: HTMLCanvasElement;
  hoverContext: CanvasRenderingContext2D;
  tooltip: HTMLElement;
  quote: HTMLElement;
  meta: HTMLElement;
  legend: HTMLElement;
  status: HTMLElement;
  data: ChartData;
  hidden: Set<string>;
  view: [number, number] | null;
  pointerX: number | null;
  pointerY: number | null;
  width: number;
  height: number;
  frame: number | null;
  hoverFrame: number | null;
  geometry: RenderGeometry | null;
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
    <canvas class="slc-hover-canvas" aria-hidden="true"></canvas>
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
.slc-canvas, .slc-hover-canvas { display: block; height: 100%; inset: 0; position: absolute; width: 100%; }
.slc-canvas { touch-action: pan-y; }
.slc-hover-canvas { pointer-events: none; }
.slc-tooltip {
  background: rgba(17,22,27,.95); border: 1px solid rgba(255,255,255,.09); border-radius: 6px;
  color: #eef2f6; font-size: 11px; font-variant-numeric: tabular-nums; line-height: 1.45;
  max-width: 300px; min-width: 124px; padding: 7px 9px; pointer-events: none; position: absolute;
  transform: translate(-50%, -100%); z-index: 2;
}
.slc-tooltip-title { display: block; font-weight: 700; overflow-wrap: anywhere; }
.slc-tooltip-description { color: #b7c0ca; display: block; margin-top: 2px; max-width: 270px; overflow-wrap: anywhere; }
.slc-tooltip-fields { border-top: 1px solid rgba(255,255,255,.08); display: grid; gap: 2px; margin-top: 5px; padding-top: 5px; }
.slc-tooltip-field { display: flex; gap: 12px; justify-content: space-between; min-width: 150px; }
.slc-tooltip-field > span:first-child { color: var(--live-canvas-muted, #8e98a4); }
.slc-tooltip-field > span:last-child { font-weight: 600; overflow-wrap: anywhere; text-align: right; }
.slc-tooltip-field[data-series="true"] > span:first-child::before {
  background: var(--field-color); border-radius: 50%; content: ""; display: inline-block;
  height: 6px; margin-right: 6px; vertical-align: 1px; width: 6px;
}
.slc-tooltip-section-label { color: #8e98a4; display: block; font-size: 9px; font-weight: 700; letter-spacing: .08em; margin-top: 6px; text-transform: uppercase; }
.slc-tooltip[data-placement="below"] { transform: translate(-50%, 10px); }
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

function readAccessor(
  record: DataRecord,
  index: number,
  accessor: DataAccessor | undefined,
  fallback: unknown = undefined,
): unknown {
  if (typeof accessor === "function") return accessor(record, index);
  if (typeof accessor === "string") return Object.hasOwn(record, accessor) ? record[accessor] : accessor;
  return fallback;
}

function timestampValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const milliseconds = Math.abs(value) < 10_000_000_000 ? value * 1_000 : value;
    return new Date(milliseconds).toISOString();
  }
  return String(value ?? "");
}

/** Convert ordinary records into chart points without requiring a dataframe library. */
export function pointsFromRecords(
  records: DataRecord[],
  conversion: PointConversion = {},
): Point[] {
  return sorted(records.map((record, index) => ({
    timestamp: timestampValue(readAccessor(record, index, conversion.timestamp, record.timestamp)),
    value: Number(readAccessor(record, index, conversion.value, record.value)),
  })));
}

/** Convert event/trade records into hoverable point overlays. */
export function pointOverlaysFromRecords(
  records: DataRecord[],
  conversion: OverlayConversion = {},
): PointOverlay[] {
  return records.map((record, index) => {
    const fields = Object.entries(conversion.fields || {}).map(([label, accessor]) => ({
      label,
      value: (
        typeof accessor === "string" && !Object.hasOwn(record, accessor)
          ? null
          : readAccessor(record, index, accessor, null)
      ) as TooltipValue,
    }));
    return {
      id: String(readAccessor(record, index, conversion.id, record.id) ?? ""),
      timestamp: timestampValue(readAccessor(record, index, conversion.timestamp, record.timestamp)),
      value: Number(readAccessor(record, index, conversion.value, record.value)),
      label: String(readAccessor(record, index, conversion.label, record.label) ?? ""),
      description: String(readAccessor(record, index, conversion.description, record.description) ?? ""),
      group: String(readAccessor(record, index, conversion.group, record.group) ?? ""),
      kind: String(readAccessor(record, index, conversion.kind, record.kind) ?? ""),
      color: String(readAccessor(record, index, conversion.color, record.color) ?? ""),
      size: Number(readAccessor(record, index, conversion.size, record.size)),
      shape: String(readAccessor(record, index, conversion.shape, record.shape) ?? "") as OverlayShape,
      panel: String(readAccessor(record, index, conversion.panel, record.panel) ?? "y"),
      axis: (readAccessor(record, index, conversion.axis, record.axis) === "secondary" ? "secondary" : "main") as "secondary" | "main",
      fields,
      showTimestamp: conversion.showTimestamp,
      showValue: conversion.showValue,
      showInLegend: conversion.showInLegend,
    };
  }).filter((overlay) => Number.isFinite(timestamp(overlay.timestamp)) && finite(overlay.value) !== null);
}

function normaliseFields(fields: PointOverlay["fields"]): TooltipField[] {
  if (Array.isArray(fields)) {
    return fields
      .filter((field) => field && field.label)
      .map((field) => ({ ...field, label: String(field.label), value: field.value ?? null }));
  }
  return Object.entries(fields || {}).map(([label, value]) => ({ label, value: value ?? null }));
}

function normaliseOverlay(overlay: PointOverlay): PointOverlay {
  const kind = String(overlay.kind || overlay.group || overlay.label || "event").toLowerCase();
  const isBuy = kind.includes("buy") || kind.includes("entry") || kind.includes("low");
  const isSell = kind.includes("sell") || kind.includes("exit") || kind.includes("high");
  const defaultColor = isBuy ? "#38d6aa" : isSell ? "#ff6685" : "#b98cff";
  const defaultShape: OverlayShape = isBuy ? "triangle-up" : isSell ? "triangle-down" : "diamond";
  return {
    ...overlay,
    timestamp: timestampValue(overlay.timestamp),
    value: Number(overlay.value),
    label: String(overlay.label || overlay.kind || "Event"),
    description: String(overlay.description || ""),
    group: String(overlay.group || ""),
    kind: String(overlay.kind || "event"),
    color: overlay.color || defaultColor,
    size: Math.max(5, Math.min(30, finite(overlay.size) ?? 10)),
    shape: overlay.shape || defaultShape,
    panel: overlay.panel || "y",
    axis: overlay.axis || "main",
    fields: normaliseFields(overlay.fields),
    showTimestamp: overlay.showTimestamp ?? true,
    showValue: overlay.showValue ?? true,
    showInLegend: overlay.showInLegend ?? Boolean(overlay.group),
  };
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
    pointOverlays: (data.pointOverlays || [])
      .filter((overlay) => Number.isFinite(timestamp(overlay.timestamp)) && finite(overlay.value) !== null)
      .map(normaliseOverlay),
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

function extent(series: Series[], overlays: PointOverlay[] = []): [number, number] | null {
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
  for (const overlay of overlays) {
    const next = timestamp(overlay.timestamp);
    if (!Number.isFinite(next)) continue;
    start = Math.min(start, next);
    end = Math.max(end, next);
  }
  return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null;
}

function visibleDomain(
  series: Series[],
  panel: string,
  axis: string,
  start: number,
  end: number,
  overlays: PointOverlay[] = [],
): [number, number] {
  const values: number[] = [];
  for (const line of series) {
    if ((line.panel || "y") !== panel || (line.axis || "main") !== axis) continue;
    for (const point of line.points) {
      const time = timestamp(point.timestamp);
      if (time >= start && time <= end && Number.isFinite(point.value)) values.push(point.value);
    }
  }
  for (const overlay of overlays) {
    const time = timestamp(overlay.timestamp);
    if ((overlay.panel || "y") !== panel || (overlay.axis || "main") !== axis) continue;
    if (time >= start && time <= end && Number.isFinite(overlay.value)) values.push(overlay.value);
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
  const ids = [...new Set([
    ...state.data.series.map((series) => series.panel || "y"),
    ...(state.data.pointOverlays || []).map((overlay) => overlay.panel || "y"),
  ])];
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

function pointOnTrace(
  coordinates: Array<[number, number]>,
  targetX: number,
): [number, number] | null {
  if (!coordinates.length) return null;
  if (coordinates.length === 1) {
    return Math.abs(targetX - coordinates[0][0]) <= 1 ? coordinates[0] : null;
  }
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (targetX < first[0] || targetX > last[0]) return null;
  if (targetX === first[0]) return first;

  let curveIndex = -1;
  let curveLow = 1;
  let curveHigh = coordinates.length - 2;
  while (curveLow <= curveHigh) {
    const middle = (curveLow + curveHigh) >> 1;
    const endX = (coordinates[middle][0] + coordinates[middle + 1][0]) / 2;
    if (targetX <= endX) {
      curveIndex = middle;
      curveHigh = middle - 1;
    } else {
      curveLow = middle + 1;
    }
  }
  if (curveIndex >= 1) {
    const control = coordinates[curveIndex];
    const next = coordinates[curveIndex + 1];
    const start: [number, number] = curveIndex === 1
      ? first
      : [
        (coordinates[curveIndex - 1][0] + control[0]) / 2,
        (coordinates[curveIndex - 1][1] + control[1]) / 2,
      ];
    const end: [number, number] = [
      (control[0] + next[0]) / 2,
      (control[1] + next[1]) / 2,
    ];
    let low = 0;
    let high = 1;
    for (let step = 0; step < 16; step += 1) {
      const middle = (low + high) / 2;
      const inverse = 1 - middle;
      const x = inverse * inverse * start[0]
        + 2 * inverse * middle * control[0]
        + middle * middle * end[0];
      if (x < targetX) low = middle;
      else high = middle;
    }
    const progress = (low + high) / 2;
    const inverse = 1 - progress;
    return [
      targetX,
      inverse * inverse * start[1]
        + 2 * inverse * progress * control[1]
        + progress * progress * end[1],
    ];
  }
  const penultimate = coordinates[coordinates.length - 2];
  const start: [number, number] = coordinates.length === 2
    ? first
    : [(penultimate[0] + last[0]) / 2, (penultimate[1] + last[1]) / 2];
  const width = last[0] - start[0];
  const progress = width > 0 ? (targetX - start[0]) / width : 1;
  return [
    targetX,
    start[1] + (last[1] - start[1]) * Math.max(0, Math.min(1, progress)),
  ];
}

function markerPath(
  context: CanvasRenderingContext2D,
  shape: OverlayShape,
  px: number,
  py: number,
  radius: number,
): void {
  context.beginPath();
  if (shape === "square") {
    context.rect(px - radius, py - radius, radius * 2, radius * 2);
  } else if (shape === "diamond") {
    context.moveTo(px, py - radius);
    context.lineTo(px + radius, py);
    context.lineTo(px, py + radius);
    context.lineTo(px - radius, py);
    context.closePath();
  } else if (shape === "triangle-up") {
    context.moveTo(px, py - radius);
    context.lineTo(px + radius, py + radius);
    context.lineTo(px - radius, py + radius);
    context.closePath();
  } else if (shape === "triangle-down") {
    context.moveTo(px - radius, py - radius);
    context.lineTo(px + radius, py - radius);
    context.lineTo(px, py + radius);
    context.closePath();
  } else {
    context.arc(px, py, radius, 0, Math.PI * 2);
  }
}

function drawPointOverlay(
  context: CanvasRenderingContext2D,
  overlay: PointOverlay,
  px: number,
  py: number,
  hovered = false,
): void {
  const radius = Math.max(2.5, Number(overlay.size || 10) / 2);
  context.save();
  context.globalAlpha = 1;
  if (hovered) {
    context.fillStyle = rgba(overlay.color || "#b98cff", .2);
    markerPath(context, "circle", px, py, radius + 5);
    context.fill();
  }
  context.fillStyle = overlay.color || "#b98cff";
  context.strokeStyle = "#090d10";
  context.lineWidth = hovered ? 2.5 : 2;
  markerPath(context, overlay.shape || "diamond", px, py, radius);
  context.fill();
  context.stroke();
  context.restore();
}

function formatTooltipField(data: ChartData, field: TooltipField): string {
  if (field.value === null || field.value === undefined) return "—";
  if (field.format === "datetime") {
    const parsed = timestamp(String(field.value));
    return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : String(field.value);
  }
  if (typeof field.value === "number" && field.format && field.format !== "text" && field.format !== "auto") {
    return formatValue({ ...data, valueFormat: field.format, decimals: field.decimals ?? data.decimals }, field.value);
  }
  if (typeof field.value === "number") {
    return field.value.toLocaleString(undefined, { maximumFractionDigits: field.decimals ?? 4 });
  }
  if (typeof field.value === "boolean") return field.value ? "Yes" : "No";
  return String(field.value);
}

function positionTooltip(state: ChartState, px: number, py: number): void {
  const half = Math.min(150, Math.max(80, state.width / 2 - 8));
  state.tooltip.style.left = `${Math.min(state.width - half, Math.max(half, px))}px`;
  state.tooltip.style.top = `${Math.max(8, py - 8)}px`;
  state.tooltip.dataset.placement = py < 120 ? "below" : "above";
  state.tooltip.hidden = false;
}

function tooltipFieldRow(
  data: ChartData,
  field: TooltipField,
  color?: string,
): HTMLElement {
  const row = document.createElement("span");
  row.className = "slc-tooltip-field";
  const label = document.createElement("span");
  const value = document.createElement("span");
  label.textContent = field.label;
  value.textContent = formatTooltipField(data, field);
  row.append(label, value);
  if (color) {
    row.dataset.series = "true";
    row.style.setProperty("--field-color", color);
  }
  return row;
}

function showAggregateTooltip(
  state: ChartState,
  time: number,
  span: number,
  px: number,
  py: number,
  traceValues: Array<{ trace: RenderedTrace; value: number }>,
  overlays: PointOverlay[] = [],
): void {
  const children: HTMLElement[] = [];
  if (overlays.length) {
    for (const [index, overlay] of overlays.entries()) {
      if (index > 0) {
        const separator = document.createElement("span");
        separator.className = "slc-tooltip-section-label";
        separator.textContent = "Also at this time";
        children.push(separator);
      }
      const title = document.createElement("span");
      title.className = "slc-tooltip-title";
      title.textContent = overlay.label || overlay.kind || "Event";
      children.push(title);
      if (overlay.description) {
        const description = document.createElement("span");
        description.className = "slc-tooltip-description";
        description.textContent = overlay.description;
        children.push(description);
      }
      const fields: TooltipField[] = [];
      if (overlay.showTimestamp !== false) fields.push({ label: "Time", value: formatTime(time, span) });
      if (overlay.showValue !== false) fields.push({ label: "Value", value: formatValue(state.data, overlay.value) });
      fields.push(...normaliseFields(overlay.fields));
      if (fields.length) {
        const fieldList = document.createElement("span");
        fieldList.className = "slc-tooltip-fields";
        for (const field of fields) fieldList.append(tooltipFieldRow(state.data, field));
        children.push(fieldList);
      }
    }
  } else {
    const title = document.createElement("span");
    title.className = "slc-tooltip-title";
    title.textContent = formatTime(time, span);
    children.push(title);
  }
  if (traceValues.length) {
    if (overlays.length) {
      const heading = document.createElement("span");
      heading.className = "slc-tooltip-section-label";
      heading.textContent = "Graph values";
      children.push(heading);
    }
    const fieldList = document.createElement("span");
    fieldList.className = "slc-tooltip-fields";
    for (const item of traceValues) {
      fieldList.append(tooltipFieldRow(
        state.data,
        { label: item.trace.line.name, value: formatValue(state.data, item.value) },
        item.trace.line.color,
      ));
    }
    children.push(fieldList);
  }
  state.tooltip.replaceChildren(...children);
  positionTooltip(state, px, py);
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
  const visibleOverlays = (data.pointOverlays || []).filter(
    (overlay) => !overlay.group || !state.hidden.has(overlay.group),
  );
  const dataExtent = extent(visibleSeries, visibleOverlays);
  if (!dataExtent) {
    state.geometry = null;
    state.hoverContext.clearRect(0, 0, width, height);
    state.tooltip.hidden = true;
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
  const timeWidth = Math.max(1, plotWidth - 8);
  const panels = panelLayout(state, plot.top, plot.bottom);
  const x = (value: string | number) => plot.left + ((timestamp(value) - start) / span) * timeWidth;

  context.save();
  context.strokeStyle = GRID;
  context.fillStyle = MUTED;
  context.font = "10px sans-serif";
  for (const panel of panels) {
    const main = visibleDomain(visibleSeries, panel.id, "main", start, end, visibleOverlays);
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
    context.fillText(formatTime(time, span), x(time), height - 8);
  }
  context.restore();

  context.save();
  context.beginPath();
  context.rect(plot.left, plot.top, plotWidth, plot.bottom - plot.top);
  context.clip();
  const renderedTraces: RenderedTrace[] = [];
  const renderedOverlays: RenderedOverlay[] = [];
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
    const domain = visibleDomain(visibleSeries, panel.id, line.axis || "main", start, end, visibleOverlays);
    const y = (value: number) => panel.bottom - ((value - domain[0]) / (domain[1] - domain[0])) * (panel.bottom - panel.top);
    const points = displayPoints(line.points, start, end, Math.max(100, Math.floor(plotWidth)));
    const coordinates = points.map((point) => [x(point.timestamp), y(point.value)] as [number, number]);
    if (!coordinates.length) continue;
    if (line.style !== "bar" && line.show_line !== false) {
      renderedTraces.push({ line, panel, domain, coordinates });
    }
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

  for (const overlay of visibleOverlays) {
    const time = timestamp(overlay.timestamp);
    if (time < start || time > end) continue;
    const panel = panels.find((item) => item.id === (overlay.panel || "y")) || panels[0];
    const domain = visibleDomain(
      visibleSeries,
      panel.id,
      overlay.axis || "main",
      start,
      end,
      visibleOverlays,
    );
    const px = x(overlay.timestamp);
    const py = panel.bottom - ((overlay.value - domain[0]) / (domain[1] - domain[0])) * (panel.bottom - panel.top);
    drawPointOverlay(context, overlay, px, py);
    renderedOverlays.push({ overlay, px, py });
  }

  for (const rule of data.horizontalLines || []) {
    if (finite(rule.value) === null) continue;
    const panel = panels.find((item) => item.id === (rule.panel || "y")) || panels[0];
    const domain = visibleDomain(visibleSeries, panel.id, "main", start, end, visibleOverlays);
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
  if (data.streamUrl && current && timestamp(current.timestamp) >= start && timestamp(current.timestamp) <= end) {
    const panel = panels.find((item) => item.id === (primary.panel || "y")) || panels[0];
    const domain = visibleDomain(visibleSeries, panel.id, primary.axis || "main", start, end, visibleOverlays);
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

  state.geometry = {
    plot,
    start,
    span,
    timeWidth,
    traces: renderedTraces,
    overlays: [...renderedOverlays].sort((left, right) => left.px - right.px),
  };
  scheduleHover(state);
}

function nearestOverlaysAtX(overlays: RenderedOverlay[], px: number): RenderedOverlay[] {
  if (!overlays.length) return [];
  let low = 0;
  let high = overlays.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (overlays[middle].px < px) low = middle + 1;
    else high = middle;
  }
  const leftIndex = Math.max(0, low - 1);
  const rightIndex = Math.min(overlays.length - 1, low);
  const nearestIndex = Math.abs(overlays[leftIndex].px - px) <= Math.abs(overlays[rightIndex].px - px)
    ? leftIndex
    : rightIndex;
  const nearest = overlays[nearestIndex];
  if (!nearest || Math.abs(nearest.px - px) > 10) return [];
  const output: RenderedOverlay[] = [];
  let index = nearestIndex;
  while (index > 0 && Math.abs(overlays[index - 1].px - nearest.px) <= 1) index -= 1;
  while (index < overlays.length && Math.abs(overlays[index].px - nearest.px) <= 1) {
    output.push(overlays[index]);
    index += 1;
  }
  return output;
}

function renderHover(state: ChartState): void {
  state.hoverFrame = null;
  const geometry = state.geometry;
  const { pointerX, pointerY, hoverContext: context } = state;
  context.clearRect(0, 0, state.width, state.height);
  if (
    !geometry
    || pointerX === null
    || pointerY === null
    || pointerX < geometry.plot.left
    || pointerX > geometry.plot.left + geometry.timeWidth
    || pointerY < geometry.plot.top
    || pointerY > geometry.plot.bottom
  ) {
    state.tooltip.hidden = true;
    return;
  }

  const selectedOverlays = nearestOverlaysAtX(geometry.overlays, pointerX);
  const px = selectedOverlays[0]?.px ?? pointerX;
  const traceValues: Array<{ trace: RenderedTrace; py: number; value: number }> = [];
  for (const trace of geometry.traces) {
    const point = pointOnTrace(trace.coordinates, px);
    if (!point) continue;
    const panelHeight = Math.max(1, trace.panel.bottom - trace.panel.top);
    traceValues.push({
      trace,
      py: point[1],
      value: trace.domain[0]
        + ((trace.panel.bottom - point[1]) / panelHeight) * (trace.domain[1] - trace.domain[0]),
    });
  }
  if (!traceValues.length && !selectedOverlays.length) {
    state.tooltip.hidden = true;
    return;
  }

  context.save();
  context.strokeStyle = "rgba(216,222,230,.32)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(px, geometry.plot.top);
  context.lineTo(px, geometry.plot.bottom);
  context.stroke();
  for (const item of traceValues) {
    context.fillStyle = item.trace.line.color;
    context.strokeStyle = "#090d10";
    context.lineWidth = 1.7;
    context.beginPath();
    context.arc(px, item.py, 4, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  for (const item of selectedOverlays) {
    drawPointOverlay(context, item.overlay, item.px, item.py, true);
  }
  context.restore();

  const anchorY = selectedOverlays[0]?.py
    ?? traceValues.reduce((closest, item) => (
      Math.abs(item.py - pointerY) < Math.abs(closest.py - pointerY) ? item : closest
    )).py;
  const hoverTime = selectedOverlays.length
    ? timestamp(selectedOverlays[0].overlay.timestamp)
    : geometry.start + ((px - geometry.plot.left) / geometry.timeWidth) * geometry.span;
  showAggregateTooltip(
    state,
    hoverTime,
    geometry.span,
    px,
    anchorY,
    traceValues,
    selectedOverlays.map((item) => item.overlay),
  );
}

function scheduleHover(state: ChartState): void {
  if (state.hoverFrame !== null || state.closed) return;
  state.hoverFrame = requestAnimationFrame(() => renderHover(state));
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
  state.hoverCanvas.width = Math.floor(state.width * ratio);
  state.hoverCanvas.height = Math.floor(state.height * ratio);
  state.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  state.hoverContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  schedule(state);
}

function fit(state: ChartState): void {
  const visibleSeries = state.data.series.filter((line) => !state.hidden.has(line.name));
  const visibleOverlays = (state.data.pointOverlays || []).filter(
    (overlay) => !overlay.group || !state.hidden.has(overlay.group),
  );
  const dataExtent = extent(visibleSeries, visibleOverlays);
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
  const overlayGroups = [...new Map(
    (state.data.pointOverlays || [])
      .filter((overlay) => overlay.showInLegend && overlay.group)
      .map((overlay) => [overlay.group!, overlay.color || "#b98cff"]),
  ).entries()];
  const legendItems = [
    ...state.data.series.map((line) => ({ name: line.name, color: line.color })),
    ...overlayGroups.map(([name, color]) => ({ name, color })),
  ];
  state.root.dataset.hasLegend = legendItems.length > 1 ? "true" : "false";
  for (const item of legendItems) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.name;
    button.style.setProperty("--series-color", item.color);
    button.dataset.hidden = state.hidden.has(item.name) ? "true" : "false";
    button.onclick = () => {
      if (state.hidden.has(item.name)) state.hidden.delete(item.name);
      else state.hidden.add(item.name);
      button.dataset.hidden = state.hidden.has(item.name) ? "true" : "false";
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
  const hoverCanvas = host.querySelector<HTMLCanvasElement>(".slc-hover-canvas");
  const tooltip = host.querySelector<HTMLElement>(".slc-tooltip");
  const quote = host.querySelector<HTMLElement>(".slc-value");
  const meta = host.querySelector<HTMLElement>(".slc-meta");
  const legend = host.querySelector<HTMLElement>(".slc-legend");
  const status = host.querySelector<HTMLElement>(".slc-status");
  const zoomIn = host.querySelector<HTMLButtonElement>('[data-action="zoom-in"]');
  const zoomOut = host.querySelector<HTMLButtonElement>('[data-action="zoom-out"]');
  const fitButton = host.querySelector<HTMLButtonElement>('[data-action="fit"]');
  const context = canvas?.getContext("2d", { alpha: true, desynchronized: true });
  const hoverContext = hoverCanvas?.getContext("2d", { alpha: true, desynchronized: true });
  if (!root || !canvas || !context || !hoverCanvas || !hoverContext || !tooltip || !quote || !meta || !legend || !status || !zoomIn || !zoomOut || !fitButton) return null;
  const state: ChartState = {
    parent, root, canvas, context, hoverCanvas, hoverContext, tooltip, quote, meta, legend, status,
    data: normalise(data), hidden: new Set(), view: null, pointerX: null, pointerY: null,
    width: 0, height: 0, frame: null, hoverFrame: null, geometry: null, socket: null, reconnectTimer: null,
    resizeObserver: new ResizeObserver(() => resize(state)), closed: false,
  };
  zoomIn.onclick = () => zoom(state, .5);
  zoomOut.onclick = () => zoom(state, 2);
  fitButton.onclick = () => fit(state);
  canvas.onpointermove = (event) => {
    const bounds = canvas.getBoundingClientRect();
    state.pointerX = event.clientX - bounds.left;
    state.pointerY = event.clientY - bounds.top;
    scheduleHover(state);
  };
  canvas.onpointerleave = () => {
    state.pointerX = null;
    state.pointerY = null;
    state.hoverContext.clearRect(0, 0, state.width, state.height);
    tooltip.hidden = true;
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
  if (state.hoverFrame !== null) cancelAnimationFrame(state.hoverFrame);
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
      [...this.state.hidden].filter((name) => (
        this.state.data.series.some((line) => line.name === name)
        || (this.state.data.pointOverlays || []).some((overlay) => overlay.group === name)
      )),
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
