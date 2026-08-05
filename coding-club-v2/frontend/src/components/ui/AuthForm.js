import React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('auth-card', className)} {...props} />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('auth-card-header', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('auth-card-title', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('auth-card-description', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('auth-card-content', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('auth-card-footer', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

const Button = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
  <button ref={ref} className={cn('auth-btn', `auth-btn-${variant}`, className)} {...props} />
));
Button.displayName = 'Button';

/**
 * Reusable authentication form component with shadcn-inspired design.
 */
const AuthForm = React.forwardRef(({
  className,
  logo,
  title,
  description,
  children,
  footerContent,
  ...props
}, ref) => {
  return (
    <div className={cn('auth-form-wrapper', className)}>
      <Card ref={ref} className="auth-card-enter" {...props}>
        <CardHeader className="auth-card-header">
          {logo && (
            <div className="auth-logo">{logo}</div>
          )}
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="auth-card-content">
          {children}
        </CardContent>
      </Card>

      {footerContent && (
        <div className="auth-footer">{footerContent}</div>
      )}
    </div>
  );
});
AuthForm.displayName = 'AuthForm';

export { AuthForm, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button };
