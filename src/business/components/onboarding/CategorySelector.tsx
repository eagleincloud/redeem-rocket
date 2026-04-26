import React, { useState, useMemo } from 'react';
import {
  Store,
  UtensilsCrossed,
  Wrench,
  Building2,
  Heart,
  BookOpen,
  Home,
  Palette,
  Zap,
  DollarSign,
} from 'lucide-react';

// Category Interface
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  subtypeCount: number;
  color: string;
  accentColor: string;
}

// Mock Categories Data
const CATEGORIES: Category[] = [
  {
    id: 'retail',
    name: 'Retail',
    description: 'Physical or online stores selling products',
    icon: <Store size={32} />,
    subtypeCount: 8,
    color: '#3b82f6',
    accentColor: '#1e40af',
  },
  {
    id: 'food',
    name: 'Food & Beverage',
    description: 'Restaurants, cafes, and food delivery services',
    icon: <UtensilsCrossed size={32} />,
    subtypeCount: 6,
    color: '#f97316',
    accentColor: '#ea580c',
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Consulting, freelancing, and professional services',
    icon: <Wrench size={32} />,
    subtypeCount: 12,
    color: '#06b6d4',
    accentColor: '#0891b2',
  },
  {
    id: 'b2b',
    name: 'B2B',
    description: 'Business-to-business products and services',
    icon: <Building2 size={32} />,
    subtypeCount: 7,
    color: '#8b5cf6',
    accentColor: '#7c3aed',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical practices, clinics, and wellness services',
    icon: <Heart size={32} />,
    subtypeCount: 5,
    color: '#ef4444',
    accentColor: '#dc2626',
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Schools, tutoring, and online learning platforms',
    icon: <BookOpen size={32} />,
    subtypeCount: 9,
    color: '#10b981',
    accentColor: '#059669',
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    description: 'Property sales, rentals, and management',
    icon: <Home size={32} />,
    subtypeCount: 4,
    color: '#f59e0b',
    accentColor: '#d97706',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Design, photography, and creative agencies',
    icon: <Palette size={32} />,
    subtypeCount: 10,
    color: '#ec4899',
    accentColor: '#db2777',
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car sales, services, and repair shops',
    icon: <Zap size={32} />,
    subtypeCount: 7,
    color: '#14b8a6',
    accentColor: '#0d9488',
  },
  {
    id: 'financial',
    name: 'Financial',
    description: 'Banking, insurance, and financial advisory',
    icon: <DollarSign size={32} />,
    subtypeCount: 8,
    color: '#06b6d4',
    accentColor: '#0891b2',
  },
];

interface CategorySelectorProps {
  onSelect: (category: Category) => void;
  loading?: boolean;
}

export function CategorySelector({ onSelect, loading = false }: CategorySelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const colors = {
    bg: '#0f172a',
    card: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    accent: '#9333ea',
    accentHover: '#a855f7',
    hover: '#334155',
  };

  const categoryCardStyles = (isHovered: boolean, category: Category) => ({
    background: colors.card,
    border: `2px solid ${isHovered ? category.color : colors.border}`,
    borderRadius: '12px',
    padding: '24px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered && !loading ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow:
      isHovered && !loading
        ? `0 20px 25px -5px ${category.color}30`
        : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    opacity: loading ? 0.6 : 1,
  });

  return (
    <div
      style={{
        width: '100%',
        padding: '0',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: colors.text,
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Select Your Industry
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: colors.textMuted,
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          Choose your business category to get started with customized templates and features.
        </p>
      </div>

      {/* Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          width: '100%',
        }}
      >
        {CATEGORIES.map(category => {
          const isHovered = hoveredId === category.id;

          return (
            <div
              key={category.id}
              onClick={() => !loading && onSelect(category)}
              onMouseEnter={() => !loading && setHoveredId(category.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={categoryCardStyles(isHovered, category) as React.CSSProperties}
              role="button"
              tabIndex={0}
              aria-label={`Select ${category.name} category`}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  !loading && onSelect(category);
                }
              }}
            >
              {/* Icon Container */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: `${category.color}15`,
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                  color: category.color,
                }}
              >
                {category.icon}
              </div>

              {/* Category Info */}
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: '0 0 8px 0',
                }}
              >
                {category.name}
              </h3>

              <p
                style={{
                  fontSize: '14px',
                  color: colors.textMuted,
                  margin: '0 0 16px 0',
                  lineHeight: '1.5',
                }}
              >
                {category.description}
              </p>

              {/* Subtype Count Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: `${category.color}20`,
                  width: 'fit-content',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: category.color,
                  }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: category.color,
                  }}
                >
                  {category.subtypeCount} Business Types
                </span>
              </div>

              {/* Hover Details */}
              {isHovered && !loading && (
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: `1px solid ${colors.border}`,
                    fontSize: '13px',
                    color: colors.textMuted,
                    animation: 'fadeIn 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '8px',
                    }}
                  >
                    <span>→ Click to explore business types</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>→ Customize with templates</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '12px',
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${colors.border}`,
                borderTopColor: colors.accent,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <p
              style={{
                fontSize: '14px',
                color: colors.text,
                margin: 0,
              }}
            >
              Loading categories...
            </p>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default CategorySelector;
