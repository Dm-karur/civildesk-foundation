import { forwardRef } from 'react';
import { Input } from '../Input';

export const DecimalInput = forwardRef(({ onChange, decimalPlaces = 2, ...props }, ref) => {
  const handleChange = (e) => {
    let val = e.target.value;
    
    // Allow empty or valid decimal format
    const regex = new RegExp(`^-?\\d*\\.?\\d{0,${decimalPlaces}}$`);
    if (val !== '' && val !== '-' && !regex.test(val)) {
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
      inputMode="decimal"
      onChange={handleChange}
      placeholder="0.00"
      {...props}
    />
  );
});

DecimalInput.displayName = 'DecimalInput';
