-- Data Consistency Verification Queries

-- Check for leads without valid business_id
SELECT 'orphaned_leads' as check_name, COUNT(*) as issue_count
FROM leads WHERE business_id IS NULL;

-- Check for invalid email formats
SELECT 'invalid_emails' as check_name, COUNT(*) as issue_count
FROM leads
WHERE email IS NOT NULL AND (email NOT LIKE '%@%' OR email LIKE '% %');

-- Check for deals with negative value
SELECT 'negative_deal_values' as check_name, COUNT(*) as issue_count
FROM deals WHERE deal_value < 0;

-- Check database record counts
SELECT 'total_leads' as metric_name, COUNT(*) as count FROM leads
UNION ALL
SELECT 'total_deals', COUNT(*) FROM deals
UNION ALL
SELECT 'total_pipelines', COUNT(*) FROM pipelines
UNION ALL
SELECT 'total_automation_rules', COUNT(*) FROM automation_rules;
