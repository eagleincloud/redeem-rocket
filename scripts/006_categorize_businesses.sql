-- ============================================================
-- 006_categorize_businesses.sql
-- Auto-categorize businesses based on keyword patterns in
-- name, subcategory, and existing category columns.
-- Run AFTER 005_business_categories.sql.
-- ============================================================

-- ── Helper: update business_type WHERE name/subcategory matches keywords ──────

-- RESTAURANT / FOOD
UPDATE businesses SET business_type = 'restaurant'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(restaurant|dhaba|kitchen|dining|biryani|thali|pizza|burger|cafe|bakery|sweet|mithai|halwai|juice|tea\s*stall|chai|snack|fast\s*food|tiffin|canteen|caterer|hotel\s*food|dine|eatery|bhojnalaya|veg\s*food|non[\s-]?veg)'
  OR LOWER(subcategory) ~* '(restaurant|food|dining|cafe)'
  OR LOWER(category)    ~* '(restaurant|food\s*&?\s*beverage|cafe)'
);

-- GROCERY / GENERAL STORE
UPDATE businesses SET business_type = 'grocery'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(grocery|general\s*store|kirana|mart|supermarket|provision|ration|departmental|daily\s*need|convenience)'
  OR LOWER(subcategory) ~* '(grocery|kirana|general store)'
  OR LOWER(category)    ~* '(grocery|supermarket)'
);

-- PHARMACY / MEDICAL / CLINIC / HOSPITAL
UPDATE businesses SET business_type = 'pharmacy'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(pharma|medical|medicine|chemist|drug\s*store|hospital|clinic|nursing|dispensary|pathology|diagnostic|health\s*care|lab|ayurved|homeo)'
  OR LOWER(subcategory) ~* '(medical|pharmacy|health)'
  OR LOWER(category)    ~* '(health|medical|pharma)'
);

-- SALON / BEAUTY / SPA
UPDATE businesses SET business_type = 'salon'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(salon|parlour|parlor|beauty|hair|spa|nail|cosmetic|barber|makeup|mehendi|waxing|threading)'
  OR LOWER(subcategory) ~* '(salon|beauty|spa)'
  OR LOWER(category)    ~* '(beauty|salon|health\s*&?\s*beauty)'
);

-- HOTEL / LODGING
UPDATE businesses SET business_type = 'hotel'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(hotel|lodge|inn|guest\s*house|hostel|resort|motel|bhavan|nivas|palace|mansion|stay|accommodation)'
  OR LOWER(subcategory) ~* '(hotel|lodge|accommodation)'
  OR LOWER(category)    ~* '(hotel|accommodation|lodging)'
);

-- ATM / BANK / FINANCE
UPDATE businesses SET business_type = 'atm'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(atm|bank|sbi|hdfc|icici|axis\s*bank|kotak|pnb|union\s*bank|canara|finance|loan|insurance|nbfc|credit|mutual\s*fund|investment)'
  OR LOWER(subcategory) ~* '(bank|finance|atm)'
  OR LOWER(category)    ~* '(bank|finance|atm)'
);

-- ELECTRONICS / MOBILE / COMPUTER
UPDATE businesses SET business_type = 'electronics'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(electronic|mobile|phone|computer|laptop|service\s*center|repair\s*shop|tv|led|appliance|digital\s*world|technology|tech|gadget|xerox|printing|internet\s*caf)'
  OR LOWER(subcategory) ~* '(electronic|mobile|computer)'
  OR LOWER(category)    ~* '(electronic|tech)'
);

-- CLOTHING / FASHION / TEXTILE
UPDATE businesses SET business_type = 'clothing'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(cloth|garment|fashion|dress|saree|shirt|pant|boutique|tailor|readymade|textile|fabric|emporium|collection|ethnic|silk|kurta|lehenga|dupatta)'
  OR LOWER(subcategory) ~* '(cloth|fashion|garment|textile)'
  OR LOWER(category)    ~* '(fashion|clothing|apparel)'
);

