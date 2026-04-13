# 📖 Complete Database Guide - All Tables with Schema & Explanations

**Generated:** April 7, 2026
**Total Tables:** 43
**Documentation Type:** Complete Schema Reference with SQL & Explanations

---

## 📚 Guide Structure

This document provides **complete schema definitions** for all 43 database tables organized by functional area:

### Contents:
1. **Authentication & Users** (8 tables)
2. **Business Management** (5 tables)  
3. **Products & Orders** (5 tables)
4. **Auctions** (2 tables)
5. **Requirements & RFQ** (3 tables)
6. **Leads & CRM** (7 tables)
7. **Outreach Campaigns** (6 tables)
8. **Marketing** (2 tables)
9. **Payments** (1 table)
10. **Notifications** (2 tables)
11. **Data Enrichment** (2 tables)

---

## How to Use This Guide

### For Each Table You'll Find:

1. **Purpose** - What the table does
2. **SQL Schema** - Complete CREATE TABLE statement with indexes and RLS
3. **Column Explanations** - Detailed description of every column
4. **Relationships** - Foreign keys and references
5. **Example Data** - Sample JSON records
6. **Use Cases** - Real-world scenarios
7. **Key Queries** - Common SQL patterns

### Quick Navigation

**Need to understand a table?**
1. Find the table name in the section below
2. Read the "Purpose" section
3. Check "SQL Schema" for exact definition
4. Read "Column Explanations" table for each field
5. See "Example Data" for what records look like
6. Use "Key Queries" for common operations

---

# 🔐 AUTHENTICATION & USERS (8 Tables)

## 1. app_users

**Purpose:** Store customer application user accounts

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  email text UNIQUE,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);
CREATE INDEX idx_app_users_phone ON app_users (phone);
CREATE INDEX idx_app_users_email ON app_users (email);
```

**Columns:**

| Column | Type | Key Info |
|--------|------|----------|
| id | uuid | PRIMARY KEY - Auto-generated unique ID |
| phone | text | UNIQUE - Customer phone (E.164 format) |
| email | text | UNIQUE - Customer email |
| name | text | Customer's full name |
| avatar_url | text | Profile picture URL in Supabase Storage |
| created_at | timestamptz | Account creation timestamp (immutable) |
| last_login | timestamptz | Last login activity timestamp |

**Relationships:**
- One app_user → Many orders
- One app_user → Many auction_bids
- One app_user → Many payment_submissions
- One app_user → Many customer_requirements
- One app_user → Many notification_logs

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "+919876543210",
  "email": "customer@example.com",
  "name": "Rajesh Kumar",
  "avatar_url": "https://storage.../avatar.jpg",
  "created_at": "2026-01-15T10:30:00Z",
  "last_login": "2026-04-07T14:22:00Z"
}
```

**Key Queries:**
```sql
-- Find customer by phone
SELECT * FROM app_users WHERE phone = '+919876543210';

-- Get active customers (last 30 days)
SELECT * FROM app_users WHERE last_login > NOW() - INTERVAL '30 days';

-- Create new customer
INSERT INTO app_users (phone, email, name) VALUES ($1, $2, $3) RETURNING *;

-- Update last login
UPDATE app_users SET last_login = NOW() WHERE id = $1;
```

---

## 2. biz_users

**Purpose:** Store business owners and employees

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS biz_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  email text UNIQUE,
  name text,
  business_id text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);
CREATE INDEX idx_biz_users_business_id ON biz_users (business_id);
```

**Columns:**

| Column | Type | Key Info |
|--------|------|----------|
| id | uuid | PRIMARY KEY |
| phone | text | UNIQUE phone number |
| email | text | UNIQUE email address |
| name | text | User's full name |
| business_id | text | FK to businesses.id |
| created_at | timestamptz | Account creation |
| last_login | timestamptz | Last activity |

---

## 3. admin_users

**Purpose:** Store platform administrators

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin','moderator','support')),
  created_at timestamptz DEFAULT now()
);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | PRIMARY KEY |
| email | text | UNIQUE - corporate email |
| name | text | Admin's full name |
| role | text | 'super_admin', 'moderator', or 'support' |
| created_at | timestamptz | Creation timestamp |

---

## 4. otp_verifications

**Purpose:** Store OTP attempts for passwordless login

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact text NOT NULL,
  contact_type text NOT NULL CHECK (contact_type IN ('phone','email')),
  otp_hash text NOT NULL,
  expires_at timestamptz DEFAULT now() + interval '10 minutes',
  attempts int DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_otp_contact ON otp_verifications (contact, contact_type);
```

**Columns:**

| Column | Type | Key Info |
|--------|------|----------|
| id | uuid | PRIMARY KEY |
| contact | text | Phone or email |
| contact_type | text | 'phone' or 'email' |
| otp_hash | text | SHA-256 hash of OTP |
| expires_at | timestamptz | 10 min expiry |
| attempts | int | Failed attempt counter (max 3) |
| verified | boolean | Whether verified |
| created_at | timestamptz | Creation time |

**OTP Security:** 6-digit, hashed, max 3 attempts, 10 min TTL

---

## 5. email_verification_tokens

**Purpose:** Manage email verification during registration

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz DEFAULT now() + interval '24 hours',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | PRIMARY KEY |
| email | text | Email to verify |
| token | text | UNIQUE - 36+ char hex |
| expires_at | timestamptz | 24 hour expiry |
| verified | boolean | Verification status |
| created_at | timestamptz | Creation time |

---

## 6. password_reset_tokens

