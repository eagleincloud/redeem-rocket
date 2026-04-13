# 📚 Redeem Rocket Database Documentation

**Complete Database ER Diagram & Schema Documentation**
**Generated:** April 7, 2026

---

## 📖 Documentation Files

### 1. **DATABASE_ER_DIAGRAM.md** ⭐ START HERE
**Complete Entity-Relationship Diagram with Detailed Descriptions**

- 🔄 Full Mermaid ER diagram showing all 34+ tables
- 📋 Detailed entity descriptions for every table
- 🔗 Complete relationship mapping
- 📊 Module-specific diagrams (Business, Customer, Admin apps)
- 📈 Data flow diagrams for key processes
- 🔐 Security & compliance guidelines
- ⚡ Performance optimization tips

**Best for:** Understanding the complete database architecture

---

### 2. **TABLE_SPECIFICATIONS.md** 📋 DETAILED REFERENCE
**Complete Table Definitions with Column Specifications**

- 📑 All 43 tables with full column definitions
- 🔑 Primary keys, foreign keys, and constraints
- ✅ Unique constraints and indexes
- 📊 Data types and defaults
- 🎯 Table purpose and usage
- 💾 Examples of stored data

**Best for:** Developers implementing features

---

### 3. **DATABASE_SCHEMA_SUMMARY.md** 🎯 QUICK REFERENCE
**Quick lookup guide and table statistics**

- 📊 Database statistics overview
- 📂 Tables organized by category
- 🔄 Relationship matrix
- 📈 Query patterns by app
- 🔐 Security model
- 🚀 Scaling considerations
- ✅ Feature checklist

**Best for:** Quick lookups and planning

---

## 🗂️ Database Organization

### Authentication Layer (8 tables)
- `app_users` - Customer accounts
- `biz_users` - Business accounts
- `admin_users` - Platform admins
- `otp_verifications` - Passwordless login
- `email_verification_tokens` - Email verification
- `password_reset_tokens` - Password recovery
- `fcm_tokens` - Push notifications
- `user_profiles` - User metadata

### Business Management (5 tables)
- `businesses` - Business profiles
- `business_roles` - Custom roles
- `business_role_permissions` - RBAC matrix
- `business_team_members` - Team members
- `member_notification_prefs` - Notification settings

### Products & Orders (5 tables)
- `products` - Product catalog
- `offers` - Time-limited offers
- `offer_products` - Products in offers
- `orders` - Customer orders
- `order_items` - Order line items

### Auctions (2 tables)
- `auctions` - Auction listings
- `auction_bids` - User bids

### Requirements (3 tables)
- `customer_requirements` - RFQ requests
- `requirements_kanban` - Status tracking
- `requirements_quotes` - Seller quotes

### Leads & CRM (7 tables)
- `leads` - Lead database
- `lead_activities` - Interactions
- `lead_follow_ups` - Follow-up scheduling
- `lead_entities` - Grouping
- `lead_groups` - Collections
- `lead_group_members` - Group membership
- `lead_match_links` - Deduplication

### Outreach (6 tables)
- `lead_templates` - Message templates
- `sender_identities` - Sender profiles
- `outreach_campaigns` - Campaigns
- `outreach_recipients` - Recipients
- `outreach_batches` - Batch scheduling
- `outreach_unsubscribes` - Opt-out list

### Marketing (2 tables)
- `campaigns` - Marketing campaigns
- `campaign_contacts` - Campaign recipients

### Payments (1 table)
- `payment_submissions` - Customer payments

### Notifications (2 tables)
- `in_app_notifications` - Notification types
- `notification_logs` - Notification history

### Data Enrichment (2 tables)
- `scraped_businesses` - Scraped data
- `onboarding_outreach_log` - Tracking

---

## 🔍 How to Use These Documents

### For New Developers
1. Read **DATABASE_ER_DIAGRAM.md** - Understand the big picture
2. Check **TABLE_SPECIFICATIONS.md** - See exact column definitions
3. Refer to **DATABASE_SCHEMA_SUMMARY.md** - Quick lookups

### For Database Administrators
1. Check **TABLE_SPECIFICATIONS.md** - All column details
2. Review **DATABASE_SCHEMA_SUMMARY.md** - Query patterns & scaling
3. Reference **DATABASE_ER_DIAGRAM.md** - Relationships & data flow

### For Feature Implementation
1. Find the relevant table in **TABLE_SPECIFICATIONS.md**
2. Check relationships in **DATABASE_ER_DIAGRAM.md**
3. Use **DATABASE_SCHEMA_SUMMARY.md** for query patterns

---

## 📊 Key Statistics

