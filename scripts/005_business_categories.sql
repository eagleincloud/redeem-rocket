-- ============================================================
-- 005_business_categories.sql
-- Master category/type reference table for businesses.
-- Run in Supabase SQL editor.
-- ============================================================

-- 1. Create the master categories table
CREATE TABLE IF NOT EXISTS business_categories (
  id           SERIAL PRIMARY KEY,
  type_key     TEXT UNIQUE NOT NULL,          -- machine key used in app code
  display_name TEXT NOT NULL,                 -- human-readable label
  emoji        TEXT NOT NULL DEFAULT '🏪',   -- UI icon
  color        TEXT NOT NULL DEFAULT '#475569', -- hex color for pins
  keywords     TEXT[] DEFAULT '{}',           -- name-matching keywords for auto-categorisation
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed with all known types (matches CATEGORY_STYLE in Home.tsx)
INSERT INTO business_categories (type_key, display_name, emoji, color, keywords) VALUES
  ('restaurant', 'Restaurant & Dining',    '🍔', '#f97316', ARRAY['restaurant','dhaba','kitchen','dining','hotel','biryani','thali','eat','food','pizza','burger','cafe','bakery','sweets','mithai','halwai','tea','chai','juice']),
  ('grocery',    'Grocery & Supermarket',  '🛒', '#16a34a', ARRAY['grocery','general store','kirana','mart','supermarket','provision','ration','departmental']),
  ('pharmacy',   'Pharmacy & Medical',     '💊', '#2563eb', ARRAY['pharmacy','medical','medicine','chemist','drug','hospital','clinic','health','dispensary','nursing','pathology','diagnostic']),
  ('salon',      'Salon & Beauty',         '💇', '#db2777', ARRAY['salon','parlour','parlor','beauty','hair','spa','nails','cosmetic','barber','makeup']),
  ('hotel',      'Hotel & Lodging',        '🏨', '#7c3aed', ARRAY['hotel','lodge','inn','guest house','hostel','resort','motel','bhavan','nivas','stay']),
  ('atm',        'ATM & Banking',          '🏧', '#ca8a04', ARRAY['atm','bank','sbi','hdfc','icici','axis','kotak','pnb','union bank','canara','finance','loan','insurance','nbfc']),
  ('electronics','Electronics & Tech',     '📱', '#0891b2', ARRAY['electronics','mobile','phone','computer','laptop','service center','repair','tv','led','appliance','digital']),
  ('clothing',   'Clothing & Fashion',     '👗', '#c026d3', ARRAY['cloth','garment','fashion','dress','saree','shirt','pant','boutique','tailor','readymade','textile','fabric']),
  ('petrol',     'Petrol & Fuel Station',  '⛽', '#dc2626', ARRAY['petrol','fuel','petroleum','pump','cng','gas station','filling station']),
  ('hardware',   'Hardware & Tools',       '🔧', '#78716c', ARRAY['hardware','tools','plumbing','electrical','sanitary','iron','paint','cement','tiles','building material']),
  ('gym',        'Gym & Fitness',          '💪', '#16a34a', ARRAY['gym','fitness','yoga','aerobics','workout','sports','crossfit','zumba']),
  ('auto',       'Auto & Garage',          '🚗', '#374151', ARRAY['garage','workshop','auto','car','bike','tyre','mechanic','service','repair','spare parts','motor','vehicle']),
  ('education',  'Education & Coaching',   '📚', '#4f46e5', ARRAY['school','college','tuition','coaching','institute','academy','classes','library','education','training']),
  ('jewellery',  'Jewellery & Accessories','💍', '#b45309', ARRAY['jewel','jewellery','jewelry','gold','silver','diamond','ornament']),
  ('optical',    'Optical & Eyewear',      '👓', '#0e7490', ARRAY['optical','optics','eye','specs','spectacle','contact lens','glass']),
  ('travel',     'Travel & Tours',         '✈️', '#0369a1', ARRAY['travel','tours','tour','agent','ticket','booking','bus','railway','holiday']),
  ('furniture',  'Furniture & Home Decor', '🪑', '#92400e', ARRAY['furniture','interior','decor','sofa','bed','cupboard','modular','home']),
  ('stationery', 'Stationery & Books',     '📒', '#6d28d9', ARRAY['stationery','book','copy','pen','paper','printing','xerox','photocopy']),
  ('other',      'Other',                  '🏪', '#475569', ARRAY[]::TEXT[])
ON CONFLICT (type_key) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      emoji        = EXCLUDED.emoji,
      color        = EXCLUDED.color,
      keywords     = EXCLUDED.keywords;


-- 3. Also discover any unique raw category values already in the businesses table
--    and add them to business_categories (without overwriting existing keys).
INSERT INTO business_categories (type_key, display_name, emoji, color)
SELECT DISTINCT
  LOWER(REGEXP_REPLACE(TRIM(category), '\s+', '_', 'g'))  AS type_key,
  TRIM(category)                                           AS display_name,
  '🏪'                                                     AS emoji,
  '#475569'                                                AS color
FROM businesses
WHERE category IS NOT NULL AND TRIM(category) != ''
ON CONFLICT (type_key) DO NOTHING;

-- 4. Add category_id FK column to businesses (safe — skips if already exists)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS category_id INT REFERENCES business_categories(id);

-- 5. Back-fill category_id from display_name match
UPDATE businesses b
SET    category_id = bc.id
FROM   business_categories bc
WHERE  LOWER(TRIM(b.category)) = LOWER(TRIM(bc.display_name))
  AND  b.category_id IS NULL;

-- 6. Unique categories summary (run to view results)
SELECT
  bc.type_key,
  bc.display_name,
  bc.emoji,
  COUNT(b.id) AS business_count
FROM business_categories bc
LEFT JOIN businesses b ON b.category_id = bc.id
GROUP BY bc.id, bc.type_key, bc.display_name, bc.emoji
ORDER BY business_count DESC;
