"use client"

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DataPoint {
  name: string
  value: number
  [key: string]: unknown
}

interface BarChartProps {
  title?: string
  description?: string
  data: DataPoint[]
  dataKey?: string
  xAxisKey?: string
  color?: string
  height?: number
  showXAxis?: boolean
  showYAxis?: boolean
  showTooltip?: boolean
  className?: string
}

export function BarChart({
  title,
  description,
  data,
  dataKey = "value",
  xAxisKey = "name",
  color = "var(--primary)",
  height = 300,
  showXAxis = true,
  showYAxis = true,
  showTooltip = true,
  className = "",
}: BarChartProps) {
  const chartConfig = {
    [dataKey]: {
      label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
      color: color,
    },
  }

  const ChartComponent = (
    <ChartContainer
      config={chartConfig}
      className={`min-h-[${height}px]`}
    >
      <RechartsBarChart data={data}>
        <CartesianGrid vertical={false} />
        {showXAxis && (
          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
        )}
        {showYAxis && (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
        )}
        {showTooltip && (
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
        )}
        <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={4} />
      </RechartsBarChart>
    </ChartContainer>
  )

  if (title || description) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {ChartComponent}
        </CardContent>
      </Card>
    )
  }

  return <div className={className}>{ChartComponent}</div>
}