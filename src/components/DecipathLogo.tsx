import { cn } from "@/lib/utils"

type DecipathMarkProps = {
  className?: string
  iconClassName?: string
  size?: number
}

type DecipathLogoProps = {
  className?: string
  markClassName?: string
  iconClassName?: string
  nameClassName?: string
  subtitleClassName?: string
  subtitle?: string
  showName?: boolean
  size?: number
}

export function DecipathMark({ className, iconClassName, size = 36 }: DecipathMarkProps) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }} aria-hidden="true">
      <svg
        viewBox="0 0 104 116"
        className={cn("h-full w-full", iconClassName)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="89" height="89" rx="28" fill="currentColor" />
        <rect x="15" y="27" width="89" height="89" rx="28" fill="currentColor" style={{ mixBlendMode: "difference" }} />
      </svg>
    </div>
  )
}

export default function DecipathLogo({
  className,
  markClassName,
  iconClassName,
  nameClassName,
  subtitleClassName,
  subtitle,
  showName = true,
  size = 36,
}: DecipathLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <DecipathMark className={markClassName} iconClassName={iconClassName} size={size} />
      {showName && (
        <div className="leading-none">
          <p className={cn("text-sm font-semibold tracking-wide text-neutral-900 dark:text-white", nameClassName)}>
            <span className="text-indigo-600 dark:text-indigo-200">Deci</span>
            <span>Path</span>
          </p>
          {subtitle ? (
            <p className={cn("mt-1 text-[10px] uppercase tracking-[0.24em] text-indigo-500/80 dark:text-indigo-200/60", subtitleClassName)}>
              {subtitle}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
