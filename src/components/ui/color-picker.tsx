"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value?: string
  onChange?: (color: string) => void
  className?: string
  disabled?: boolean
}

const commonColors = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#000080", "#008000",
  "#FF4500", "#4B0082", "#FFD700", "#DC143C", "#00CED1"
]

export function ColorPicker({ value = "#000000", onChange, className, disabled }: ColorPickerProps) {
  const [inputValue, setInputValue] = React.useState(value)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleColorChange = (color: string) => {
    setInputValue(color)
    onChange?.(color)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    if (newValue.match(/^#[0-9A-Fa-f]{6}$/)) {
      onChange?.(newValue)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.match(/^#[0-9A-Fa-f]{6}$/)) {
      onChange?.(inputValue)
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start gap-2", className)}
        >
          <div 
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: value }}
          />
          <span className="flex-1 text-left">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded border flex-shrink-0"
              style={{ backgroundColor: value }}
            />
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder="#000000"
              className="font-mono text-sm"
            />
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Common Colors</p>
            <div className="grid grid-cols-10 gap-1">
              {commonColors.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-6 h-6 rounded border-2 hover:scale-110 transition-transform",
                    value === color ? "border-primary" : "border-transparent hover:border-muted-foreground"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div>
            <input
              type="color"
              value={value}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full h-8 rounded border cursor-pointer"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}