import type { FrontendRenderer, FrontendRendererArgs } from "@streamlit/component-v2-lib";
import { LiveCanvasChart, type ChartData } from "live-canvas-chart";

type ParentElement = FrontendRendererArgs["parentElement"];
const charts = new WeakMap<ParentElement, LiveCanvasChart>();

const StreamlitLiveCanvas: FrontendRenderer<Record<string, never>, ChartData> = ({ parentElement, data }) => {
  let chart = charts.get(parentElement);
  if (chart) {
    chart.setData(data);
  } else {
    chart = new LiveCanvasChart(parentElement, data);
    charts.set(parentElement, chart);
  }

  const mounted = chart;
  return () => {
    if (charts.get(parentElement) !== mounted) return;
    mounted.destroy();
    charts.delete(parentElement);
  };
};

export default StreamlitLiveCanvas;
