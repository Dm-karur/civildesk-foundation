import { forwardRef } from 'react';
import { Mail } from 'lucide-react';
import { Input } from '../Input';

export const EmailInput = forwardRef(({ onChange, ...props }, ref) => {
  const handleChange = (e) => {
    if (onChange) {
      // Trim whitespace for emails automatically
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          name: e.target.name,
          value: e.target.value.trim().toLowerCase()
        }
      };
      onChange(newEvent);
    }
  };

  return (
    <Input
      ref={ref}
      type="email"
      leftIcon={<Mail className="w-4 h-4" />}
      onChange={handleChange}
      placeholder="contact@example.com"
      {...props}
    />
  );
});

EmailInput.displayName = 'EmailInput';
