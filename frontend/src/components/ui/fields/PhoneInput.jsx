import { forwardRef } from 'react';
import { Phone } from 'lucide-react';
import { Input } from '../Input';

export const PhoneInput = forwardRef(({ onChange, ...props }, ref) => {
  const handleChange = (e) => {
    let val = e.target.value;
    
    // Allow only digits, space, hyphen, and + at the beginning
    if (val !== '' && !/^\+?[\d\s-]*$/.test(val)) {
      return; // Ignore invalid characters entirely
    }

    if (onChange) {
      onChange(e);
    }
  };

  return (
    <Input
      ref={ref}
      type="tel"
      leftIcon={<Phone className="w-4 h-4" />}
      onChange={handleChange}
      placeholder="+91 9876543210"
      {...props}
    />
  );
});

PhoneInput.displayName = 'PhoneInput';
