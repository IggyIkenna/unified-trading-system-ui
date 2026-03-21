"use client"

// CandlestickChart v3.0 - only accepts Unix timestamps (numbers), not date strings
import * as React from "react"
import { createChart, CandlestickSeries, HistogramSeries, ColorType } from "lightweight-charts"
import type { IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts"

interface CandlestickChartProps {
  data: Array<{
    time: number  // Unix timestamp in SECONDS (not milliseconds)
    open: number
    high: number
    low: number
    close: number
    volume?: number
  }>
  height?: number
  className?: string
}

export function CandlestickChart({ data, height = 300, className }: CandlestickChartProps) {
  const chartContainerRef = React.useRef<HTMLDivElement>(null)
  const chartRef = React.useRef<IChartApi | null>(null)
  const candlestickSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volumeSeriesRef = React.useRef<ISeriesApi<"Histogram"> | null>(null)

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
    }
  }, [])

  // Update data when it changes
  React.useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return
    if (!data || !Array.isArray(data) || data.length === 0) return

    // Filter out any invalid data points (must have numeric time)
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

  return (
    <div
      ref={chartContainerRef}
      className={className}
      style={{ height, width: "100%" }}
    />
  )
}
