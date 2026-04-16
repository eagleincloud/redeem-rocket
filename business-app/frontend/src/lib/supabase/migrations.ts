/**
 * Migration verification and database health check utilities
 * Used to validate that all migrations are properly applied
 */

import { supabase } from './client'

export interface MigrationStatus {
  applied: boolean
  tables: TableStatus[]
  rlsPolicies: RLSPolicyStatus[]
  indexes: IndexStatus[]
  errors: string[]
}

export interface TableStatus {
  name: string
  exists: boolean
  columns: string[]
}

export interface RLSPolicyStatus {
  table: string
  policy: string
  enabled: boolean
}

export interface IndexStatus {
  name: string
  table: string
  exists: boolean
}

/**
 * Check if the Feature Marketplace migration has been applied
 */
export async function checkFeatureMarketplaceMigration(): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    applied: true,
    tables: [],
    rlsPolicies: [],
    indexes: [],
    errors: [],
  }

  // Expected tables from migration
  const expectedTables = [
    'features',
    'business_owner_features',
    'feature_categories',
    'feature_templates',
    'feature_requests',
  ]

  // Check each table exists
  for (const tableName of expectedTables) {
    const tableStatus = await checkTableExists(tableName)
    status.tables.push(tableStatus)
    if (!tableStatus.exists) {
      status.applied = false
      status.errors.push(`Table '${tableName}' does not exist`)
    }
  }

  // Check RLS policies are enabled
  const rlsChecks = [
    { table: 'features', policy: 'View active features' },
    { table: 'business_owner_features', policy: 'Manage own features' },
    { table: 'feature_requests', policy: 'Submit feature requests' },
    { table: 'feature_requests', policy: 'View own feature requests' },
  ]

  for (const check of rlsChecks) {
    const policyStatus = await checkRLSPolicy(check.table, check.policy)
    status.rlsPolicies.push(policyStatus)
    if (!policyStatus.enabled) {
      status.errors.push(`RLS policy '${check.policy}' on table '${check.table}' is not enabled`)
    }
  }

  // Check indexes exist
  const expectedIndexes = [
    { table: 'features', name: 'idx_features_category' },
    { table: 'features', name: 'idx_features_status' },
    { table: 'business_owner_features', name: 'idx_business_owner_features_business' },
    { table: 'business_owner_features', name: 'idx_business_owner_features_feature' },
    { table: 'feature_requests', name: 'idx_feature_requests_business' },
    { table: 'feature_requests', name: 'idx_feature_requests_status' },
    { table: 'feature_templates', name: 'idx_templates_business_type' },
  ]

  for (const index of expectedIndexes) {
    const indexStatus = await checkIndexExists(index.name, index.table)
    status.indexes.push(indexStatus)
    if (!indexStatus.exists) {
      status.errors.push(`Index '${index.name}' on table '${index.table}' does not exist`)
    }
  }

  return status
}

/**
 * Check if a table exists and return its columns
 */
async function checkTableExists(tableName: string): Promise<TableStatus> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0)

    if (error) {
      return {
        name: tableName,
        exists: false,
        columns: [],
      }
    }

    // Get column information using RPC or information_schema
    const { data: columns, error: columnError } = await supabase.rpc(
      'get_table_columns',
      { table_name: tableName }
    )

    return {
      name: tableName,
      exists: true,
      columns: columnError ? [] : columns?.map((c: any) => c.column_name) || [],
    }
  } catch (error) {
    return {
      name: tableName,
      exists: false,
      columns: [],
    }
  }
}

/**
 * Check if RLS is enabled on a table
 */
async function checkRLSPolicy(tableName: string, policyName: string): Promise<RLSPolicyStatus> {
  try {
    const { data, error } = await supabase.rpc('check_rls_policy', {
      table_name: tableName,
      policy_name: policyName,
    })

    return {
      table: tableName,
      policy: policyName,
      enabled: !error && data === true,
    }
  } catch (error) {
    return {
      table: tableName,
      policy: policyName,
      enabled: false,
    }
  }
}

/**
 * Check if an index exists
 */
async function checkIndexExists(indexName: string, tableName: string): Promise<IndexStatus> {
  try {
    const { data, error } = await supabase.rpc('check_index_exists', {
      index_name: indexName,
    })

    return {
      name: indexName,
      table: tableName,
      exists: !error && data === true,
    }
  } catch (error) {
    return {
      name: indexName,
      table: tableName,
      exists: false,
    }
  }
}

/**
 * Verify table structure matches expected schema
 */
export async function verifyTableStructure(tableName: string, expectedColumns: string[]): Promise<boolean> {
  try {
    const { data: columns, error } = await supabase.rpc('get_table_columns', {
      table_name: tableName,
    })

    if (error) return false

    const actualColumns = new Set((columns as any[]).map((c) => c.column_name))
    const expectedSet = new Set(expectedColumns)

    // Check all expected columns exist
    for (const col of expectedSet) {
      if (!actualColumns.has(col)) {
        return false
      }
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Run database health check on app startup
 */
export async function runDatabaseHealthCheck(): Promise<{
  healthy: boolean
  migration: MigrationStatus
  timestamp: string
}> {
  const migration = await checkFeatureMarketplaceMigration()

  return {
    healthy: migration.errors.length === 0,
    migration,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Log migration status for debugging
 */
export function logMigrationStatus(status: MigrationStatus): void {
  console.log('=== Feature Marketplace Migration Status ===')
  console.log(`Applied: ${status.applied}`)
  console.log(`Tables: ${status.tables.filter((t) => t.exists).length}/${status.tables.length}`)
  console.log(`RLS Policies: ${status.rlsPolicies.filter((p) => p.enabled).length}/${status.rlsPolicies.length}`)
  console.log(`Indexes: ${status.indexes.filter((i) => i.exists).length}/${status.indexes.length}`)

  if (status.errors.length > 0) {
    console.error('Errors found:')
    status.errors.forEach((err) => console.error(`  - ${err}`))
  }
}
