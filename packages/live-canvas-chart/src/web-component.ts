import { LiveCanvasChart, type ChartData, type Point } from "./index";

export interface LiveCanvasElementApi extends HTMLElement {
  data: ChartData | null;
  appendPoints(seriesName: string | undefined, points: Point | Point[]): void;
  fit(): void;
  zoomIn(): void;
  zoomOut(): void;
}

export function defineLiveCanvasElement(tagName = "live-canvas-chart"): CustomElementConstructor | null {
  if (typeof window === "undefined" || typeof customElements === "undefined") return null;
  const registered = customElements.get(tagName);
  if (registered) return registered;

  class LiveCanvasElement extends HTMLElement implements LiveCanvasElementApi {
    static get observedAttributes(): string[] {
      return ["data"];
    }

    private chart: LiveCanvasChart | null = null;
    private chartData: ChartData | null = null;

    connectedCallback(): void {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.style.display ||= "block";
      this.style.minHeight ||= "220px";
      if (this.chartData) this.mountOrUpdate(false);
    }

    disconnectedCallback(): void {
      this.chart?.destroy();
      this.chart = null;
    }

    attributeChangedCallback(name: string, _previous: string | null, value: string | null): void {
      if (name !== "data" || !value) return;
      try {
        this.data = JSON.parse(value) as ChartData;
      } catch {
        throw new Error("The live-canvas-chart data attribute must contain valid JSON.");
      }
    }

    set data(value: ChartData | null) {
      this.chartData = value;
      if (value && this.isConnected) this.mountOrUpdate(true);
    }

    get data(): ChartData | null {
      return this.chartData;
    }

    appendPoints(seriesName: string | undefined, points: Point | Point[]): void {
      this.chart?.append(seriesName, points);
    }

    fit(): void {
      this.chart?.fit();
    }

    zoomIn(): void {
      this.chart?.zoomIn();
    }

    zoomOut(): void {
      this.chart?.zoomOut();
    }

    private mountOrUpdate(preserveView: boolean): void {
      if (!this.chartData || !this.shadowRoot) return;
      if (this.chart) this.chart.setData(this.chartData, { preserveView });
      else this.chart = new LiveCanvasChart(this.shadowRoot, this.chartData);
    }
  }

  customElements.define(tagName, LiveCanvasElement);
  return LiveCanvasElement;
}

defineLiveCanvasElement();
