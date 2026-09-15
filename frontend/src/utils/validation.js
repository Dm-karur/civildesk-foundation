// Common Validation Utility

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Allows optional + at start, spaces, dashes, and digits
const PHONE_REGEX = /^\+?[\d\s-]{10,15}$/;
const URL_REGEX = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/;

export const validators = {
  required: (value) => {
    if (value === undefined || value === null || value === '') {
      return "This field is required.";
    }
    if (typeof value === 'string' && value.trim() === '') {
      return "This field is required.";
    }
    return null;
  },

  email: (value) => {
    if (!value) return null; // Let required() handle empty
    if (!EMAIL_REGEX.test(value)) {
      return "Please enter a valid email address.";
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const stripped = value.replace(/[\s-]/g, '');
    if (!/^\+?\d+$/.test(stripped)) {
      return "Please enter a valid phone number (digits and + only).";
    }
    if (stripped.length < 10 || stripped.length > 15) {
      return "Phone number must be between 10 and 15 digits.";
    }
    return null;
  },

  integer: (value, { min, max } = {}) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (!Number.isInteger(num)) {
      return "Please enter a valid whole number.";
    }
    if (min !== undefined && num < min) return `Value cannot be less than ${min}.`;
    if (max !== undefined && num > max) return `Value cannot be greater than ${max}.`;
    return null;
  },

  decimal: (value, { min, max, places } = {}) => {
    if (value === '' || value === null || value === undefined) return null;
    if (isNaN(value) || value.toString().trim() === '') {
      return "Please enter a valid number.";
    }
    const num = Number(value);
    if (min !== undefined && num < min) return `Value cannot be less than ${min}.`;
    if (max !== undefined && num > max) return `Value cannot be greater than ${max}.`;
    
    if (places !== undefined) {
      const parts = value.toString().split('.');
      if (parts[1] && parts[1].length > places) {
        return `Maximum ${places} decimal places allowed.`;
      }
    }
    return null;
  },

  percentage: (value) => {
    if (value === '' || value === null || value === undefined) return null;
    if (isNaN(value)) return "Please enter a valid percentage.";
    const num = Number(value);
    if (num < 0 || num > 100) {
      return "Please enter a value between 0 and 100.";
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    if (!URL_REGEX.test(value)) {
      return "Please enter a valid URL (e.g. https://example.com).";
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    if (value.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    return null;
  }
};
