import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, Zap, Clock, Badge } from 'lucide-react';

// Business Type Interface
export interface BusinessType {
  id: string;
  name: string;
  description: string;
  complexity: 'simple' | 'intermediate' | 'advanced';
  features: string[];
  setupTimeMinutes: number;
  categoryId: string;
}

// Mock Business Types Data
const BUSINESS_TYPES_BY_CATEGORY: Record<string, BusinessType[]> = {
  retail: [
    {
      id: 'retail-ecommerce',
      name: 'E-Commerce Store',
      description: 'Online retail platform with inventory management',
      complexity: 'intermediate',
      features: ['Product Catalog', 'Shopping Cart', 'Payment Processing', 'Inventory Tracking'],
      setupTimeMinutes: 45,
      categoryId: 'retail',
    },
    {
      id: 'retail-boutique',
      name: 'Boutique Shop',
      description: 'Small specialty retail store',
      complexity: 'simple',
      features: ['Product Display', 'Order Management', 'Customer Tracking'],
      setupTimeMinutes: 20,
      categoryId: 'retail',
    },
    {
      id: 'retail-marketplace',
      name: 'Marketplace',
      description: 'Multi-vendor platform',
      complexity: 'advanced',
      features: ['Vendor Management', 'Commission System', 'Quality Control', 'Dispute Resolution'],
      setupTimeMinutes: 90,
      categoryId: 'retail',
    },
    {
      id: 'retail-wholesale',
      name: 'Wholesale Distribution',
      description: 'B2B wholesale operations',
      complexity: 'advanced',
      features: ['Bulk Orders', 'Pricing Tiers', 'Credit Management', 'Contract Management'],
      setupTimeMinutes: 75,
      categoryId: 'retail',
    },
    {
      id: 'retail-consignment',
      name: 'Consignment Shop',
      description: 'Consignment-based retail',
      complexity: 'intermediate',
      features: ['Consignor Management', 'Revenue Sharing', 'Item Tracking', 'Payout System'],
      setupTimeMinutes: 40,
      categoryId: 'retail',
    },
    {
      id: 'retail-pop-up',
      name: 'Pop-Up Shop',
      description: 'Temporary retail events',
      complexity: 'simple',
      features: ['Quick Setup', 'Event Management', 'Sales Tracking', 'Location Switching'],
      setupTimeMinutes: 15,
      categoryId: 'retail',
    },
    {
      id: 'retail-subscription',
      name: 'Subscription Box',
      description: 'Recurring product subscription service',
      complexity: 'intermediate',
      features: ['Subscription Management', 'Recurring Billing', 'Box Customization', 'Retention Analytics'],
      setupTimeMinutes: 50,
      categoryId: 'retail',
    },
    {
      id: 'retail-rental',
      name: 'Equipment Rental',
      description: 'Equipment or product rental service',
      complexity: 'intermediate',
      features: ['Inventory Management', 'Rental Periods', 'Damage Tracking', 'Return Management'],
      setupTimeMinutes: 45,
      categoryId: 'retail',
    },
  ],
  food: [
    {
      id: 'food-restaurant',
      name: 'Restaurant',
      description: 'Full-service restaurant with dine-in and takeout',
      complexity: 'intermediate',
      features: ['Menu Management', 'Table Reservations', 'Order Processing', 'Kitchen Display System'],
      setupTimeMinutes: 60,
      categoryId: 'food',
    },
    {
      id: 'food-cafe',
      name: 'Cafe',
      description: 'Coffee shop and cafe operations',
      complexity: 'simple',
      features: ['Order Management', 'Menu Display', 'Queue Management', 'Loyalty Program'],
      setupTimeMinutes: 25,
      categoryId: 'food',
    },
    {
      id: 'food-delivery',
      name: 'Food Delivery Service',
      description: 'Third-party delivery platform',
      complexity: 'advanced',
      features: ['Real-time Tracking', 'Driver Management', 'Route Optimization', 'Payment Processing'],
      setupTimeMinutes: 85,
      categoryId: 'food',
    },
    {
      id: 'food-catering',
      name: 'Catering Service',
      description: 'Event catering and catering management',
      complexity: 'intermediate',
      features: ['Event Planning', 'Menu Customization', 'Quote Management', 'Delivery Scheduling'],
      setupTimeMinutes: 50,
      categoryId: 'food',
    },
    {
      id: 'food-ghost-kitchen',
      name: 'Ghost Kitchen',
      description: 'Cloud kitchen for delivery orders',
      complexity: 'intermediate',
      features: ['Order Management', 'Multi-Brand Support', 'Delivery Integration', 'Kitchen Analytics'],
      setupTimeMinutes: 55,
      categoryId: 'food',
    },
    {
      id: 'food-food-truck',
      name: 'Food Truck',
      description: 'Mobile food service',
      complexity: 'simple',
      features: ['Location Tracking', 'Mobile Orders', 'Simple Menu', 'Route Planning'],
      setupTimeMinutes: 20,
      categoryId: 'food',
    },
  ],
  services: [
    {
      id: 'services-consulting',
      name: 'Consulting Firm',
      description: 'Professional consulting services',
      complexity: 'intermediate',
      features: ['Project Management', 'Time Tracking', 'Client Portal', 'Proposal System'],
      setupTimeMinutes: 50,
      categoryId: 'services',
    },
    {
      id: 'services-freelance',
      name: 'Freelancer',
      description: 'Independent freelance services',
      complexity: 'simple',
      features: ['Portfolio Display', 'Project Tracking', 'Invoice Management', 'Client Reviews'],
      setupTimeMinutes: 25,
      categoryId: 'services',
    },
    {
      id: 'services-agency',
      name: 'Marketing Agency',
      description: 'Marketing and creative agency',
      complexity: 'advanced',
      features: ['Campaign Management', 'Client Analytics', 'Resource Planning', 'Reporting Dashboard'],
      setupTimeMinutes: 80,
      categoryId: 'services',
    },
    {
      id: 'services-salon',
      name: 'Salon & Spa',
      description: 'Beauty and wellness services',
      complexity: 'intermediate',
      features: ['Appointment Booking', 'Staff Management', 'Service Catalog', 'Client Profiles'],
      setupTimeMinutes: 45,
      categoryId: 'services',
    },
    {
      id: 'services-repair',
      name: 'Repair Service',
      description: 'Equipment repair and maintenance',
      complexity: 'intermediate',
      features: ['Work Order Management', 'Parts Inventory', 'Warranty Tracking', 'Technician Dispatch'],
      setupTimeMinutes: 50,
      categoryId: 'services',
    },
    {
      id: 'services-cleaning',
      name: 'Cleaning Service',
      description: 'Residential or commercial cleaning',
      complexity: 'simple',
      features: ['Schedule Management', 'Team Assignment', 'Customer Tracking', 'Rating System'],
      setupTimeMinutes: 30,
      categoryId: 'services',
    },
    {
      id: 'services-plumbing',
      name: 'Plumbing & HVAC',
      description: 'Trade services and contracting',
      complexity: 'intermediate',
      features: ['Service Scheduling', 'Equipment Tracking', 'Invoice Generation', 'Parts Catalog'],
      setupTimeMinutes: 45,
      categoryId: 'services',
    },
    {
      id: 'services-tutoring',
      name: 'Tutoring Service',
      description: 'Educational tutoring and coaching',
      complexity: 'simple',
      features: ['Schedule Management', 'Progress Tracking', 'Parent Communication', 'Payment Processing'],
      setupTimeMinutes: 35,
      categoryId: 'services',
    },
    {
      id: 'services-personal-training',
      name: 'Personal Training',
      description: 'Fitness and personal training',
      complexity: 'intermediate',
      features: ['Class Scheduling', 'Member Management', 'Workout Tracking', 'Nutrition Planning'],
      setupTimeMinutes: 45,
      categoryId: 'services',
    },
    {
      id: 'services-photography',
      name: 'Photography Studio',
      description: 'Photography and videography',
      complexity: 'intermediate',
      features: ['Booking System', 'Portfolio Showcase', 'Client Proofs', 'Pricing Packages'],
      setupTimeMinutes: 50,
      categoryId: 'services',
    },
    {
      id: 'services-law',
      name: 'Law Firm',
      description: 'Legal services and practice',
      complexity: 'advanced',
      features: ['Case Management', 'Time Billing', 'Document Management', 'Client Portal'],
      setupTimeMinutes: 75,
      categoryId: 'services',
    },
    {
      id: 'services-accounting',
      name: 'Accounting Firm',
      description: 'Accounting and tax services',
      complexity: 'advanced',
      features: ['Client Records', 'Financial Reports', 'Tax Planning', 'Compliance Tracking'],
      setupTimeMinutes: 70,
      categoryId: 'services',
    },
  ],
  b2b: [
    {
      id: 'b2b-saas',
      name: 'SaaS Platform',
      description: 'Software-as-a-Service business',
      complexity: 'advanced',
      features: ['User Management', 'Subscription Billing', 'API Documentation', 'Usage Analytics'],
      setupTimeMinutes: 90,
      categoryId: 'b2b',
    },
    {
      id: 'b2b-manufacturing',
      name: 'Manufacturing',
      description: 'B2B product manufacturing',
      complexity: 'advanced',
      features: ['Supply Chain', 'Production Planning', 'Quality Control', 'Shipment Management'],
      setupTimeMinutes: 85,
      categoryId: 'b2b',
    },
    {
      id: 'b2b-distribution',
      name: 'Distribution',
      description: 'Product distribution and logistics',
      complexity: 'intermediate',
      features: ['Warehouse Management', 'Order Fulfillment', 'Logistics Tracking', 'Inventory Sync'],
      setupTimeMinutes: 60,
      categoryId: 'b2b',
    },
    {
      id: 'b2b-staffing',
      name: 'Staffing Agency',
      description: 'Recruitment and staffing services',
      complexity: 'intermediate',
      features: ['Candidate Management', 'Job Matching', 'Contract Management', 'Payroll Integration'],
      setupTimeMinutes: 55,
      categoryId: 'b2b',
    },
    {
      id: 'b2b-logistics',
      name: 'Logistics Company',
      description: 'Freight and logistics management',
      complexity: 'advanced',
      features: ['Fleet Tracking', 'Route Optimization', 'Document Management', 'EDI Integration'],
      setupTimeMinutes: 80,
      categoryId: 'b2b',
    },
    {
      id: 'b2b-trading',
      name: 'Trading Company',
      description: 'B2B trading and commodity exchange',
      complexity: 'advanced',
      features: ['Market Data', 'Order Management', 'Settlement System', 'Risk Management'],
      setupTimeMinutes: 100,
      categoryId: 'b2b',
    },
    {
      id: 'b2b-consulting',
      name: 'Business Consulting',
      description: 'Strategic and business consulting',
      complexity: 'intermediate',
      features: ['Project Management', 'Resource Allocation', 'Client Dashboard', 'Revenue Tracking'],
      setupTimeMinutes: 55,
      categoryId: 'b2b',
    },
  ],
  healthcare: [
    {
      id: 'healthcare-clinic',
      name: 'Medical Clinic',
      description: 'General practice medical clinic',
      complexity: 'intermediate',
      features: ['Patient Records', 'Appointment Scheduling', 'Prescription Management', 'Billing Integration'],
      setupTimeMinutes: 60,
      categoryId: 'healthcare',
    },
    {
      id: 'healthcare-dental',
      name: 'Dental Practice',
      description: 'Dental services',
      complexity: 'intermediate',
      features: ['Patient Management', 'Treatment Planning', 'Insurance Claims', 'Appointment Booking'],
      setupTimeMinutes: 55,
      categoryId: 'healthcare',
    },
    {
      id: 'healthcare-therapy',
      name: 'Therapy Practice',
      description: 'Mental health and therapy services',
      complexity: 'intermediate',
      features: ['Session Management', 'Patient Notes', 'Billing', 'HIPAA Compliance'],
      setupTimeMinutes: 50,
      categoryId: 'healthcare',
    },
    {
      id: 'healthcare-hospital',
      name: 'Hospital',
      description: 'Hospital and inpatient care',
      complexity: 'advanced',
      features: ['Patient Management', 'Department Coordination', 'Medical Records', 'Bed Management'],
      setupTimeMinutes: 120,
      categoryId: 'healthcare',
    },
    {
      id: 'healthcare-telehealth',
      name: 'Telehealth Platform',
      description: 'Online medical consultations',
      complexity: 'advanced',
      features: ['Video Consultations', 'Patient Portal', 'Prescription Delivery', 'Follow-up Management'],
      setupTimeMinutes: 75,
      categoryId: 'healthcare',
    },
  ],
  education: [
    {
      id: 'education-school',
      name: 'School',
      description: 'K-12 educational institution',
      complexity: 'advanced',
      features: ['Student Information System', 'Grading System', 'Parent Portal', 'Course Management'],
      setupTimeMinutes: 90,
      categoryId: 'education',
    },
    {
      id: 'education-university',
      name: 'University',
      description: 'Higher education institution',
      complexity: 'advanced',
      features: ['Student Records', 'Course Registration', 'Research Tracking', 'Graduation Planning'],
      setupTimeMinutes: 100,
      categoryId: 'education',
    },
    {
      id: 'education-online-course',
      name: 'Online Course Platform',
      description: 'E-learning platform',
      complexity: 'advanced',
      features: ['Content Management', 'Student Progress', 'Discussion Forums', 'Certification System'],
      setupTimeMinutes: 85,
      categoryId: 'education',
    },
    {
      id: 'education-coding-bootcamp',
      name: 'Coding Bootcamp',
      description: 'Intensive coding education',
      complexity: 'intermediate',
      features: ['Curriculum Management', 'Project Tracking', 'Code Review System', 'Job Placement'],
      setupTimeMinutes: 60,
      categoryId: 'education',
    },
    {
      id: 'education-language',
      name: 'Language School',
      description: 'Language learning institution',
      complexity: 'intermediate',
      features: ['Class Scheduling', 'Student Levels', 'Practice Tracking', 'Certificate Generation'],
      setupTimeMinutes: 50,
      categoryId: 'education',
    },
    {
      id: 'education-music',
      name: 'Music Academy',
      description: 'Music education and lessons',
      complexity: 'intermediate',
      features: ['Lesson Scheduling', 'Student Progress', 'Recital Planning', 'Theory Testing'],
      setupTimeMinutes: 45,
      categoryId: 'education',
    },
    {
      id: 'education-corporate-training',
      name: 'Corporate Training',
      description: 'Employee training programs',
      complexity: 'intermediate',
      features: ['Course Library', 'Compliance Tracking', 'Certification Management', 'ROI Reporting'],
      setupTimeMinutes: 55,
      categoryId: 'education',
    },
    {
      id: 'education-test-prep',
      name: 'Test Prep Center',
      description: 'Standardized test preparation',
      complexity: 'intermediate',
      features: ['Practice Tests', 'Progress Analytics', 'Adaptive Learning', 'Score Prediction'],
      setupTimeMinutes: 50,
      categoryId: 'education',
    },
    {
      id: 'education-library',
      name: 'Digital Library',
      description: 'Digital content and library management',
      complexity: 'intermediate',
      features: ['Content Catalog', 'Checkout System', 'Member Management', 'Recommendation Engine'],
      setupTimeMinutes: 55,
      categoryId: 'education',
    },
  ],
  realestate: [
    {
      id: 'realestate-agency',
      name: 'Real Estate Agency',
      description: 'Property sales and rentals',
      complexity: 'intermediate',
      features: ['Property Listing', 'Client Management', 'Showing Scheduler', 'Offer Management'],
      setupTimeMinutes: 55,
      categoryId: 'realestate',
    },
    {
      id: 'realestate-property-management',
      name: 'Property Management',
      description: 'Residential property management',
      complexity: 'intermediate',
      features: ['Tenant Management', 'Maintenance Tracking', 'Rent Collection', 'Expense Management'],
      setupTimeMinutes: 60,
      categoryId: 'realestate',
    },
    {
      id: 'realestate-developer',
      name: 'Real Estate Developer',
      description: 'Property development',
      complexity: 'advanced',
      features: ['Project Planning', 'Budget Management', 'Sales Tracking', 'Vendor Management'],
      setupTimeMinutes: 80,
      categoryId: 'realestate',
    },
    {
      id: 'realestate-commercial',
      name: 'Commercial Leasing',
      description: 'Commercial property leasing',
      complexity: 'intermediate',
      features: ['Space Management', 'Tenant Contracts', 'Revenue Tracking', 'Compliance Monitoring'],
      setupTimeMinutes: 65,
      categoryId: 'realestate',
    },
  ],
  creative: [
    {
      id: 'creative-design-studio',
      name: 'Design Studio',
      description: 'Graphic and UX design services',
      complexity: 'intermediate',
      features: ['Project Management', 'Asset Library', 'Client Collaboration', 'Time Tracking'],
      setupTimeMinutes: 50,
      categoryId: 'creative',
    },
    {
      id: 'creative-advertising',
      name: 'Advertising Agency',
      description: 'Advertising and marketing',
      complexity: 'advanced',
      features: ['Campaign Management', 'Media Planning', 'Budget Tracking', 'Performance Analytics'],
      setupTimeMinutes: 75,
      categoryId: 'creative',
    },
    {
      id: 'creative-production',
      name: 'Production House',
      description: 'Video and media production',
      complexity: 'advanced',
      features: ['Project Management', 'Asset Management', 'Crew Scheduling', 'Budget Tracking'],
      setupTimeMinutes: 80,
      categoryId: 'creative',
    },
    {
      id: 'creative-content',
      name: 'Content Creation',
      description: 'Content creation and influencer',
      complexity: 'intermediate',
      features: ['Content Calendar', 'Analytics Dashboard', 'Collaboration Tools', 'Monetization Tracking'],
      setupTimeMinutes: 45,
      categoryId: 'creative',
    },
    {
      id: 'creative-animation',
      name: 'Animation Studio',
      description: 'Animation and motion graphics',
      complexity: 'advanced',
      features: ['Project Management', 'Asset Library', 'Rendering Queue', 'Client Review Portal'],
      setupTimeMinutes: 85,
      categoryId: 'creative',
    },
    {
      id: 'creative-game-dev',
      name: 'Game Development',
      description: 'Game development studio',
      complexity: 'advanced',
      features: ['Version Control', 'Team Collaboration', 'Bug Tracking', 'Build Management'],
      setupTimeMinutes: 90,
      categoryId: 'creative',
    },
    {
      id: 'creative-architecture',
      name: 'Architecture Firm',
      description: 'Architectural design services',
      complexity: 'intermediate',
      features: ['Project Management', 'Document Repository', 'Client Collaboration', 'Estimation Tools'],
      setupTimeMinutes: 55,
      categoryId: 'creative',
    },
    {
      id: 'creative-writing',
      name: 'Writing Agency',
      description: 'Content writing and copywriting',
      complexity: 'intermediate',
      features: ['Assignment Management', 'Workflow Management', 'Client Communication', 'Payment Tracking'],
      setupTimeMinutes: 45,
      categoryId: 'creative',
    },
    {
      id: 'creative-events',
      name: 'Event Planning',
      description: 'Event planning and management',
      complexity: 'intermediate',
      features: ['Event Management', 'Vendor Coordination', 'Budget Tracking', 'Guest Management'],
      setupTimeMinutes: 55,
      categoryId: 'creative',
    },
    {
      id: 'creative-music-production',
      name: 'Music Production',
      description: 'Music production and recording',
      complexity: 'intermediate',
      features: ['Session Scheduling', 'Equipment Management', 'Project Tracking', 'Mixing Workflow'],
      setupTimeMinutes: 50,
      categoryId: 'creative',
    },
  ],
  automotive: [
    {
      id: 'automotive-dealership',
      name: 'Car Dealership',
      description: 'New and used car sales',
      complexity: 'intermediate',
      features: ['Inventory Management', 'Customer Tracking', 'Sales Pipeline', 'Service Scheduling'],
      setupTimeMinutes: 60,
      categoryId: 'automotive',
    },
    {
      id: 'automotive-repair',
      name: 'Auto Repair Shop',
      description: 'Automotive repair and maintenance',
      complexity: 'intermediate',
      features: ['Work Order Management', 'Parts Inventory', 'Technician Scheduling', 'Service History'],
      setupTimeMinutes: 50,
      categoryId: 'automotive',
    },
    {
      id: 'automotive-rental',
      name: 'Car Rental Service',
      description: 'Vehicle rental and leasing',
      complexity: 'intermediate',
      features: ['Fleet Management', 'Reservation System', 'Damage Assessment', 'Maintenance Scheduling'],
      setupTimeMinutes: 55,
      categoryId: 'automotive',
    },
    {
      id: 'automotive-detailing',
      name: 'Car Detailing',
      description: 'Professional detailing services',
      complexity: 'simple',
      features: ['Service Booking', 'Customer Management', 'Price List', 'Service History'],
      setupTimeMinutes: 25,
      categoryId: 'automotive',
    },
    {
      id: 'automotive-shipping',
      name: 'Auto Transport',
      description: 'Vehicle transportation services',
      complexity: 'intermediate',
      features: ['Quote Generation', 'Shipment Tracking', 'Route Optimization', 'Driver Management'],
      setupTimeMinutes: 55,
      categoryId: 'automotive',
    },
    {
      id: 'automotive-collision',
      name: 'Collision Center',
      description: 'Collision repair services',
      complexity: 'intermediate',
      features: ['Estimate System', 'Work Order Management', 'Parts Management', 'Insurance Integration'],
      setupTimeMinutes: 60,
      categoryId: 'automotive',
    },
    {
      id: 'automotive-dealership-network',
      name: 'Multi-Location Dealership',
      description: 'Multi-location car dealership',
      complexity: 'advanced',
      features: ['Inventory Sync', 'Centralized Management', 'Regional Analytics', 'Multi-Location Reporting'],
      setupTimeMinutes: 85,
      categoryId: 'automotive',
    },
  ],
  financial: [
    {
      id: 'financial-investment',
      name: 'Investment Firm',
      description: 'Investment management services',
      complexity: 'advanced',
      features: ['Portfolio Management', 'Market Data', 'Reporting Tools', 'Risk Analytics'],
      setupTimeMinutes: 90,
      categoryId: 'financial',
    },
    {
      id: 'financial-insurance',
      name: 'Insurance Agency',
      description: 'Insurance sales and management',
      complexity: 'intermediate',
      features: ['Policy Management', 'Client Database', 'Commission Tracking', 'Claims Management'],
      setupTimeMinutes: 60,
      categoryId: 'financial',
    },
    {
      id: 'financial-accounting',
      name: 'Accounting Practice',
      description: 'Accounting and bookkeeping',
      complexity: 'intermediate',
      features: ['Client Records', 'Financial Reports', 'Tax Planning', 'Audit Management'],
      setupTimeMinutes: 55,
      categoryId: 'financial',
    },
    {
      id: 'financial-mortgage',
      name: 'Mortgage Brokerage',
      description: 'Mortgage origination and brokerage',
      complexity: 'intermediate',
      features: ['Loan Processing', 'Document Management', 'Client Portal', 'Compliance Tracking'],
      setupTimeMinutes: 65,
      categoryId: 'financial',
    },
    {
      id: 'financial-payroll',
      name: 'Payroll Service',
      description: 'Payroll processing services',
      complexity: 'advanced',
      features: ['Employee Management', 'Tax Calculation', 'Direct Deposit', 'Compliance Reporting'],
      setupTimeMinutes: 80,
      categoryId: 'financial',
    },
    {
      id: 'financial-fintech',
      name: 'FinTech Platform',
      description: 'Financial technology platform',
      complexity: 'advanced',
      features: ['Payment Processing', 'User Authentication', 'Transaction Analytics', 'Compliance Tools'],
      setupTimeMinutes: 95,
      categoryId: 'financial',
    },
    {
      id: 'financial-credit-union',
      name: 'Credit Union',
      description: 'Credit union operations',
      complexity: 'advanced',
      features: ['Member Accounts', 'Loan Management', 'Dividend Calculation', 'Compliance Framework'],
      setupTimeMinutes: 100,
      categoryId: 'financial',
    },
    {
      id: 'financial-wealth-management',
      name: 'Wealth Management',
      description: 'High-net-worth wealth management',
      complexity: 'advanced',
      features: ['Portfolio Analysis', 'Estate Planning', 'Client Reporting', 'Performance Tracking'],
      setupTimeMinutes: 85,
      categoryId: 'financial',
    },
  ],
};

