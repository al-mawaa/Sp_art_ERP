import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "./button";

export interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, variant, size, isLoading = false, loadingText, children, disabled, ...props }, ref) => {
    const isDisabled = isLoading || disabled;

    return (
      <Button
        className={className}
        variant={variant}
        size={size}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading && loadingText ? loadingText : children}
      </Button>
    );
  },
);
LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
