import React, { useState, useMemo } from 'react';
import { ChevronLeft, Clock, Zap, BarChart3, ArrowRight } from 'lucide-react';

// Template Interface
export interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  featureCount: number;
  setupTimeMinutes: number;
  complexity: 'simple' | 'intermediate' | 'advanced';
  businessTypeId: string;
  features: string[];
  automations: string[];
  integrations: string[];
  sampleData: boolean;
}

// Mock Templates Data
const TEMPLATES_BY_BUSINESS_TYPE: Record<string, Template[]> = {
  'retail-ecommerce': [
    {
      id: 'template-ecom-basic',
      name: 'Basic E-Commerce Store',
      description: 'Simple online store with product catalog and checkout',
      icon: '🛒',
      featureCount: 8,
      setupTimeMinutes: 30,
      complexity: 'simple',
      businessTypeId: 'retail-ecommerce',
      features: ['Product Catalog', 'Shopping Cart', 'Checkout', 'Order Tracking', 'Email Notifications', 'Basic Analytics', 'Customer Accounts', 'Payment Integration'],
      automations: ['Order Confirmation Email', 'Inventory Update', 'Customer Welcome Series'],
      integrations: ['Stripe', 'PayPal', 'Email'],
      sampleData: true,
    },
    {
      id: 'template-ecom-advanced',
      name: 'Advanced E-Commerce Platform',
      description: 'Full-featured store with marketing automation and analytics',
      icon: '🚀',
      featureCount: 18,
      setupTimeMinutes: 60,
      complexity: 'advanced',
      businessTypeId: 'retail-ecommerce',
      features: ['Product Variants', 'Inventory Management', 'Discount System', 'Customer Segmentation', 'Marketing Automation', 'Advanced Analytics', 'Multi-channel Selling', 'Affiliate Program', 'Subscription Management', 'Mobile App', 'AR Preview', 'AI Recommendations', 'Loyalty Program', 'Gift Cards', 'Wishlists', 'Bundle Products', 'Dynamic Pricing', 'Multi-language Support'],
      automations: ['Abandoned Cart Recovery', 'Dynamic Pricing', 'Personalized Product Recommendations', 'Post-Purchase Nurture Sequence', 'VIP Customer Handling', 'Restock Alerts'],
      integrations: ['Stripe', 'PayPal', 'Square', 'Shopify', 'Google Analytics', 'Facebook Pixel', 'Slack', 'Twilio', 'Klaviyo'],
      sampleData: true,
    },
    {
      id: 'template-ecom-saas-store',
      name: 'Digital Products Store',
      description: 'Store for selling digital downloads and software',
      icon: '💾',
      featureCount: 12,
      setupTimeMinutes: 45,
      complexity: 'intermediate',
      businessTypeId: 'retail-ecommerce',
      features: ['Instant Download', 'License Management', 'Usage Tracking', 'Subscription Tiers', 'Update Notifications', 'Customer Support System', 'API Access', 'Webhook Support', 'Usage Analytics', 'Rate Limiting', 'Version Control', 'Review System'],
      automations: ['License Generation', 'Download Tracking', 'Subscription Renewal Reminders', 'Support Ticket Routing'],
      integrations: ['Stripe', 'Gumroad', 'SendGrid', 'GitHub', 'Slack'],
      sampleData: true,
    },
  ],
  'retail-boutique': [
    {
      id: 'template-boutique-classic',
      name: 'Classic Boutique',
      description: 'Elegant store for high-end retail',
      icon: '👗',
      featureCount: 10,
      setupTimeMinutes: 25,
      complexity: 'simple',
      businessTypeId: 'retail-boutique',
      features: ['Product Showcase', 'Image Gallery', 'Customer Reviews', 'Wishlist', 'Email Notifications', 'Order History', 'Customer Dashboard', 'Seasonal Collections', 'Staff Recommendations', 'Social Integration'],
      automations: ['New Arrival Alerts', 'Sale Notifications', 'Birthday Specials', 'Re-engagement Campaigns'],
      integrations: ['Instagram', 'Facebook', 'Email', 'SMS'],
      sampleData: true,
    },
  ],
  'food-restaurant': [
    {
      id: 'template-restaurant-full',
      name: 'Full-Service Restaurant',
      description: 'Complete restaurant management system',
      icon: '🍽️',
      featureCount: 15,
      setupTimeMinutes: 50,
      complexity: 'intermediate',
      businessTypeId: 'food-restaurant',
      features: ['Digital Menu', 'Table Reservation', 'Order Management', 'Kitchen Display System', 'Inventory Management', 'Staff Management', 'POS Integration', 'Payment Processing', 'Customer Reviews', 'Loyalty Program', 'Promotions', 'Table Map', 'Wait Time Tracking', 'Delivery Integration', 'Analytics Dashboard'],
      automations: ['Reservation Reminders', 'Order Status Updates', 'Staff Shift Alerts', 'Inventory Low Alerts'],
      integrations: ['Toast POS', 'Square', 'Stripe', 'DoorDash', 'Uber Eats', 'OpenTable', 'Email', 'SMS'],
      sampleData: true,
    },
    {
      id: 'template-restaurant-quick-service',
      name: 'Quick Service Restaurant',
      description: 'Fast casual restaurant operations',
      icon: '⚡',
      featureCount: 10,
      setupTimeMinutes: 30,
      complexity: 'simple',
      businessTypeId: 'food-restaurant',
      features: ['Quick Menu', 'Order Kiosk', 'Queue Management', 'Mobile Ordering', 'Pickup Tracking', 'Online Payment', 'Loyalty Program', 'Promotions', 'Basic Analytics', 'Delivery Ready'],
      automations: ['Order Ready Notifications', 'Promotion Scheduling', 'Daily Summary Reports'],
      integrations: ['Square', 'Stripe', 'Email', 'SMS'],
      sampleData: true,
    },
  ],
  'services-consulting': [
    {
      id: 'template-consulting-agency',
      name: 'Consulting Agency',
      description: 'Full consulting firm operations',
      icon: '💼',
      featureCount: 16,
      setupTimeMinutes: 55,
      complexity: 'intermediate',
      businessTypeId: 'services-consulting',
      features: ['Project Management', 'Time Tracking', 'Resource Planning', 'Client Portal', 'Proposal Builder', 'Invoice Generation', 'Expense Tracking', 'Team Collaboration', 'Document Repository', 'Meeting Scheduler', 'Report Generation', 'Budget Tracking', 'Risk Management', 'Quality Assurance', 'Client Communication', 'Analytics Dashboard'],
      automations: ['Invoice Generation', 'Time Sheet Reminders', 'Meeting Confirmations', 'Project Status Updates', 'Resource Allocation Optimization'],
      integrations: ['Monday.com', 'Asana', 'Google Workspace', 'Slack', 'Stripe', 'QuickBooks'],
      sampleData: true,
    },
  ],
  'healthcare-clinic': [
    {
      id: 'template-clinic-primary-care',
      name: 'Primary Care Clinic',
      description: 'General practice medical clinic',
      icon: '⚕️',
      featureCount: 14,
      setupTimeMinutes: 60,
      complexity: 'intermediate',
      businessTypeId: 'healthcare-clinic',
      features: ['Patient Records', 'Appointment Scheduling', 'Prescription Management', 'Insurance Processing', 'Vital Signs Tracking', 'Treatment History', 'Lab Results', 'Billing System', 'Payment Processing', 'Patient Portal', 'Secure Messaging', 'Referral Management', 'Compliance Tools', 'Analytics Dashboard'],
      automations: ['Appointment Reminders', 'Prescription Refill Reminders', 'Insurance Claim Submission', 'Patient Intake Forms'],
      integrations: ['Epic', 'Cerner', 'Stripe', 'Twilio', 'SendGrid'],
      sampleData: false,
    },
  ],
  'education-school': [
    {
      id: 'template-school-management',
      name: 'School Management System',
      description: 'K-12 school operations',
      icon: '🎓',
      featureCount: 17,
      setupTimeMinutes: 70,
      complexity: 'advanced',
      businessTypeId: 'education-school',
      features: ['Student Information System', 'Grading System', 'Attendance Tracking', 'Course Management', 'Parent Portal', 'Teacher Tools', 'Lesson Planning', 'Assignment Tracking', 'Communication System', 'Timetable Management', 'Fee Management', 'Transport Management', 'Hostel Management', 'Library System', 'Exam Management', 'Report Generation', 'Advanced Analytics'],
      automations: ['Attendance Reports', 'Grade Notifications', 'Fee Reminders', 'Holiday Alerts', 'Parent Communications'],
      integrations: ['PowerSchool', 'Schoology', 'Google Classroom', 'Canvas', 'Zoom', 'Email'],
      sampleData: true,
    },
  ],
  'creative-design-studio': [
    {
      id: 'template-design-studio',
      name: 'Design Studio',
      description: 'Creative agency project management',
      icon: '🎨',
      featureCount: 12,
      setupTimeMinutes: 45,
      complexity: 'intermediate',
      businessTypeId: 'creative-design-studio',
      features: ['Project Management', 'Client Portal', 'Asset Library', 'Time Tracking', 'Resource Allocation', 'Invoice Generation', 'Feedback System', 'Version Control', 'Approval Workflow', 'Budget Tracking', 'Team Collaboration', 'Analytics Dashboard'],
      automations: ['Project Status Updates', 'Invoice Generation', 'Time Tracking Reminders', 'Client Notifications'],
      integrations: ['Figma', 'Adobe Creative Cloud', 'Slack', 'Monday.com', 'Stripe'],
      sampleData: true,
    },
  ],
  'b2b-saas': [
    {
      id: 'template-saas-standard',
      name: 'SaaS Platform',
      description: 'Complete SaaS application infrastructure',
      icon: '☁️',
      featureCount: 18,
      setupTimeMinutes: 75,
      complexity: 'advanced',
      businessTypeId: 'b2b-saas',
      features: ['User Management', 'Authentication', 'Authorization', 'Billing System', 'Subscription Management', 'Usage Tracking', 'API Documentation', 'Developer Dashboard', 'Analytics Engine', 'Data Export', 'Webhook Support', 'Rate Limiting', 'Advanced Security', 'Audit Logging', 'SSO Integration', 'Multi-tenancy', 'Custom Domains', 'Status Page'],
      automations: ['Subscription Renewal', 'Usage Alerts', 'Upgrade Reminders', 'Churn Prevention', 'Trial Conversion Sequences'],
      integrations: ['Stripe', 'AWS', 'Google Cloud', 'Slack', 'Salesforce', 'Mixpanel', 'Datadog'],
      sampleData: true,
    },
  ],
  'realestate-agency': [
    {
      id: 'template-realestate-agent',
      name: 'Real Estate Agent',
      description: 'Individual agent or small team operations',
      icon: '🏠',
      featureCount: 11,
      setupTimeMinutes: 40,
      complexity: 'intermediate',
      businessTypeId: 'realestate-agency',
      features: ['Property Listings', 'Virtual Tours', 'Buyer Management', 'Seller Management', 'Showing Scheduler', 'Offer Management', 'Document Management', 'Transaction Timeline', 'Commission Tracking', 'Client Communication', 'Lead Management'],
      automations: ['Showing Availability Updates', 'Offer Notifications', 'Document Reminders', 'Client Follow-ups'],
      integrations: ['MLS', 'Zillow', 'Realtor.com', 'Google Maps', 'Twilio'],
      sampleData: true,
    },
  ],
  'automotive-dealership': [
    {
      id: 'template-dealership-management',
      name: 'Car Dealership',
      description: 'Complete dealership operations',
      icon: '🚗',
      featureCount: 14,
      setupTimeMinutes: 65,
      complexity: 'intermediate',
      businessTypeId: 'automotive-dealership',
      features: ['Inventory Management', 'Customer Tracking', 'Sales Pipeline', 'Service Scheduling', 'Service History', 'Parts Management', 'Finance Integration', 'Trade-in Evaluation', 'Pricing Engine', 'Lead Management', 'Commission Tracking', 'Analytics Dashboard', 'Compliance Tools', 'Multi-location Support'],
      automations: ['Inventory Updates', 'Service Reminders', 'Lead Follow-ups', 'Service History Notifications'],
      integrations: ['DealerTrack', 'Cox Automotive', 'Google Analytics', 'Twilio', 'Email'],
      sampleData: true,
    },
  ],
  'financial-investment': [
    {
      id: 'template-investment-firm',
      name: 'Investment Firm',
      description: 'Portfolio and wealth management',
      icon: '💰',
      featureCount: 15,
      setupTimeMinutes: 70,
      complexity: 'advanced',
      businessTypeId: 'financial-investment',
      features: ['Portfolio Management', 'Client Accounts', 'Market Data Integration', 'Performance Reporting', 'Risk Analysis', 'Asset Allocation', 'Trade Execution', 'Document Management', 'Client Portal', 'Compliance Tracking', 'Tax Planning', 'Fee Management', 'Rebalancing Tools', 'Alert System', 'Advanced Analytics'],
      automations: ['Portfolio Rebalancing', 'Performance Reports', 'Dividend Tracking', 'Compliance Alerts'],
      integrations: ['Bloomberg', 'FactSet', 'E*TRADE', 'Charles Schwab', 'Salesforce'],
      sampleData: false,
    },
  ],
};

