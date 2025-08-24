import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showRating?: boolean
  className?: string
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = "md", 
  showRating = true, 
  className 
}: StarRatingProps) {
  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizes[size],
            i < Math.floor(rating)
              ? "fill-warning text-warning"
              : "text-muted-foreground"
          )}
        />
      ))}
      {showRating && (
        <span className={cn("ml-2 text-muted-foreground", textSizes[size])}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}