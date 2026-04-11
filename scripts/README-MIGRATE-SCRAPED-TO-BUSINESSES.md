# Migrate MySQL scraped_businesses → Supabase `businesses`

Migrates the **scraped_businesses** table from MySQL (RedeemRocket on RDS) to Supabase as table **businesses** with the **same schema** (column names and types).

## Source

- **Host:** hrms-db.comb9vkzwyzp.us-east-1.rds.amazonaws.com  
- **Database:** RedeemRocket  
- **Table:** scraped_businesses  

## Steps

### 1. Create the table in Supabase

In the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**, run the contents of:

```
scripts/supabase-businesses-from-scraped.sql
```

This creates `public.businesses` with the same columns as MySQL (id, merchant_key, place_id, name, category, subcategory, address, area, city, pincode, phone, mobile, email, website, **latitude**, **longitude**, rating, review_count, price_level, opening_hours, business_status, types, description, amenities, verification_status, claimed_by_merchant_id, verified_by_admin_id, verified_at, created_at, updated_at).

**Note:** The script drops the existing `public.businesses` table if it exists (e.g. the unified-schema businesses table). Back up any existing data there if needed.

### 2. Run the data migration

Set in `.env` (or export):

- `SUPABASE_URL` – Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY` – service role key (recommended for migration)  
- Optional: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` (default: RedeemRocket)

Then run:

```bash
npm run migrate:scraped-to-businesses
```

Or:

```bash
node scripts/migrate-scraped-to-supabase-businesses.js
```

The script reads all rows from MySQL `scraped_businesses` and inserts them into Supabase `public.businesses` in batches of 200.

## Result

- Table in Supabase: **public.businesses**  
- Same schema as MySQL (including **latitude** / **longitude**).  
- If your app expects **lat** / **lng**, add a view or use `latitude`/`longitude` in queries.
