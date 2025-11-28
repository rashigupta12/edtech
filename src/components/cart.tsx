import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function Cart() {
  return (
    <Sheet>
      <Tooltip>
        <SheetTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="border-border size-8 shrink-0 border"
            >
              <CartIcon className="size-4" />
              <span className="sr-only">Cart</span>
            </Button>
          </TooltipTrigger>
        </SheetTrigger>
        <TooltipContent align="end">Cart</TooltipContent>
        <SheetContent
          side="right"
          className="flex w-full flex-col justify-between p-4 pt-12 md:w-3/4"
        >
          <SheetTitle className="absolute left-4 top-3 text-xl ">
            Cart
          </SheetTitle>
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              No items in your cart.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="default" size="sm">
              Proceed to Checkout
            </Button>
          </div>
        </SheetContent>
      </Tooltip>
    </Sheet>
  )
}

function CartIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_1730_25270)">
        <path
          d="M5.33317 14.6668C5.70136 14.6668 5.99984 14.3684 5.99984 14.0002C5.99984 13.632 5.70136 13.3335 5.33317 13.3335C4.96498 13.3335 4.6665 13.632 4.6665 14.0002C4.6665 14.3684 4.96498 14.6668 5.33317 14.6668Z"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.6667 14.6668C13.0349 14.6668 13.3333 14.3684 13.3333 14.0002C13.3333 13.632 13.0349 13.3335 12.6667 13.3335C12.2985 13.3335 12 13.632 12 14.0002C12 14.3684 12.2985 14.6668 12.6667 14.6668Z"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1.3667 1.36719H2.70003L4.47337 9.64719C4.53842 9.95043 4.70715 10.2215 4.95051 10.4138C5.19387 10.606 5.49664 10.7074 5.8067 10.7005H12.3267C12.6301 10.7 12.9244 10.596 13.1607 10.4057C13.3971 10.2154 13.5615 9.95021 13.6267 9.65385L14.7267 4.70052H3.41337"
          stroke="currentColor"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1730_25270">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

