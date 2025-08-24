"use client"

import { Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  name: string
  value: number
  [key: string]: unknown
}

interface LineChartProps {
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
  strokeWidth?: number
  className?: string
}

export function LineChart({
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
  strokeWidth = 2,
  className = "",
}: LineChartProps) {
  const ChartComponent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        {showXAxis && <XAxis dataKey={xAxisKey} />}
        {showYAxis && <YAxis />}
        {showTooltip && <Tooltip />}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
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