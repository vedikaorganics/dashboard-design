"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
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
  globalFilterFn?: (row: TData, searchQuery: string) => boolean
  // Server-side pagination and filtering props
  pageCount?: number
  pageIndex?: number
  pageSize?: number
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
  manualPagination?: boolean
  manualFiltering?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filterableColumns = [],
  globalFilterFn,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
  manualPagination = false,
  manualFiltering = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const [pagination, setPagination] = React.useState({
    pageIndex: pageIndex || 0,
    pageSize: pageSize || 10,
  })

  React.useEffect(() => {
    if (onPaginationChange && manualPagination) {
      onPaginationChange(pagination)
    }
  }, [pagination, onPaginationChange, manualPagination])

  // Custom global filter function
  const customGlobalFilter = React.useCallback(
    (row: any, columnId: string, value: string) => {
      if (globalFilterFn) {
        return globalFilterFn(row.original, value)
      }
      // Default global filter behavior (search in specified column)
      const cellValue = row.getValue(columnId)
      return cellValue
        ?.toString()
        ?.toLowerCase()
        ?.includes(value?.toLowerCase() ?? "")
    },
    [globalFilterFn]
  )

  const table = useReactTable({
    data,
    columns,
    pageCount: manualPagination ? pageCount : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: manualFiltering ? undefined : setGlobalFilter,
    globalFilterFn: manualFiltering ? undefined : customGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: manualPagination ? setPagination : undefined,
    manualPagination,
    manualFiltering,
    ...(!manualPagination && {
      initialState: {
        pagination: {
          pageSize: pageSize || 10,
        },
      },
    }),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(!manualFiltering && { globalFilter }),
      ...(manualPagination ? { pagination } : {}),
    },
  })

  return (
    <div className="w-full space-y-4">
      <DataTableToolbar 
        table={table} 
        searchKey={searchKey} 
        searchPlaceholder={searchPlaceholder} 
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        filterableColumns={filterableColumns}
        manualFiltering={manualFiltering}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}