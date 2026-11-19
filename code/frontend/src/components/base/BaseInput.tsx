import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full relative">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-[13px] text-destructive absolute -bottom-5 left-0">{error}</span>
        )}
      </div>
    );
  }
);
BaseInput.displayName = 'BaseInput';

export { BaseInput };
