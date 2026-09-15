import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '../Input';

export const DateInput = forwardRef((props, ref) => {
  return (
    <Input
      ref={ref}
      type="date"
      leftIcon={<Calendar className="w-4 h-4" />}
      {...props}
    />
  );
});

DateInput.displayName = 'DateInput';
