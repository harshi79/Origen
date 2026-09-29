/** Validate the entire value: never trim, coerce, truncate, or extract from a PAN. */
export function validateBin(value: string): string {
  if (typeof value !== 'string' || !/^[0-9]{6,8}$/.test(value)) {
    throw new Error('Enter a BIN / IIN of 6–8 digits only. Never enter a complete card number.');
  }
  return value;
}