-- PETROL / FUEL STATION
UPDATE businesses SET business_type = 'petrol'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(petrol|fuel|petroleum|pump|cng|filling\s*station|gas\s*station|indane|hp\s*petrol|bharat\s*petrol|indian\s*oil)'
  OR LOWER(subcategory) ~* '(petrol|fuel|gas station)'
);

-- HARDWARE / BUILDING MATERIAL
UPDATE businesses SET business_type = 'hardware'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(hardware|tools|plumbing|electrical\s*shop|sanitary|iron|paint\s*shop|cement|tiles|building\s*material|pipes|fittings)'
  OR LOWER(subcategory) ~* '(hardware|building material)'
);

-- GYM / FITNESS / YOGA
UPDATE businesses SET business_type = 'gym'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(gym|fitness\s*center|yoga|aerobic|workout|sports\s*club|crossfit|zumba|health\s*club|weight\s*loss)'
  OR LOWER(subcategory) ~* '(gym|fitness|yoga)'
);

-- AUTO / GARAGE / VEHICLE SERVICE
UPDATE businesses SET business_type = 'auto'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(garage|workshop|auto\s*repair|car\s*service|bike\s*service|tyre|mechanic|spare\s*parts|motor|vehicle|car\s*wash|puncture|denting|painting\s*garage)'
  OR LOWER(subcategory) ~* '(garage|auto|vehicle service)'
);

-- EDUCATION / COACHING / SCHOOL
UPDATE businesses SET business_type = 'education'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(school|college|tuition|coaching|institute|academy|classes|library|education|training\s*center|skill|certification|tutorial)'
  OR LOWER(subcategory) ~* '(school|education|coaching)'
);

-- JEWELLERY / GOLD / SILVER
UPDATE businesses SET business_type = 'jewellery'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(jewel|jewellery|jewelry|gold|silver|diamond|ornament|bullion|sona|chandi)'
  OR LOWER(subcategory) ~* '(jewellery|gold|silver)'
);

-- OPTICAL / EYEWEAR
UPDATE businesses SET business_type = 'optical'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(optical|optics|eye\s*care|specs|spectacle|contact\s*lens|vision)'
  OR LOWER(subcategory) ~* '(optical|eyewear)'
);

-- TRAVEL / TOURS / TRANSPORT
UPDATE businesses SET business_type = 'travel'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(travel|tours?|agent|ticket|booking|bus|railway|cab|taxi|holiday|trip|transport)'
  OR LOWER(subcategory) ~* '(travel|transport|tour)'
);

-- FURNITURE / HOME DECOR
UPDATE businesses SET business_type = 'furniture'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(furniture|interior|decor|sofa|bed|cupboard|modular\s*kitchen|home\s*furnish|curtain|mattress)'
  OR LOWER(subcategory) ~* '(furniture|home decor|interior)'
);

-- STATIONERY / BOOKS / PRINTING
UPDATE businesses SET business_type = 'stationery'
WHERE business_type IS NULL AND (
  LOWER(name)        ~* '(stationery|book\s*store|books|copy|pen\s*shop|paper|printing\s*press|screen\s*print|flex\s*print|digital\s*print)'
  OR LOWER(subcategory) ~* '(stationery|books|printing)'
);

-- Fallback: anything still null → 'other'
UPDATE businesses
SET    business_type = 'other'
WHERE  business_type IS NULL;

-- ── Back-fill category_id based on updated business_type ──────────────────────
UPDATE businesses b
SET    category_id = bc.id
FROM   business_categories bc
WHERE  b.business_type = bc.type_key
  AND  b.category_id IS NULL;

-- ── Summary report ────────────────────────────────────────────────────────────
SELECT
  business_type,
  COUNT(*) AS count
FROM businesses
GROUP BY business_type
ORDER BY count DESC;
