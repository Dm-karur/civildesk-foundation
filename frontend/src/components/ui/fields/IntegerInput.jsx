import { forwardRef } from 'react';
import { Input } from '../Input';

export const IntegerInput = forwardRef(({ onChange, ...props }, ref) => {
  const handleChange = (e) => {
    let val = e.target.value;
    
    // Allow empty or only digits (and optional minus sign at start)
    if (val !== '' && val !== '-' && !/^-?\d+$/.test(val)) {
      return; 
    }

    if (onChange) {
      onChange(e);
    }
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      onChange={handleChange}
      placeholder="0"
      {...props}
    />
  );
});

IntegerInput.displayName = 'IntegerInput';
