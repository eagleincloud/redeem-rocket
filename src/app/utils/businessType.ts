/**
 * Map a string (name, category, subcategory, or combined) to icon type key.
 * Used for map pins and for infer-business-type script (keep in sync).
 */
export function getBusinessTypeKey(text: string): string {
  const c = (text || '').toLowerCase();
  if (/\b(restaurant|resto|dining|food|eat|grill|pizza|burger|bistro|cafe|coffee|tea)\b/.test(c)) return 'restaurant';
  if (/\b(grocery|store|shop|retail|mall|supermarket|mart)\b/.test(c)) return 'grocery';
  if (/\b(pharmacy|pharma|chemist|drugstore)\b/.test(c)) return 'pharmacy';
  if (/\b(salon|barber|beauty|spa)\b/.test(c)) return 'salon';
  if (/\b(hotel|motel|inn|stay|lodging)\b/.test(c)) return 'hotel';
  if (/\b(atm|bank)\b/.test(c)) return 'atm';
  return 'other';
}

export const BUSINESS_TYPE_KEYS = ['restaurant', 'grocery', 'pharmacy', 'salon', 'hotel', 'atm', 'other'] as const;
