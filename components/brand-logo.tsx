import { Beer, Warehouse, Circle, Star, Award, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
  iconClassName?: string
  showText?: boolean
  textClassName?: string
  variant?: "default" | "minimal" | "premium" | "modern"
  size?: "sm" | "md" | "lg"
}

export function BrandLogo({
  className,
  iconClassName,
  showText = true,
  textClassName,
  variant = "default",
  size = "md",
}: BrandLogoProps) {
  const sizeClasses = {
    sm: {
      container: "gap-2",
      icon: "size-8 rounded-lg",
      beerIcon: "size-4",
      warehouseIcon: "size-3",
      text: "text-lg",
    },
    md: {
      container: "gap-3",
      icon: "size-10 rounded-xl",
      beerIcon: "size-5",
      warehouseIcon: "size-4",
      text: "text-xl",
    },
    lg: {
      container: "gap-4",
      icon: "size-14 rounded-2xl",
      beerIcon: "size-7",
      warehouseIcon: "size-5",
      text: "text-2xl",
    },
  }

  const variantClasses = {
    default: {
      icon: "bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg",
      text: "",
    },
    minimal: {
      icon: "bg-amber-500 shadow-sm",
      text: "",
    },
    premium: {
      icon: "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-xl ring-2 ring-amber-300/50",
      text: "tracking-wide",
    },
    modern: {
      icon: "bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg",
      text: "font-light",
    },
  }

  const currentSize = sizeClasses[size]
  const currentVariant = variantClasses[variant]

  return (
    <div className={cn("flex items-center", currentSize.container, className)}>
      {/* Premium Logo Icon with Animations */}
      <div className="relative group">
        {/* Animated background glow */}
        <div className="absolute inset-0 rounded-full bg-amber-400 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
        
        {/* Main Icon Container */}
        <div
          className={cn(
            "relative flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl",
            currentSize.icon,
            currentVariant.icon,
            iconClassName,
          )}
        >
          {/* Beer Glass Icon */}
          <Beer
            className={cn(
              "absolute text-white transition-transform duration-300 group-hover:rotate-[-8deg]",
              currentSize.beerIcon,
              variant === "premium" && "drop-shadow-lg",
            )}
            style={{ transform: "rotate(-12deg)" }}
          />
          
          {/* Warehouse/Hops Icon */}
          <Warehouse
            className={cn(
              "absolute text-white/80 transition-all duration-300 group-hover:scale-110",
              currentSize.warehouseIcon,
            )}
            style={{ bottom: "2px", right: "2px" }}
          />
          
          {/* Premium Accent Dot for Premium Variant */}
          {variant === "premium" && (
            <div className="absolute -top-1 -right-1">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-300 animate-ping opacity-75" />
                <div className="relative rounded-full bg-amber-300 p-0.5">
                  <Star className="size-2 text-amber-700" fill="#b45309" />
                </div>
              </div>
            </div>
          )}
          
          {/* Modern Accent Line */}
          {variant === "modern" && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white/50 rounded-full" />
          )}
        </div>
      </div>

      {/* Logo Text Section */}
      {showText && (
        <div className={cn("flex items-baseline", currentVariant.text)}>
          <span
            className={cn(
              "font-extrabold tracking-tight text-foreground transition-colors duration-300 group-hover:text-amber-600",
              currentSize.text,
              textClassName,
            )}
          >
            Beer
          </span>
          <span
            className={cn(
              "font-extrabold tracking-tight bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-amber-600 group-hover:to-amber-700",
              currentSize.text,
              textClassName,
            )}
          >
            Depot
          </span>
          
          {/* Premium Tagline for Large Size */}
          {size === "lg" && variant === "premium" && (
            <span className="ml-2 text-xs font-medium text-muted-foreground tracking-wider">
              PREMIUM
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Alternative: Circular Logo (for header)
export function CircularBrandLogo({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  }

  const iconSizes = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  }

  return (
    <div
      className={cn(
        "relative rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl",
        sizeClasses[size],
        className,
      )}
    >
      <Beer className={cn("text-white", iconSizes[size], "absolute rotate-[-12deg]")} />
      <Warehouse
        className={cn("text-white/80 absolute bottom-1 right-1", iconSizes[size] === "size-8" ? "size-3" : iconSizes[size] === "size-6" ? "size-2.5" : "size-2")}
      />
      <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}

// Alternative: Horizontal Logo with Tagline
export function HorizontalBrandLogo({
  className,
  showTagline = true,
}: {
  className?: string
  showTagline?: boolean
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-3">
        <div className="relative size-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg flex items-center justify-center">
          <Beer className="size-6 text-white absolute rotate-[-12deg]" />
          <Warehouse className="size-4 text-white/80 absolute bottom-1 right-1" />
        </div>
        <div>
          <div className="flex items-baseline">
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              Beer
            </span>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              Depot
            </span>
          </div>
          {showTagline && (
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
              Premium Beer Distribution
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Alternative: Simple Icon Only
export function IconOnlyLogo({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-8 rounded-lg",
    md: "size-10 rounded-xl",
    lg: "size-14 rounded-2xl",
  }

  const beerSizes = {
    sm: "size-4",
    md: "size-5",
    lg: "size-7",
  }

  const warehouseSizes = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl",
        sizeClasses[size],
        className,
      )}
    >
      <Beer
        className={cn("text-white absolute", beerSizes[size])}
        style={{ transform: "rotate(-12deg)" }}
      />
      <Warehouse
        className={cn("text-white/80 absolute", warehouseSizes[size])}
        style={{ bottom: size === "lg" ? "4px" : "2px", right: size === "lg" ? "4px" : "2px" }}
      />
    </div>
  )
}