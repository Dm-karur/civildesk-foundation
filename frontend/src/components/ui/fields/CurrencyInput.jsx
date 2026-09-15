import { forwardRef } from 'react';
import { IndianRupee } from 'lucide-react';
import { Input } from '../Input';

export const CurrencyInput = forwardRef(({ onChange, ...props }, ref) => {
  const handleChange = (e) => {
    let val = e.target.value;
    
    // Strictly numeric internally (with up to 2 decimal places)
    const regex = /^-?\d*\.?\d{0,2}$/;
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
      leftIcon={<IndianRupee className="w-4 h-4" />}
      onChange={handleChange}
      placeholder="0.00"
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';
