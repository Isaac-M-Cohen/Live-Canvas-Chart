export type Point = {
    timestamp: string;
    value: number;
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
export type Rule = {
    value?: number;
    timestamp?: string;
    color?: string;
    dash?: string;
    label?: string;
    panel?: string;
};
export type Band = {
    start: string;
    end: string;
    color?: string;
    opacity?: number;
    label?: string;
};
export type Panel = {
    id: string;
    domain?: [number, number];
    label?: string;
};
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
export declare const LIVE_CANVAS_HTML = "\n<section class=\"slc-chart\">\n  <header class=\"slc-head\">\n    <div class=\"slc-quote\">\n      <strong class=\"slc-value\">\u2014</strong>\n      <span class=\"slc-meta\"></span>\n    </div>\n    <div class=\"slc-controls\" aria-label=\"Chart zoom controls\">\n      <button type=\"button\" data-action=\"zoom-out\" aria-label=\"Zoom out\">\u2212</button>\n      <button type=\"button\" data-action=\"fit\">Fit</button>\n      <button type=\"button\" data-action=\"zoom-in\" aria-label=\"Zoom in\">+</button>\n    </div>\n  </header>\n  <div class=\"slc-legend\" aria-label=\"Series visibility\"></div>\n  <div class=\"slc-stage\">\n    <canvas class=\"slc-canvas\" role=\"img\"></canvas>\n    <div class=\"slc-tooltip\" hidden></div>\n  </div>\n  <footer class=\"slc-foot\">\n    <span class=\"slc-status\"></span>\n    <span>Hover to inspect \u00B7 buttons zoom time</span>\n  </footer>\n</section>";
export declare const LIVE_CANVAS_CSS = "\n:host, .live-canvas-host { display: block; height: 100%; width: 100%; }\n* { box-sizing: border-box; }\n.slc-chart {\n  background: var(--live-canvas-background, #090d10);\n  color: var(--live-canvas-text, #d8dee6);\n  display: grid;\n  font-family: var(--live-canvas-font, var(--st-font, Inter, ui-sans-serif, system-ui, sans-serif));\n  grid-template-rows: 42px 0 minmax(160px, 1fr) 24px;\n  height: 100%; min-height: 220px; overflow: hidden; width: 100%;\n}\n.slc-chart[data-has-legend=\"true\"] { grid-template-rows: 42px 30px minmax(160px, 1fr) 24px; }\n.slc-head { align-items: center; display: flex; gap: 12px; min-width: 0; padding: 0 12px; }\n.slc-quote { align-items: baseline; display: flex; gap: 9px; min-width: 0; overflow: hidden; }\n.slc-value {\n  color: var(--live-canvas-value, #f4f7fa); font-size: 23px; font-variant-numeric: tabular-nums;\n  font-weight: 720; letter-spacing: -.025em; white-space: nowrap;\n}\n.slc-meta { color: var(--live-canvas-muted, #7f8995); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.slc-controls { display: flex; gap: 3px; margin-left: auto; }\n.slc-controls button, .slc-legend button {\n  appearance: none; background: transparent; border: 0; border-radius: 5px;\n  color: var(--live-canvas-muted, #8e98a4); cursor: pointer;\n  font: 600 11px/26px var(--live-canvas-font, var(--st-font, Inter, ui-sans-serif, system-ui, sans-serif));\n  height: 26px; padding: 0 7px;\n}\n.slc-controls button { min-width: 27px; }\n.slc-controls button:hover, .slc-controls button:focus-visible,\n.slc-legend button:hover, .slc-legend button:focus-visible {\n  background: rgba(255,255,255,.07); color: var(--live-canvas-value, #f4f7fa); outline: none;\n}\n.slc-legend { align-items: center; display: none; gap: 3px; overflow-x: auto; padding: 0 9px; scrollbar-width: none; white-space: nowrap; }\n.slc-chart[data-has-legend=\"true\"] .slc-legend { display: flex; }\n.slc-legend button { align-items: center; display: inline-flex; flex: 0 0 auto; gap: 6px; }\n.slc-legend button::before { background: var(--series-color); border-radius: 50%; content: \"\"; height: 7px; width: 7px; }\n.slc-legend button[data-hidden=\"true\"] { opacity: .38; text-decoration: line-through; }\n.slc-stage { min-height: 0; position: relative; }\n.slc-canvas { display: block; height: 100%; touch-action: pan-y; width: 100%; }\n.slc-tooltip {\n  background: rgba(17,22,27,.95); border: 1px solid rgba(255,255,255,.09); border-radius: 6px;\n  color: #eef2f6; font-size: 11px; font-variant-numeric: tabular-nums; line-height: 1.45;\n  max-width: 260px; padding: 6px 8px; pointer-events: none; position: absolute;\n  transform: translate(-50%, -100%); white-space: nowrap; z-index: 2;\n}\n.slc-foot { align-items: center; color: var(--live-canvas-muted, #626d78); display: flex; font-size: 10px; justify-content: space-between; padding: 0 12px; }\n.slc-status::before { background: #71808f; border-radius: 50%; content: \"\"; display: inline-block; height: 6px; margin-right: 6px; width: 6px; }\n.slc-status[data-state=\"live\"]::before { background: #38d6aa; }\n.slc-status[data-state=\"offline\"]::before { background: #ff6685; }\n@media (max-width: 560px) { .slc-meta, .slc-foot span:last-child { display: none; } }\n";
export declare class LiveCanvasChart {
    private readonly state;
    constructor(target: ChartTarget, data: ChartData);
    setData(data: ChartData, options?: {
        preserveView?: boolean;
    }): void;
    append(seriesName: string | undefined, points: Point | Point[]): void;
    fit(): void;
    zoomIn(): void;
    zoomOut(): void;
    destroy(): void;
}
export declare function createChart(target: ChartTarget, data: ChartData): LiveCanvasChart;
