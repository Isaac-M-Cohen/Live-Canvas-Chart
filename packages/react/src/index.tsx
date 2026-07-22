import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from "react";
import { LiveCanvasChart, type ChartData, type Point } from "live-canvas-chart";

export type { Band, ChartData, Panel, Point, Rule, Series } from "live-canvas-chart";

export interface LiveCanvasHandle {
  append(seriesName: string | undefined, points: Point | Point[]): void;
  fit(): void;
  zoomIn(): void;
  zoomOut(): void;
}

export interface LiveCanvasProps {
  data: ChartData;
  className?: string;
  height?: number | string;
  style?: CSSProperties;
}

export const LiveCanvas = forwardRef<LiveCanvasHandle, LiveCanvasProps>(function LiveCanvas(
  { data, className, height = 420, style },
  forwardedRef,
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<LiveCanvasChart | null>(null);

  useLayoutEffect(() => {
    if (!elementRef.current) return;
    chartRef.current = new LiveCanvasChart(elementRef.current, data);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setData(data);
  }, [data]);

  useImperativeHandle(forwardedRef, () => ({
    append: (seriesName, points) => chartRef.current?.append(seriesName, points),
    fit: () => chartRef.current?.fit(),
    zoomIn: () => chartRef.current?.zoomIn(),
    zoomOut: () => chartRef.current?.zoomOut(),
  }), []);

  return (
    <div
      className={className}
      ref={elementRef}
      style={{ height, minHeight: 220, width: "100%", ...style }}
    />
  );
});
