"use client"

import { Area, AreaChart as RechartsAreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  name: string
  value: number
  [key: string]: unknown
}

interface AreaChartProps {
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

export function AreaChart({
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
}: AreaChartProps) {
  const ChartComponent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data}>
        {showXAxis && <XAxis dataKey={xAxisKey} />}
        {showYAxis && <YAxis />}
        {showTooltip && <Tooltip />}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.3}
        />
      </RechartsAreaChart>
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