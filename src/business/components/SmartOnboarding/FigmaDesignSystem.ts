/**
 * Figma Design System - Style Presets by Category
 * Beautiful, curated design templates for different business types
 */

export interface StylePreset {
  id: string;
  name: string;
  tagline: string;
  primary: string;
  accent: string;
  bg: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  theme: 'light' | 'dark';
  font: 'modern' | 'classic' | 'bold' | 'elegant' | 'playful' | 'tech';
  layout: 'card' | 'hero' | 'grid' | 'minimal' | 'magazine' | 'list';
  buttonStyle: 'rounded' | 'pill' | 'square';
  mood: string;
  gradFrom: string;
  gradTo: string;
  tag?: string;
}

export const categoryData: Record<string, { label: string; emoji: string; presets: StylePreset[] }> = {
  Restaurant: {
    emoji: '🍽️',
    label: 'Restaurant',
    presets: [
      {
        id: 'restaurant-rustic',
        name: 'Rustic Kitchen',
        tagline: 'Warm, homey, and inviting',
        primary: '#8B4513',
        accent: '#FFB347',
        bg: '#FDF5E6',
        surface: '#FFF8F0',
        textPrimary: '#3D1C02',
        textSecondary: '#78716C',
        theme: 'light',
        font: 'classic',
        layout: 'card',
        buttonStyle: 'rounded',
        mood: '🏡 Warm & Cozy',
        gradFrom: '#8B4513',
        gradTo: '#FFB347',
        tag: 'Popular',
      },
      {
        id: 'restaurant-modern',
        name: 'Modern Bistro',
        tagline: 'Charcoal, fresh, contemporary',
        primary: '#2D2D2D',
        accent: '#A8E063',
        bg: '#FFFFFF',
        surface: '#F8F8F8',
        textPrimary: '#1A1A1A',
        textSecondary: '#6B7280',
        theme: 'light',
        font: 'modern',
        layout: 'hero',
        buttonStyle: 'square',
        mood: '🌿 Fresh & Modern',
        gradFrom: '#2D2D2D',
        gradTo: '#A8E063',
      },
      {
        id: 'restaurant-fine',
        name: 'Fine Dining',
        tagline: 'Midnight elegance, gold accents',
        primary: '#C8A951',
        accent: '#F5F5F0',
        bg: '#1A1A2E',
        surface: '#252535',
        textPrimary: '#F5F5F0',
        textSecondary: '#C8A951',
        theme: 'dark',
        font: 'elegant',
        layout: 'minimal',
        buttonStyle: 'pill',
        mood: '✦ Fine & Elegant',
        gradFrom: '#1A1A2E',
        gradTo: '#C8A951',
        tag: 'Premium',
      },
    ],
  },
  'Salon & Spa': {
    emoji: '💆',
    label: 'Salon & Spa',
    presets: [
      {
        id: 'salon-serene',
        name: 'Serene Sanctuary',
        tagline: 'Calming, peaceful, luxurious',
        primary: '#8B7355',
        accent: '#D4A574',
        bg: '#FBF7F3',
        surface: '#FFFFFF',
        textPrimary: '#5D4E37',
        textSecondary: '#8B7355',
        theme: 'light',
        font: 'elegant',
        layout: 'card',
        buttonStyle: 'pill',
        mood: '✨ Spa Vibes',
        gradFrom: '#8B7355',
        gradTo: '#D4A574',
        tag: 'Popular',
      },
      {
        id: 'salon-modern',
        name: 'Modern Beauty',
        tagline: 'Sleek, trendy, professional',
        primary: '#6B5B95',
        accent: '#FF6B9D',
        bg: '#FFFFFF',
        surface: '#F5F5F7',
        textPrimary: '#2C2C2C',
        textSecondary: '#666666',
        theme: 'light',
        font: 'modern',
        layout: 'grid',
        buttonStyle: 'rounded',
        mood: '💅 Chic & Modern',
        gradFrom: '#6B5B95',
        gradTo: '#FF6B9D',
      },
    ],
  },
  'Fitness & Gym': {
    emoji: '💪',
    label: 'Fitness & Gym',
    presets: [
      {
        id: 'fitness-energetic',
        name: 'Energetic',
        tagline: 'Bold, motivating, powerful',
        primary: '#1E3A8A',
        accent: '#FACC15',
        bg: '#FFFFFF',
        surface: '#F0F9FF',
        textPrimary: '#1E3A8A',
        textSecondary: '#475569',
        theme: 'light',
        font: 'bold',
        layout: 'hero',
        buttonStyle: 'rounded',
        mood: '⚡ High Energy',
        gradFrom: '#1E3A8A',
        gradTo: '#FACC15',
        tag: 'Popular',
      },
      {
        id: 'fitness-minimal',
        name: 'Minimal Pro',
        tagline: 'Clean, focused, professional',
        primary: '#000000',
        accent: '#EF4444',
        bg: '#FFFFFF',
        surface: '#F5F5F5',
        textPrimary: '#000000',
        textSecondary: '#666666',
        theme: 'light',
        font: 'modern',
        layout: 'minimal',
        buttonStyle: 'square',
        mood: '🎯 Pro & Focused',
        gradFrom: '#000000',
        gradTo: '#EF4444',
      },
    ],
  },
  Retail: {
    emoji: '🛍️',
    label: 'Retail',
    presets: [
      {
        id: 'retail-urban',
        name: 'Urban Boutique',
        tagline: 'Sleek, dark, and product-first',
        primary: '#1C1C2E',
        accent: '#FF4F7B',
        bg: '#F9F9FC',
        surface: '#FFFFFF',
        textPrimary: '#1C1C2E',
        textSecondary: '#6B7280',
        theme: 'light',
        font: 'modern',
        layout: 'grid',
        buttonStyle: 'square',
        mood: '✨ Minimal & Sleek',
        gradFrom: '#1C1C2E',
        gradTo: '#FF4F7B',
        tag: 'Popular',
      },
      {
        id: 'retail-bold',
        name: 'Bold Commerce',
        tagline: 'Eye-catching, energetic, trendy',
        primary: '#FF6B35',
        accent: '#1C1C2E',
        bg: '#FFFFFF',
        surface: '#FFF8F5',
        textPrimary: '#1C1C2E',
        textSecondary: '#6B7280',
        theme: 'light',
        font: 'bold',
        layout: 'hero',
        buttonStyle: 'rounded',
        mood: '🔥 Bold & Vibrant',
        gradFrom: '#FF6B35',
        gradTo: '#F97316',
      },
      {
        id: 'retail-luxury',
        name: 'Classic Luxe',
        tagline: 'Premium, elegant, timeless',
        primary: '#B8960C',
        accent: '#1C1C2E',
        bg: '#FAFAF5',
        surface: '#FFFFF0',
        textPrimary: '#1C1C2E',
        textSecondary: '#78716C',
        theme: 'light',
        font: 'elegant',
        layout: 'magazine',
        buttonStyle: 'pill',
        mood: '👑 Luxury & Refined',
        gradFrom: '#B8960C',
        gradTo: '#D4AF37',
      },
    ],
  },
  'E-commerce': {
    emoji: '📦',
    label: 'E-commerce',
    presets: [
      {
        id: 'ecommerce-modern',
        name: 'Modern Store',
        tagline: 'Clean, conversion-focused',
        primary: '#2563EB',
        accent: '#EC4899',
        bg: '#FFFFFF',
        surface: '#F8FAFC',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        theme: 'light',
        font: 'modern',
        layout: 'grid',
        buttonStyle: 'rounded',
        mood: '🚀 Modern & Fast',
        gradFrom: '#2563EB',
        gradTo: '#EC4899',
        tag: 'Popular',
      },
    ],
  },
  Healthcare: {
    emoji: '🏥',
    label: 'Healthcare',
    presets: [
      {
        id: 'healthcare-professional',
        name: 'Professional',
        tagline: 'Trust, care, professional',
        primary: '#059669',
        accent: '#3B82F6',
        bg: '#FFFFFF',
        surface: '#F0FDF4',
        textPrimary: '#064E3B',
        textSecondary: '#6B7280',
        theme: 'light',
        font: 'modern',
        layout: 'minimal',
        buttonStyle: 'rounded',
        mood: '❤️ Care & Trust',
        gradFrom: '#059669',
        gradTo: '#3B82F6',
        tag: 'Popular',
      },
    ],
  },
};

export const getAllCategories = () => {
  return Object.entries(categoryData).map(([key, value]) => ({
    id: key,
    emoji: value.emoji,
    label: value.label,
  }));
};

export const getPresetsForCategory = (category: string): StylePreset[] => {
  return categoryData[category]?.presets || [];
};

export const getPresetById = (category: string, presetId: string): StylePreset | null => {
  const presets = getPresetsForCategory(category);
  return presets.find(p => p.id === presetId) || null;
};
