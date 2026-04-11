# MySQL → Supabase PostgreSQL migration

**Unified schema:** Similar tables from both `RedeemRocket` and `redeem_rocket_premium` are merged into one Supabase schema (e.g. one `users`, one `businesses`, one `orders` table) with a `source_db` column so you can tell which MySQL DB each row came from.

---

## 1. Export from MySQL

By default the script exports **Redeem Rocket** databases: `RedeemRocket` and `redeem_rocket_premium`.

From project root:

```bash
npm run export:mysql
```

Or with env vars (optional):

```bash
# Default: RedeemRocket + redeem_rocket_premium
MYSQL_HOST=hrms-db.comb9vkzwyzp.us-east-1.rds.amazonaws.com \
MYSQL_USER=admin \
MYSQL_PASSWORD=your_password \
node scripts/mysql-export-for-supabase.js

# Single database (e.g. employee_conduct)
MYSQL_DATABASE=employee_conduct npm run export:mysql
```

**Output** (in `scripts/mysql-export/<database_name>/` per database):

- **schema.json** – Table and column metadata (MySQL types + suggested PostgreSQL types)
- **schema-postgres.sql** – PostgreSQL `CREATE TABLE` statements (run in Supabase SQL Editor)
- **all-data.json** – All tables’ data in one file
- **&lt;table_name&gt;.data.json** – Per-table data

## 2. Create unified tables in Supabase

1. **Get Supabase credentials**  
   You need these; the repo does **not** include them.  
   - Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **API**.  
   - Copy **Project URL** → use as `SUPABASE_URL`.  
   - Copy **service_role** key (secret) → use as `SUPABASE_SERVICE_ROLE_KEY` for the migration script (bypasses RLS).

2. **Run the unified schema**  
   In Supabase → **SQL Editor**, run the contents of `scripts/supabase-unified-schema.sql`.  
   This creates one set of tables (e.g. `users`, `businesses`, `orders`, `products`, `offers`, `wallet_transactions`, `otps`, etc.) with `source_db` and `source_id` so you can trace rows back to RedeemRocket or redeem_rocket_premium.

## 3. Load data into Supabase

From project root, with env set (e.g. copy `scripts/.env.example` to `.env` and fill in Supabase values):

```bash
node scripts/migrate-to-supabase.js
```

This reads `scripts/mysql-export/RedeemRocket/all-data.json` and `scripts/mysql-export/redeem_rocket_premium/all-data.json`, maps columns to the unified tables, and inserts in batches. Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`) in `.env`.

## 4. Row Level Security (RLS)

After migration, enable RLS on the new tables and add policies per your app roles (Supabase → Authentication → Policies).

## 5. Point the app at Supabase (real data in UI)

The app loads **businesses**, **offers**, **products**, and **wallet_transactions** from Supabase when the Supabase API is configured.

1. In the **project root** `.env`, set:
   - `VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<anon-public-key>`
2. Get the anon key from **Supabase Dashboard** → your project → **Settings** → **API** → “Project API keys” → **anon** (public).
3. Restart the dev server (`npm run dev`). The map, business pages, and wallet will use real data from Supabase; if the keys are missing, the app falls back to mock data.

4. **If businesses/categories don’t load:** In Supabase, **Table Editor** → select `businesses` and `offers` → **RLS** (Row Level Security). If RLS is enabled, add a policy that allows `anon` to `SELECT` (e.g. “Enable read access for all users” or a policy with `true` for `USING`). The app fetches all rows from `businesses` and `offers` (no `is_active` filter) so that lists and categories populate.
