
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-white shadow-sm hover:bg-primary-600 active:bg-primary-700': variant === 'default',
            'border border-secondary-200 bg-white hover:bg-secondary-50 text-secondary-700': variant === 'outline',
            'hover:bg-secondary-100 text-secondary-700': variant === 'ghost',
            'bg-secondary-100 text-secondary-900 hover:bg-secondary-200': variant === 'secondary',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
            'h-9 px-4 py-2 text-sm': size === 'default',
            'h-8 px-3 text-xs': size === 'sm',
            'h-11 px-8 text-base': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
