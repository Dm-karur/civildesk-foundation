import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '../Input';
import { cn } from '../../../utils/cn';

export const PasswordInput = forwardRef(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  const ToggleButton = (
    <button
      type="button"
      onClick={togglePassword}
      className={cn(
        "p-1 rounded-sm text-text-placeholder hover:text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30",
        props.disabled && "opacity-50 cursor-not-allowed"
      )}
      disabled={props.disabled}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <Input
      ref={ref}
      type={showPassword ? "text" : "password"}
      leftIcon={<Lock className="w-4 h-4" />}
      rightIcon={ToggleButton}
      className={className}
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';
