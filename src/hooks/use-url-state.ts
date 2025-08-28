"use client"

import { useCallback, useMemo, useRef, useEffect, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export interface UrlStateOptions {
  debounceMs?: number
  replace?: boolean
}

export function useUrlState<T = string>(
  key: string,
  defaultValue: T,
  options: UrlStateOptions = {}
) {
  const { debounceMs = 0, replace = false } = options
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const value = useMemo(() => {
    const paramValue = searchParams.get(key)
    if (paramValue === null) return defaultValue

    // Handle different data types
    if (typeof defaultValue === "boolean") {
      return (paramValue === "true") as T
    }
    if (typeof defaultValue === "number") {
      const num = Number(paramValue)
      return (isNaN(num) ? defaultValue : num) as T
    }
    if (Array.isArray(defaultValue)) {
      return (paramValue ? paramValue.split(",") : defaultValue) as T
    }
    
    return paramValue as T
  }, [searchParams, key, defaultValue])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const params = new URLSearchParams(searchParams)
      const resolvedValue = typeof newValue === "function" ? (newValue as (prev: T) => T)(value) : newValue

      if (resolvedValue === defaultValue || 
          (Array.isArray(resolvedValue) && resolvedValue.length === 0) ||
          resolvedValue === "" ||
          resolvedValue === null ||
          resolvedValue === undefined) {
        params.delete(key)
      } else {
        if (Array.isArray(resolvedValue)) {
          params.set(key, resolvedValue.join(","))
        } else {
          params.set(key, String(resolvedValue))
        }
      }

      const newUrl = `${pathname}?${params.toString()}`
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      if (debounceMs > 0) {
        timeoutRef.current = setTimeout(() => {
          if (replace) {
            router.replace(newUrl)
          } else {
            router.push(newUrl)
          }
        }, debounceMs)
      } else {
        if (replace) {
          router.replace(newUrl)
        } else {
          router.push(newUrl)
        }
      }
    },
    [searchParams, pathname, router, key, defaultValue, value, debounceMs, replace]
  )

  return [value, setValue] as const
}

export function useUrlStateMultiple() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const setMultiple = useCallback(
    (updates: Record<string, any>, options: { replace?: boolean } = {}) => {
      const { replace = false } = options
      const params = new URLSearchParams(searchParams)

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "" || 
            (Array.isArray(value) && value.length === 0)) {
          params.delete(key)
        } else {
          if (Array.isArray(value)) {
            params.set(key, value.join(","))
          } else {
            params.set(key, String(value))
          }
        }
      })

      const newUrl = `${pathname}?${params.toString()}`
      
      if (replace) {
        router.replace(newUrl)
      } else {
        router.push(newUrl)
      }
    },
    [searchParams, pathname, router]
  )

  return { setMultiple }
}

export function useUrlPagination(defaultPageSize = 10) {
  const [page, setPage] = useUrlState("page", 1)
  const [pageSize, setPageSize] = useUrlState("limit", defaultPageSize)
  const { setMultiple } = useUrlStateMultiple()

  const setPagination = useCallback(
    ({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
      setMultiple({
        page: pageIndex + 1, // Convert 0-based to 1-based
        limit: newPageSize
      }, { replace: true })
    },
    [setMultiple]
  )

  return {
    page: Math.max(1, page),
    pageSize: Math.max(1, pageSize),
    pageIndex: Math.max(0, page - 1), // Convert 1-based to 0-based for table
    setPage,
    setPageSize,
    setPagination
  }
}

export function useUrlSearchState(key: string = "search", debounceMs: number = 300) {
  const [urlValue, setUrlValue] = useUrlState(key, "", { debounceMs, replace: true })
  const [localValue, setLocalValue] = useState("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Initialize local value from URL on mount
  useEffect(() => {
    setLocalValue(urlValue)
  }, [])

  // Sync local value to URL with debouncing
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (localValue !== urlValue) {
      timeoutRef.current = setTimeout(() => {
        setUrlValue(localValue)
      }, debounceMs)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [localValue, setUrlValue, debounceMs, urlValue])

  // Update local value when URL changes (e.g., browser back/forward, external URL changes)
  useEffect(() => {
    if (urlValue !== localValue && timeoutRef.current === null) {
      setLocalValue(urlValue)
    }
  }, [urlValue, localValue])

  const setValue = useCallback((newValue: string) => {
    setLocalValue(newValue)
  }, [])

  return [localValue, setValue] as const
}

export function useUrlSorting(defaultSorting: { field: string; direction: "asc" | "desc" } | null = null) {
  const [sortParam, setSortParam] = useUrlState("sort", defaultSorting ? `${defaultSorting.field}:${defaultSorting.direction}` : "")

  const sorting = useMemo(() => {
    if (!sortParam) return defaultSorting
    const [field, direction] = sortParam.split(":")
    return { field, direction: direction as "asc" | "desc" }
  }, [sortParam, defaultSorting])

  const setSorting = useCallback(
    (newSorting: { field: string; direction: "asc" | "desc" } | null) => {
      if (!newSorting) {
        setSortParam("")
      } else {
        setSortParam(`${newSorting.field}:${newSorting.direction}`)
      }
    },
    [setSortParam]
  )

  return [sorting, setSorting] as const
}