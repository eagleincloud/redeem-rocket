# Customer-Facing App - Redeem Rocket

A customer-facing application built with Figma design frontend and Supabase backend integration.

## Overview

This is a separate customer-facing application that:
- Uses the complete Figma design UI components and pages
- Integrates with the existing Supabase backend (shared auth and database)
- Runs independently from the business admin app (`/src`)
- Can be deployed separately to a different domain or subdomain

## Features

✅ User authentication (Supabase)
✅ Multi-step onboarding flow
✅ Business/customer dashboard
✅ Modern Figma design system
✅ Responsive mobile-first design
✅ Dark mode support
✅ Component library (60+ shadcn UI components)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase project (use existing one from main app)

### 1. Install Dependencies

```bash
cd customer-app
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Start Development Server

```bash
npm run dev
```

App will run at: http://localhost:5173

### 4. Test It

- Navigate to http://localhost:5173
- Sign in or create account
- Explore onboarding and dashboard

## Project Structure

```
customer-app/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   ├── components/          # Figma design pages
│   │   ├── ui/                  # shadcn UI (60+ components)
│   │   └── utils/
│   ├── lib/
│   │   ├── supabase-client.ts
│   │   └── supabase-service.ts
│   ├── hooks/
│   │   └── useSupabase.ts
│   └── styles/
├── package.json
├── vite.config.ts
└── index.html
```

## Building for Production

```bash
npm run build
# Creates dist/ folder ready for deployment
```

## Deployment

### Vercel
```bash
vercel
```

### Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variables in dashboard

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- React Router v7
- Tailwind CSS v4
- shadcn/ui (60+ components)
- Supabase (Auth + Database)
- Recharts (data visualization)

## Troubleshooting

**"Missing Supabase environment variables"**
- Check `.env.local` exists with correct credentials

**"Failed to sign in"**
- Verify user exists in Supabase `auth.users`
- Check credentials in `.env.local`

For more details, see the main repository documentation.
