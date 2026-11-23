export const Validation = {
  isEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  },
  isNotEmpty(value) {
    return String(value || '').trim().length > 0;
  },
  minLength(value, min) {
    return String(value || '').trim().length >= min;
  }
};