**Purpose:** Secure password reset flow

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz DEFAULT now() + interval '1 hour',
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | PRIMARY KEY |
| email | text | User email |
| token | text | UNIQUE - reset token |
| expires_at | timestamptz | 1 hour TTL |
| used | boolean | One-time use flag |
| created_at | timestamptz | Creation |

---

## 7. fcm_tokens

**Purpose:** Store Firebase Cloud Messaging tokens for push notifications

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('ios','android','web')),
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_fcm_user_device ON fcm_tokens (user_id, device_type);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | PRIMARY KEY |
| user_id | uuid | app_users or biz_users id |
| token | text | FCM token (100+ chars) |
| device_type | text | 'ios', 'android', 'web' |
| created_at | timestamptz | Registration time |

**Multi-Device:** One user can have tokens for multiple devices

---

## 8. user_profiles

**Purpose:** Extended user information and preferences

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id text PRIMARY KEY,
  bio text,
  location text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| user_id | text | PRIMARY KEY - FK to app_users/biz_users |
| bio | text | User biography (max 500 chars) |
| location | text | City/location |
| preferences | jsonb | User settings as JSON |
| created_at | timestamptz | Creation time |

**Preferences JSON:**
```json
{
  "theme": "dark",
  "language": "en",
  "notifications_enabled": true,
  "marketing_emails": false,
  "currency": "INR"
}
```

---

# 🏢 BUSINESS MANAGEMENT (5 Tables)

## 9. businesses

**Purpose:** Central business profile (multi-tenant hub)

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS businesses (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text,
  logo text,
  description text,
  website text,
  phone text,
  email text,
  address text,
  upi_id text,
  cashback_rate numeric(5,2) DEFAULT 5.00,
  created_at timestamptz DEFAULT now()
);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | text | PRIMARY KEY - custom "biz_xxxxx" |
| name | text | Business name |
| category | text | Business category |
| logo | text | Logo URL or emoji |
| description | text | Business description |
| website | text | Website URL |
| phone | text | Business contact phone |
| email | text | Business email |
| address | text | Physical address |
| upi_id | text | UPI for receiving payments |
| cashback_rate | numeric | Cashback % (default 5%) |
| created_at | timestamptz | Registration timestamp |

---

## 10. business_roles

**Purpose:** Define custom team roles

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS business_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | PRIMARY KEY |
| business_id | text | FK to businesses |
| name | text | Role name (e.g., "Sales Manager") |
| description | text | Role description |
| is_default | boolean | Default role flag |
| created_at | timestamptz | Creation time |

---

## 11. business_role_permissions

**Purpose:** Granular permission matrix for roles

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS business_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES business_roles(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('leads','campaigns','products',...)),
  level text NOT NULL CHECK (level IN ('read','readwrite','admin'))
);
CREATE UNIQUE INDEX idx_role_feature ON business_role_permissions (role_id, feature);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | PRIMARY KEY |
| role_id | uuid | FK to business_roles |
| feature | text | Feature name |
| level | text | 'read', 'readwrite', or 'admin' |

**Features:** leads, campaigns, products, orders, invoices, analytics, etc.

---

## 12. business_team_members

**Purpose:** Manage team members and their roles

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS business_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role_id uuid REFERENCES business_roles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  permissions jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','invited')),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_members_email ON business_team_members (business_id, email);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | PRIMARY KEY |
| business_id | text | FK to businesses |
| role_id | uuid | FK to business_roles |
| name | text | Member's name |
| email | text | Work email |
| phone | text | Phone number |
| permissions | jsonb | Override permissions |
| status | text | 'active', 'inactive', 'invited' |
| invited_at | timestamptz | Invitation time |
| joined_at | timestamptz | Join time |
| created_at | timestamptz | Creation time |

---

## 13. member_notification_prefs

**Purpose:** Control notification preferences per team member

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS member_notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES business_team_members(id) ON DELETE CASCADE,
  business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_types text[] DEFAULT ARRAY['lead_stage_changed','lead_follow_up_reminder'],
  channels text[] DEFAULT ARRAY['in_app']
);
```

**Columns:**

| Column | Type | Details |
|--------|------|---------|
| id | uuid | PRIMARY KEY |
| member_id | uuid | FK to business_team_members |
| business_id | text | FK to businesses |
| event_types | text[] | Array of events to notify |
| channels | text[] | Delivery channels (in_app, email, sms, whatsapp) |

---

*[Document continues with Products & Orders, Auctions, Requirements, Leads, Outreach, Marketing, Payments, and Notifications sections...]*

**To continue reading, see:** `DETAILED_SCHEMA_PART2.md` (in progress)

---

# 📊 Quick Reference: All Tables

| # | Table | Purpose | Records |
|---|-------|---------|---------|
| 1 | app_users | Customer accounts | 10K-100K |
| 2 | biz_users | Business owners/employees | 1K-10K |
| 3 | admin_users | Platform admins | 10-100 |
| 4 | otp_verifications | OTP attempts | Daily (auto-cleanup) |
| 5 | email_verification_tokens | Email verification | Daily (auto-cleanup) |
| 6 | password_reset_tokens | Password resets | Daily (auto-cleanup) |
| 7 | fcm_tokens | Push notification tokens | 50K-500K |
| 8 | user_profiles | User metadata | Same as users |
| 9 | businesses | Business profiles | 100-10K |
| 10 | business_roles | Team roles | 500-5K |
| 11 | business_role_permissions | Role permissions | 5K-20K |
| 12 | business_team_members | Team members | 1K-20K |
| 13 | member_notification_prefs | Notification settings | Same as team |

---

**Last Updated:** April 7, 2026
**Total Documentation:** 43 tables across 11 categories