| Metric | Value |
|--------|-------|
| Total Tables | 43 |
| Total Foreign Keys | 45+ |
| Total Indexes | 35+ |
| Unique Constraints | 20+ |
| Storage Buckets | 3 |
| Applications | 3 (Business, Customer, Admin) |

---

## 🔗 Key Relationships at a Glance

### Multi-Tenant Isolation
```
businesses (central hub)
├── employees → biz_users
├── data → leads, products, offers, auctions
├── team → business_team_members
├── outreach → outreach_campaigns
└── payments → payment_submissions
```

### Customer Journey
```
app_users
├── orders → order_items → products
├── auctions → auction_bids
├── requirements → requirements_quotes
└── payments → payment_submissions
```

### Lead Management
```
leads
├── activities → lead_activities
├── follow-ups → lead_follow_ups
├── grouping → lead_entities → lead_groups
└── outreach → outreach_recipients
```

---

## 📈 Database Growth Expectations

| Table | Growth Rate | Volume |
|-------|------------|--------|
| leads | High (import + manual) | 100K+ per business/year |
| lead_activities | High (log every interaction) | 1M+/year |
| orders | Medium | 10K+/business/year |
| outreach_recipients | High (campaigns) | 100K+/year |
| notification_logs | Very High | 1M+/year |

---

## 🔐 Security Features

- ✅ Row-Level Security (RLS) on all tables
- ✅ Data isolation by business_id
- ✅ Encrypted fields for sensitive data
- ✅ Audit trail with timestamps
- ✅ OTP verification for login
- ✅ Email verification for registration
- ✅ Password reset tokens with TTL
- ✅ Unsubscribe list for compliance

---

## ⚡ Performance Optimization

### Indexes
- Business-scoped queries (business_id)
- Pipeline stage filtering (stage)
- Status tracking (status)
- User lookups (email, phone)
- Timestamp ranges (created_at)

### Pagination
- Lead lists (load 20 at a time)
- Outreach results (load 50 at a time)
- Orders history (load 25 at a time)

### Caching
- Business profiles (5 min TTL)
- Role permissions (10 min TTL)
- Lead counts (1 min TTL)

---

## 🚀 Migration Path

Migrations are in: `supabase/migrations/`

**Order of execution:**
1. `20240001_paynow_schema.sql` - Payments
2. `20240002_notifications_schema.sql` - Notifications
3. `20240003_otp_auth_schema.sql` - Auth
4. `20240007_leads_schema.sql` - Leads
5. `20240008_outreach_schema.sql` - Outreach
6. ... and so on

All migrations are idempotent (safe to re-run).

---

## 🛠️ Maintenance

### Cleanup Queries
```sql
-- Remove expired OTPs (weekly)
DELETE FROM otp_verifications 
WHERE expires_at < NOW() - INTERVAL '7 days';

-- Remove expired tokens (weekly)
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW() - INTERVAL '7 days';

-- Archive old leads (monthly)
INSERT INTO leads_archive 
SELECT * FROM leads WHERE created_at < NOW() - INTERVAL '1 year';
DELETE FROM leads WHERE created_at < NOW() - INTERVAL '1 year';
```

---

## 📞 Common Support Queries

### Find Customer's Activity
```sql
SELECT * FROM orders WHERE customer_id = $1 
ORDER BY created_at DESC;

SELECT * FROM payment_submissions WHERE user_id = $1 
ORDER BY created_at DESC;
```

### Find Business's Performance
```sql
SELECT COUNT(*) as leads, SUM(deal_value) as pipeline_value
FROM leads WHERE business_id = $1;

SELECT COUNT(*) as orders, SUM(total_amount) as revenue
FROM orders WHERE business_id = $1;
```

### List Team Members
```sql
SELECT tm.*, br.name as role_name
FROM business_team_members tm
LEFT JOIN business_roles br ON tm.role_id = br.id
WHERE tm.business_id = $1 AND tm.status = 'active';
```

---

## 📱 Applications Using This Database

### 1. Business App
Features: Leads, CRM, Outreach, Products, Orders, Team, Analytics

### 2. Customer App
Features: Orders, Auctions, Requirements, Wallet, Notifications

### 3. Admin App
Features: User Management, Analytics, Moderation

---

## 📝 Notes

- All tables use UUID primary keys
- All tables have `created_at` timestamp
- Foreign keys cascade on delete (except specific cases)
- RLS policies are permissive (auth via localStorage)
- Realtime enabled for key tables

---

## 🔗 Related Files

- **Migrations:** `supabase/migrations/`
- **API Types:** `src/app/types.ts`
- **Auth Service:** `src/app/lib/authService.ts`
- **Data Functions:** `src/app/api/supabase-data.ts`

---

**Last Updated:** April 7, 2026
**Database Version:** 1.0
**Maintained by:** Development Team