interface BusinessTypeSelectorProps {
  category: string;
  onSelect: (type: BusinessType) => void;
  onBack: () => void;
}

export function BusinessTypeSelector({ category, onSelect, onBack }: BusinessTypeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const colors = {
    bg: '#0f172a',
    card: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    accent: '#9333ea',
    accentHover: '#a855f7',
    simpleBg: '#dcfce7',
    simpleText: '#166534',
    intermediateBg: '#fef3c7',
    intermediateText: '#92400e',
    advancedBg: '#fee2e2',
    advancedText: '#991b1b',
  };

  const businessTypes = BUSINESS_TYPES_BY_CATEGORY[category] || [];

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return businessTypes;
    return businessTypes.filter(
      type =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, businessTypes]);

  const getComplexityStyles = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return { bg: colors.simpleBg, text: colors.simpleText, label: 'Simple' };
      case 'intermediate':
        return { bg: colors.intermediateBg, text: colors.intermediateText, label: 'Intermediate' };
      case 'advanced':
        return { bg: colors.advancedBg, text: colors.advancedText, label: 'Advanced' };
      default:
        return { bg: colors.border, text: colors.textMuted, label: 'Unknown' };
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header with Back Button */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            color: colors.textMuted,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.target as HTMLElement;
            el.style.borderColor = colors.accent;
            el.style.color = colors.accent;
          }}
          onMouseLeave={e => {
            const el = e.target as HTMLElement;
            el.style.borderColor = colors.border;
            el.style.color = colors.textMuted;
          }}
          aria-label="Go back to category selection"
        >
          <ChevronLeft size={16} />
          Back to Categories
        </button>

        <h2
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: colors.text,
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Choose Business Type
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: colors.textMuted,
            margin: 0,
          }}
        >
          Select a business type to see available templates and setup options.
        </p>
      </div>

      {/* Search Bar */}
      <div
        style={{
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.textMuted,
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search business types..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 12px 12px 44px',
            background: colors.card,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = colors.accent;
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = colors.border;
          }}
          aria-label="Search business types"
        />
      </div>

      {/* Business Types Grid */}
      {filteredTypes.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredTypes.map(type => {
            const complexityStyle = getComplexityStyles(type.complexity);

            return (
              <div
                key={type.id}
                onClick={() => onSelect(type)}
                style={{
                  background: colors.card,
                  border: `2px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = colors.accent;
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = `0 20px 25px -5px ${colors.accent}30`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = colors.border;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${type.name} business type`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(type);
                  }
                }}
              >
                {/* Type Name and Complexity */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: colors.text,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {type.name}
                  </h3>
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: complexityStyle.bg,
                      color: complexityStyle.text,
                      fontSize: '11px',
                      fontWeight: 600,
                      marginLeft: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {complexityStyle.label}
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '13px',
                    color: colors.textMuted,
                    margin: '0 0 12px 0',
                    lineHeight: '1.5',
                  }}
                >
                  {type.description}
                </p>

                {/* Setup Time */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: colors.textMuted,
                  }}
                >
                  <Clock size={14} />
                  <span>{type.setupTimeMinutes} min setup</span>
                </div>

                {/* Features */}
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: colors.textMuted,
                      marginBottom: '6px',
                      fontWeight: 500,
                    }}
                  >
                    Key Features:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {type.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: `${colors.accent}20`,
                          color: colors.accent,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                    {type.features.length > 3 && (
                      <span
                        style={{
                          color: colors.textMuted,
                          fontSize: '11px',
                          padding: '4px 8px',
                        }}
                      >
                        +{type.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* All Features on Hover */}
                <div
                  style={{
                    paddingTop: '12px',
                    borderTop: `1px solid ${colors.border}`,
                    fontSize: '11px',
                    color: colors.textMuted,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={12} />
                    <span>{type.features.length} total features included</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: colors.card,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
          }}
        >
          <p
            style={{
              fontSize: '16px',
              color: colors.textMuted,
              margin: 0,
            }}
          >
            No business types match your search. Try different keywords.
          </p>
        </div>
      )}
    </div>
  );
}

export default BusinessTypeSelector;
