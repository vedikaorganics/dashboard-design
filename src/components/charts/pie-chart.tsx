"use client"

import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  name: string
  value: number
  color?: string
}

interface PieChartProps {
  title?: string
  description?: string
  data: DataPoint[]
  colors?: string[]
  height?: number
  showTooltip?: boolean
  innerRadius?: number
  outerRadius?: number
  className?: string
}

const DEFAULT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#8dd1e1",
  "#d084d0",
]

export function PieChart({
  title,
  description,
  data,
  colors = DEFAULT_COLORS,
  height = 300,
  showTooltip = true,
  innerRadius = 0,
  outerRadius = 80,
  className = "",
}: PieChartProps) {
  const ChartComponent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
            />
          ))}
        </Pie>
        {showTooltip && <Tooltip />}
      </RechartsPieChart>
    </ResponsiveContainer>
  )

  const Legend = () => (
    <div className="flex flex-wrap gap-2 mt-4">
      {data.map((entry, index) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: entry.color || colors[index % colors.length],
            }}
          />
          <span className="text-sm text-muted-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
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
          <Legend />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {ChartComponent}
      <Legend />
    </div>
  )
}