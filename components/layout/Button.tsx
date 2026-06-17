import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bootstrap-inspired button (project-rules §11). One component covers all
 * semantic variants, each with a filled and an `outline` form, plus sizes,
 * loading, fullWidth, and icon slots. Built to layer on shadcn later.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
        success: "bg-success text-success-foreground hover:opacity-90",
        danger:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        warning: "bg-warning text-warning-foreground hover:opacity-90",
        info: "bg-info text-info-foreground hover:opacity-90",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      outline: { true: "bg-transparent border", false: "" },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
      fullWidth: { true: "w-full", false: "" },
    },
    compoundVariants: [
      { variant: "primary", outline: true, className: "border-primary text-primary hover:bg-primary/10" },
      { variant: "secondary", outline: true, className: "border-border text-secondary-foreground hover:bg-secondary/40" },
      { variant: "success", outline: true, className: "border-success text-success hover:bg-success/10" },
      { variant: "danger", outline: true, className: "border-destructive text-destructive hover:bg-destructive/10" },
      { variant: "warning", outline: true, className: "border-warning text-warning hover:bg-warning/10" },
      { variant: "info", outline: true, className: "border-info text-info hover:bg-info/10" },
    ],
    defaultVariants: { variant: "primary", outline: false, size: "md", fullWidth: false },
  },
);

type ButtonBaseProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "color"
> &
  VariantProps<typeof buttonVariants>;

export interface ButtonProps extends ButtonBaseProps {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      outline,
      size,
      fullWidth,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, outline, size, fullWidth }),
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
