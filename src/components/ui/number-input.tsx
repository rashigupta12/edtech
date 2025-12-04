"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const NumberInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, onFocus, onBlur, onWheel, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      if (isFocused) {
        e.currentTarget.blur();
      }
      onWheel?.(e);
    };

    return (
      <input
        type="number"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onWheel={handleWheel}
        {...props}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";
export { NumberInput };
