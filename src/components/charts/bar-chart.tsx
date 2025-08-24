"use client"

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
  color = "hsl(var(--primary))",
  height = 300,
  showXAxis = true,
  showYAxis = true,
  showTooltip = true,
  className = "",
}: BarChartProps) {
  const ChartComponent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        {showXAxis && <XAxis dataKey={xAxisKey} />}
        {showYAxis && <YAxis />}
        {showTooltip && <Tooltip />}
        <Bar dataKey={dataKey} fill={color} />
      </RechartsBarChart>
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