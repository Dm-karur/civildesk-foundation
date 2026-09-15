import { forwardRef } from 'react';
import { Link } from 'lucide-react';
import { Input } from '../Input';

export const UrlInput = forwardRef((props, ref) => {
  return (
    <Input
      ref={ref}
      type="url"
      leftIcon={<Link className="w-4 h-4" />}
      placeholder="https://example.com"
      {...props}
    />
  );
});

UrlInput.displayName = 'UrlInput';
