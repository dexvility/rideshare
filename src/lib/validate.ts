/**
 * E.164-ish phone validation.
 * Accepts +<countrycode><number> or local formats with spaces/dashes/parens.
 * Requires 9–15 digits (strips formatting before counting).
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}
