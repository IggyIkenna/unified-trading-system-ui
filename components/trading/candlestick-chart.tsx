"use client"

// CandlestickChart v4.0 - supports indicator overlays via LineSeries
import * as React from "react"
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType } from "lightweight-charts"
import type { IChartApi, ISeriesApi, CandlestickData, Time, LineData } from "lightweight-charts"

export interface IndicatorOverlay {
  id: string
  label: string
  color: string
  data: Array<{ time: number; value: number | null }>
  lineWidth?: number
  lineStyle?: number
}

interface CandlestickChartProps {
  data: Array<{
    time: number  // Unix timestamp in SECONDS (not milliseconds)
    open: number
    high: number
    low: number
    close: number
    volume?: number
  }>
  indicators?: IndicatorOverlay[]
  height?: number
  className?: string
}

export function CandlestickChart({ data, indicators = [], height = 300, className }: CandlestickChartProps) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const chartRef = React.useRef<IChartApi | null>(null)
  const candlestickSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = React.useRef<ISeriesApi<"Histogram"> | null>(null)
  const indicatorSeriesRef = React.useRef<Map<string, ISeriesApi<"Line">>>(new Map())

  // Initialize chart once
  React.useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.1)" },
        horzLines: { color: "rgba(255, 255, 255, 0.1)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(255, 255, 255, 0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(255, 255, 255, 0.3)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
      indicatorSeriesRef.current.clear()
    }
  }, [])

  // Update data when it changes
  React.useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return
    if (!data || !Array.isArray(data) || data.length === 0) return

    const validData = data.filter(d => typeof d.time === "number" && !isNaN(d.time))
    if (validData.length === 0) return

    const candlestickData: CandlestickData[] = validData.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    const volumeData = validData.map((d) => ({
      time: d.time as Time,
      value: d.volume || 0,
      color: d.close >= d.open ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
    }))

    candlestickSeriesRef.current.setData(candlestickData)
    volumeSeriesRef.current.setData(volumeData)

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [data])

  // Update indicator overlays
  React.useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const currentIds = new Set(indicators.map(i => i.id))
    const existingMap = indicatorSeriesRef.current

    // Remove indicators that are no longer present
    for (const [id, series] of existingMap) {
      if (!currentIds.has(id)) {
        chart.removeSeries(series)
        existingMap.delete(id)
      }
    }

    // Add or update indicators
    for (const indicator of indicators) {
      const lineData: LineData[] = indicator.data
        .filter(d => d.value !== null && typeof d.time === "number")
        .map(d => ({ time: d.time as Time, value: d.value as number }))

      if (lineData.length === 0) continue

      let series = existingMap.get(indicator.id)
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: indicator.color,
          lineWidth: (indicator.lineWidth ?? 1) as 1 | 2 | 3 | 4,
          lineStyle: indicator.lineStyle ?? 0,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })
        existingMap.set(indicator.id, series)
      }
      series.setData(lineData)
    }
  }, [indicators])

  return (
    <div
      ref={chartContainerRef}
      className={className}
      style={{ height, width: "100%" }}
    />
  )
}
