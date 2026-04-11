export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/** Icons users can choose for the map location pin */
export const LOCATION_PIN_ICONS = [
  '👤',
  '🧑',
  '👩',
  '👨',
  '🎯',
  '📍',
  '🏠',
  '⭐',
  '🚀',
  '🎨',
  '🔵',
  '🟢',
  '📌',
  '❤️',
  '🌟',
  '👍',
] as const;

export type LocationPinIcon = (typeof LOCATION_PIN_ICONS)[number];

export const DEFAULT_LOCATION_PIN_ICON: LocationPinIcon = '👤';
