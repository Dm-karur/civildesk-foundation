import { forwardRef } from 'react';
import { Percent } from 'lucide-react';
import { Input } from '../Input';

export const PercentageInput = forwardRef(({ onChange, ...props }, ref) => {
  const handleChange = (e) => {
    let val = e.target.value;
    
    // Up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (val !== '' && !regex.test(val)) {
      return; 
    }

    // Optional constraint: block typing anything greater than 100
    if (val !== '' && Number(val) > 100) {
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
      rightIcon={<Percent className="w-4 h-4" />}
      onChange={handleChange}
      placeholder="0"
      {...props}
    />
  );
});

PercentageInput.displayName = 'PercentageInput';
