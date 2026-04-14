// Centralized help content for all pages and features
// Format: { title: string, description: string }

export const helpContent = {
  // Outreach Page
  campaigns: {
    title: 'Email Campaigns',
    description: 'Create and manage email campaigns to reach your customers. Track opens, clicks, and engagement metrics in real-time.',
  },
  campaignName: {
    title: 'Campaign Name',
    description: 'Give your campaign a descriptive name to help you identify it later. E.g., "Spring Sale 2024"',
  },
  campaignSubject: {
    title: 'Email Subject Line',
    description: 'Keep it under 50 characters for best performance. Use personalization tags like {name} to increase open rates.',
  },
  campaignTemplate: {
    title: 'Email Template',
    description: 'Choose from pre-designed templates or create a custom HTML template. Templates include variables like {name}, {business}, {offer}, and {amount}.',
  },
  recipientList: {
    title: 'Recipient List',
    description: 'Upload a CSV file with recipient emails. Format: email,name,business. Only valid email addresses will be sent.',
  },
  scheduleEmail: {
    title: 'Schedule Email',
    description: 'Choose to send immediately or schedule for a specific date and time. Scheduled emails will start sending at the selected time.',
  },
  warmupMode: {
    title: 'Email Warmup',
    description: 'Gradually increase sending volume to improve deliverability. Helps establish sender reputation with email providers.',
  },

  // Single Email Send
  singleEmailSend: {
    title: 'Send Single Email',
    description: 'Send a quick email to one person. Perfect for personalized messages or testing templates.',
  },
  saveDraft: {
    title: 'Save as Draft',
    description: 'Save this email for later. You can edit and send it anytime from your drafts list.',
  },

  // Progress Tracking
  progressTracking: {
    title: 'Real-Time Progress',
    description: 'Watch your email campaign progress in real-time. See how many emails were sent, delivered, opened, and clicked.',
  },
  deliveryRate: {
    title: 'Delivery Rate',
    description: 'Percentage of emails successfully delivered to recipients\' inboxes. (Delivered / Sent) × 100',
  },
  openRate: {
    title: 'Open Rate',
    description: 'Percentage of recipients who opened your email. (Opened / Delivered) × 100',
  },
  clickRate: {
    title: 'Click Rate',
    description: 'Percentage of recipients who clicked a link in your email. (Clicked / Opened) × 100',
  },

  // Leads Page
  importLeads: {
    title: 'Import Leads',
    description: 'Upload a CSV file containing your customer data. Supported columns: email, name, phone, business_name, city.',
  },
  leadsCSVFormat: {
    title: 'CSV Format',
    description: 'Format your CSV file with headers in the first row. Example: email,name,phone,city,business_name',
  },
  leads: {
    title: 'Leads & Contacts',
    description: 'Manage your customer list. Segment leads by location, business type, and other criteria for targeted campaigns.',
  },

  // Dashboard
  dashboardOverview: {
    title: 'Dashboard Overview',
    description: 'Get a quick overview of your business performance. View email metrics, recent campaigns, and key statistics.',
  },
  metrics: {
    title: 'Key Metrics',
    description: 'Monitor your business health. Track email campaigns sent, deliveries, opens, and customer engagement.',
  },
  gettingStarted: {
    title: 'Getting Started',
    description: 'New to Redeem Rocket? Follow these steps to set up your first email campaign and start reaching customers.',
  },

  // Settings
  senderIdentity: {
    title: 'Sender Identity',
    description: 'Configure who the emails come from. Use your business name and a professional email address for better deliverability.',
  },
  businessEmail: {
    title: 'Business Email',
    description: 'The email address that appears as the sender. Ensure this matches your domain for better delivery rates.',
  },

  // Team Management
  teamMembers: {
    title: 'Team Members',
    description: 'Add team members to help manage campaigns. Assign roles and permissions based on their responsibilities.',
  },
  teamMemberRole: {
    title: 'Team Member Role',
    description: 'Owner: Full access. Manager: Manage campaigns & team. Team Member: Create campaigns only. Viewer: Read-only.',
  },
};

// Feature guide steps for onboarding
export const featureGuides = {
  dashboard: [
    {
      title: 'Welcome to Redeem Rocket',
      description: 'This is your command center for email marketing. View all your metrics and campaigns here.',
      highlight: 'metrics-section',
    },
    {
      title: 'Recent Campaigns',
      description: 'See your latest campaigns and their performance at a glance.',
      highlight: 'recent-campaigns',
    },
    {
      title: 'Quick Actions',
      description: 'Start creating campaigns or importing leads from here.',
      highlight: 'quick-actions',
    },
  ],

  outreach: [
    {
      title: 'Campaign Management',
      description: 'View all your campaigns organized by status: Draft, Scheduled, Running, Completed.',
      highlight: 'campaign-kanban',
    },
    {
      title: 'Create Campaign',
      description: 'Click to create a new email campaign. Follow the wizard to choose recipients and set up your email.',
      highlight: 'create-campaign-btn',
    },
    {
      title: 'Real-Time Tracking',
      description: 'Watch your campaigns progress in real-time as emails are sent and engaged with.',
      highlight: 'campaign-stats',
    },
    {
      title: 'Send Single Email',
      description: 'Need to send a quick email? Use this to send to one person without creating a full campaign.',
      highlight: 'send-email-btn',
    },
  ],

  leads: [
    {
      title: 'Your Lead Database',
      description: 'All your customer contacts are stored here. Organize them by location, business type, and other criteria.',
      highlight: 'leads-table',
    },
    {
      title: 'Import Leads',
      description: 'Upload a CSV file with your customer data to add new leads quickly.',
      highlight: 'import-leads-btn',
    },
    {
      title: 'Create Segments',
      description: 'Group leads by location or other characteristics to send targeted campaigns.',
      highlight: 'create-segment-btn',
    },
  ],
};

// Tips and best practices
export const tips = {
  emailSubject: [
    'Keep it under 50 characters for mobile readiness',
    'Use personalization tags like {name} for higher open rates',
    'Avoid spam trigger words like "FREE", "URGENT", "WINNER"',
    'Test with your team before sending to large lists',
  ],
  emailContent: [
    'Make it mobile-friendly with short paragraphs and buttons',
    'Include a clear call-to-action button',
    'Add an unsubscribe link to comply with regulations',
    'Use personalization variables for better engagement',
  ],
  campaignTiming: [
    'Send emails on weekdays (Tue-Thu) for best results',
    'Avoid sending during holidays or unusual times',
    'Test different send times to find your audience\'s preferences',
    'Consider time zones if you have a distributed audience',
  ],
  deliverability: [
    'Use a business email address as sender',
    'Verify your sender identity domain',
    'Keep bounce rates low by cleaning your list regularly',
    'Monitor your reputation score in the reports',
  ],
};
