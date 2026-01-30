import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { hubotSans } from "@/lib/fonts";

type InteractiveHoverButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full border border-indigo-300/40 bg-gradient-to-r from-indigo-500 to-indigo-400 p-2 px-6 text-center font-semibold text-white shadow-[0_12px_36px_-16px_rgba(99,102,241,0.9)] transition-colors duration-300 hover:from-indigo-400 hover:to-indigo-500",
        className,
        hubotSans.className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-white/90 transition-all duration-300 group-hover:scale-[100.8]"></div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight />
      </div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";
