"use client"

import * as React from "react"
import { Cross2Icon, CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface ServerSideFilterProps {
  title?: string
  options: Array<{
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }>
  value: string[]
  onChange: (value: string[]) => void
}

function ServerSideFilter({ title, options, value, onChange }: ServerSideFilterProps) {
  const selectedValues = new Set(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        key={option.value}
                        className="rounded-sm px-1 font-semibold bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                      >
                        {option.icon && <option.icon className="w-3 h-3 mr-1" />}
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const newValues = [...value]
                      if (isSelected) {
                        const index = newValues.indexOf(option.value)
                        if (index > -1) {
                          newValues.splice(index, 1)
                        }
                      } else {
                        newValues.push(option.value)
                      }
                      onChange(newValues)
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (search: string) => void
  filterableColumns?: Array<{
    id: string
    title: string
    options: Array<{
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }>
    value?: string[]
    onChange?: (value: string[]) => void
  }>
  manualFiltering?: boolean
  toolbarActions?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filterableColumns = [],
  manualFiltering = false,
  toolbarActions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = manualFiltering 
    ? (searchValue && searchValue.trim().length > 0) || filterableColumns.some(col => col.value && col.value.length > 0)
    : table.getState().columnFilters.length > 0 || !!table.getState().globalFilter

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={searchPlaceholder}
          value={manualFiltering ? (searchValue || "") : ((table.getState().globalFilter as string) ?? "")}
          onChange={(event) => {
            if (manualFiltering && onSearchChange) {
              onSearchChange(event.target.value)
            } else {
              table.setGlobalFilter(event.target.value)
            }
          }}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {filterableColumns.map((column) => {
          if (manualFiltering) {
            // For manual filtering, use custom component with external state
            return (
              <ServerSideFilter
                key={column.id}
                title={column.title}
                options={column.options}
                value={column.value || []}
                onChange={column.onChange || (() => {})}
              />
            )
          } else {
            // For client-side filtering, use the existing table column filter
            return table.getColumn(column.id) ? (
              <DataTableFacetedFilter
                key={column.id}
                column={table.getColumn(column.id)}
                title={column.title}
                options={column.options}
              />
            ) : null
          }
        })}
        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (manualFiltering) {
                // Reset manual filters
                onSearchChange && onSearchChange('')
                filterableColumns.forEach(col => {
                  col.onChange && col.onChange([])
                })
              } else {
                // Reset table filters
                table.resetColumnFilters()
                table.setGlobalFilter("")
              }
            }}
            className="h-8 px-3 bg-muted/50 hover:bg-muted border-border hover:border-muted-foreground/20 transition-all duration-200 font-medium cursor-pointer"
          >
            <Cross2Icon className="mr-2 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {toolbarActions}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}