interface TemplateSelectorProps {
  businessType: string;
  onSelect: (template: Template) => void;
  onBack: () => void;
}

export function TemplateSelector({ businessType, onSelect, onBack }: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const colors = {
    bg: '#0f172a',
    card: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    accent: '#9333ea',
    accentHover: '#a855f7',
  };

  const templates = TEMPLATES_BY_BUSINESS_TYPE[businessType] || [];

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
          aria-label="Go back to business type selection"
        >
          <ChevronLeft size={16} />
          Back to Business Types
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
          Select a Template
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: colors.textMuted,
            margin: 0,
          }}
        >
          {templates.length} professionally designed templates available for this business type.
        </p>
      </div>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {templates.map(template => {
            const isHovered = hoveredId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => onSelect(template)}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: colors.card,
                  border: `2px solid ${isHovered ? colors.accent : colors.border}`,
                  borderRadius: '12px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                  boxShadow: isHovered ? `0 20px 25px -5px ${colors.accent}30` : 'none',
                }}
                role="button"
                tabIndex={0}
                aria-label={`Select ${template.name} template`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(template);
                  }
                }}
              >
                {/* Icon and Header */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '32px',
                      marginBottom: '12px',
                    }}
                  >
                    {template.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: colors.text,
                      margin: '0 0 6px 0',
                    }}
                  >
                    {template.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: colors.textMuted,
                      margin: 0,
                      lineHeight: '1.5',
                    }}
                  >
                    {template.description}
                  </p>
                </div>

                {/* Metadata Row */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.textMuted' }}>
                    <Zap size={14} />
                    <span>{template.featureCount} Features</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.textMuted }}>
                    <Clock size={14} />
                    <span>{template.setupTimeMinutes}m Setup</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.textMuted }}>
                    <BarChart3 size={14} />
                    <span>{template.complexity === 'simple' ? 'Simple' : template.complexity === 'intermediate' ? 'Intermediate' : 'Advanced'}</span>
                  </div>
                </div>

                {/* Sample Data Badge */}
                {template.sampleData && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: `${colors.accent}20`,
                      color: colors.accent,
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    ✨ Includes Sample Data
                  </div>
                )}

                {/* Features Preview */}
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      color: colors.textMuted,
                      marginBottom: '6px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Key Features
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {template.features.slice(0, 4).map((feature, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: `${colors.accent}15`,
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
                    {template.features.length > 4 && (
                      <span
                        style={{
                          color: colors.textMuted,
                          fontSize: '11px',
                          padding: '4px 8px',
                        }}
                      >
                        +{template.features.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover State - Show More Details */}
                {isHovered && (
                  <div
                    style={{
                      paddingTop: '12px',
                      borderTop: `1px solid ${colors.border}`,
                      animation: 'fadeIn 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        color: colors.textMuted,
                        marginBottom: '8px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Automations Included
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '12px',
                      }}
                    >
                      {template.automations.slice(0, 2).map((automation, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            color: colors.textMuted,
                          }}
                        >
                          <span style={{ color: colors.accent }}>→</span>
                          {automation}
                        </div>
                      ))}
                      {template.automations.length > 2 && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: colors.textMuted,
                            marginTop: '4px',
                          }}
                        >
                          +{template.automations.length - 2} more automations
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '12px',
                        padding: '12px',
                        background: `${colors.accent}10`,
                        borderRadius: '6px',
                        color: colors.accent,
                        fontSize: '12px',
                        fontWeight: 600,
                        justifyContent: 'center',
                      }}
                    >
                      View Full Template Details
                      <ArrowRight size={14} />
                    </div>
                  </div>
                )}
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
            No templates available for this business type yet.
          </p>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
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

export default TemplateSelector;
