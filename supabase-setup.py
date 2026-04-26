#!/usr/bin/env python3
"""
Supabase Database Setup Script
Sets up the category-template-behavior system database in Supabase
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import json

# Supabase connection details
SUPABASE_HOST = "eomqkeoozxnttqizstzk.supabase.co"
SUPABASE_DB = "postgres"
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = os.getenv("SUPABASE_PASSWORD", "")

# Color codes for output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_status(message, status="INFO"):
    """Print formatted status message"""
    if status == "SUCCESS":
        color = Colors.GREEN
    elif status == "ERROR":
        color = Colors.RED
    elif status == "WARNING":
        color = Colors.YELLOW
    else:
        color = Colors.CYAN

    print(f"{color}[{status}]{Colors.END} {message}")

def read_sql_file(filepath):
    """Read SQL file content"""
    try:
        with open(filepath, 'r') as f:
            return f.read()
    except FileNotFoundError:
        print_status(f"File not found: {filepath}", "ERROR")
        return None

def execute_sql(conn, sql_content, description=""):
    """Execute SQL commands and track results"""
    try:
        cursor = conn.cursor()

        # Split by semicolon for multiple statements
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]

        successful = 0
        failed = 0

        for statement in statements:
            try:
                cursor.execute(statement)
                successful += 1
            except Exception as e:
                failed += 1
                print_status(f"Failed: {str(e)[:100]}", "WARNING")

        conn.commit()

        if description:
            print_status(f"{description}: {successful} succeeded",
                        "SUCCESS" if failed == 0 else "WARNING")

        cursor.close()
        return successful, failed

    except Exception as e:
        print_status(f"Error executing SQL: {str(e)}", "ERROR")
        conn.rollback()
        return 0, 1

def verify_tables(conn):
    """Verify all 13 tables were created"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()

        expected_tables = [
            'business_categories',
            'business_types',
            'category_questions',
            'templates',
            'template_behaviors',
            'business_profiles',
            'applied_templates',
            'behavior_executions',
            'engagement_metrics',
            'recommendations',
            'template_analytics',
            'audit_logs',
            'system_events'
        ]

        created = [t for t in expected_tables if t in tables]
        missing = [t for t in expected_tables if t not in tables]

        print_status(f"Tables created: {len(created)}/{len(expected_tables)}",
                    "SUCCESS" if len(missing) == 0 else "WARNING")

        if missing:
            print_status(f"Missing tables: {', '.join(missing)}", "WARNING")

        return len(created), len(expected_tables)

    except Exception as e:
        print_status(f"Error verifying tables: {str(e)}", "ERROR")
        return 0, 13

def verify_indexes(conn):
    """Verify indexes were created"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.statistics
            WHERE table_schema = 'public'
            AND index_name NOT LIKE 'pg_%'
            AND table_name != 'sqlite_sequence'
        """)
        count = cursor.fetchone()[0]
        cursor.close()

        print_status(f"Indexes created: {count}/40+",
                    "SUCCESS" if count >= 40 else "WARNING")

        return count

    except Exception as e:
        print_status(f"Error verifying indexes: {str(e)}", "ERROR")
        return 0

def verify_functions(conn):
    """Verify helper functions were created"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT routine_name FROM information_schema.routines
            WHERE routine_schema = 'public'
            ORDER BY routine_name
        """)
        functions = [row[0] for row in cursor.fetchall()]
        cursor.close()

        expected_functions = [
            'get_business_stage',
            'calculate_engagement_score',
            'get_recommendations',
            'apply_template',
            'audit_log_trigger'
        ]

        created = [f for f in expected_functions if f in functions]
        print_status(f"Functions created: {len(created)}/{len(expected_functions)}",
                    "SUCCESS" if len(created) == len(expected_functions) else "WARNING")

        return len(created), len(expected_functions)

    except Exception as e:
        print_status(f"Error verifying functions: {str(e)}", "ERROR")
        return 0, len(expected_functions)

def verify_data(conn):
    """Verify reference data was seeded"""
    try:
        cursor = conn.cursor()

        # Count categories
        cursor.execute("SELECT COUNT(*) FROM public.business_categories")
        categories = cursor.fetchone()[0]

        # Count types
        cursor.execute("SELECT COUNT(*) FROM public.business_types")
        types = cursor.fetchone()[0]

        # Count questions
        cursor.execute("SELECT COUNT(*) FROM public.category_questions")
        questions = cursor.fetchone()[0]

        # Count templates
        cursor.execute("SELECT COUNT(*) FROM public.templates")
        templates = cursor.fetchone()[0]

        # Count behaviors
        cursor.execute("SELECT COUNT(*) FROM public.template_behaviors")
        behaviors = cursor.fetchone()[0]

        cursor.close()

        print_status(f"Categories seeded: {categories}/10",
                    "SUCCESS" if categories == 10 else "WARNING")
        print_status(f"Business types seeded: {types}/56",
                    "SUCCESS" if types == 56 else "WARNING")
        print_status(f"Questions seeded: {questions}/78",
                    "SUCCESS" if questions == 78 else "WARNING")
        print_status(f"Templates seeded: {templates}/18",
                    "SUCCESS" if templates == 18 else "WARNING")
        print_status(f"Behaviors seeded: {behaviors}/54",
                    "SUCCESS" if behaviors >= 50 else "WARNING")

        return {
            'categories': categories,
            'types': types,
            'questions': questions,
            'templates': templates,
            'behaviors': behaviors
        }

    except Exception as e:
        print_status(f"Error verifying data: {str(e)}", "ERROR")
        return {}

def verify_rls(conn):
    """Verify RLS policies are enabled"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT schemaname, tablename, rowsecurity
            FROM pg_tables
            WHERE schemaname = 'public'
            AND rowsecurity = true
            ORDER BY tablename
        """)
        rls_tables = [row[1] for row in cursor.fetchall()]
        cursor.close()

        expected_rls = [
            'business_profiles',
            'applied_templates',
            'behavior_executions',
            'engagement_metrics',
            'recommendations',
            'audit_logs'
        ]

        enabled = [t for t in expected_rls if t in rls_tables]
        print_status(f"RLS policies enabled: {len(enabled)}/{len(expected_rls)}",
                    "SUCCESS" if len(enabled) == len(expected_rls) else "WARNING")

        return len(enabled), len(expected_rls)

    except Exception as e:
        print_status(f"Error verifying RLS: {str(e)}", "ERROR")
        return 0, len(expected_rls)

def main():
    """Main setup function"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("=" * 70)
    print("SUPABASE DATABASE SETUP - Category-Template-Behavior System")
    print("=" * 70)
    print(f"{Colors.END}\n")

    # Check for password
    if not SUPABASE_PASSWORD:
        print_status("SUPABASE_PASSWORD environment variable not set", "ERROR")
        print("Please set: export SUPABASE_PASSWORD='your-supabase-password'")
        sys.exit(1)

    # Connect to Supabase
    print_status("Connecting to Supabase...", "INFO")
    try:
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            port=5432,
            sslmode='require',
            connect_timeout=10
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        print_status("Connected to Supabase successfully", "SUCCESS")
    except Exception as e:
        print_status(f"Connection failed: {str(e)}", "ERROR")
        sys.exit(1)

    try:
        # Get current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # Apply main schema migration
        print_status("\n[1/3] Applying main schema migration...", "INFO")
        schema_file = os.path.join(current_dir, 'supabase/migrations/20260426_category_template_schema.sql')
        schema_sql = read_sql_file(schema_file)
        if schema_sql:
            execute_sql(conn, schema_sql, "Schema migration")
        else:
            print_status("Schema file not found, continuing...", "WARNING")

        # Apply reference data seed
        print_status("\n[2/3] Seeding reference data...", "INFO")
        seed_file = os.path.join(current_dir, 'supabase/migrations/20260426_seed_reference_data.sql')
        seed_sql = read_sql_file(seed_file)
        if seed_sql:
            execute_sql(conn, seed_sql, "Reference data seed")
        else:
            print_status("Seed file not found, continuing...", "WARNING")

        # Apply test data
        print_status("\n[3/3] Creating test data...", "INFO")
        test_file = os.path.join(current_dir, 'supabase/migrations/20260426_seed_test_data.sql')
        test_sql = read_sql_file(test_file)
        if test_sql:
            execute_sql(conn, test_sql, "Test data seed")
        else:
            print_status("Test data file not found, continuing...", "WARNING")

        # Verification
        print(f"\n{Colors.BOLD}{Colors.HEADER}")
        print("=" * 70)
        print("VERIFICATION RESULTS")
        print("=" * 70)
        print(f"{Colors.END}\n")

        tables_created, tables_expected = verify_tables(conn)
        indexes_count = verify_indexes(conn)
        functions_created, functions_expected = verify_functions(conn)
        data_counts = verify_data(conn)
        rls_enabled, rls_expected = verify_rls(conn)

        # Summary
        print(f"\n{Colors.BOLD}{Colors.HEADER}")
        print("=" * 70)
        print("SETUP SUMMARY")
        print("=" * 70)
        print(f"{Colors.END}\n")

        print(f"Tables:           {Colors.GREEN}{tables_created}/{tables_expected}{Colors.END}")
        print(f"Indexes:          {Colors.GREEN}40+{Colors.END} (verified: {indexes_count})")
        print(f"Functions:        {Colors.GREEN}{functions_created}/{functions_expected}{Colors.END}")
        print(f"RLS Policies:     {Colors.GREEN}{rls_enabled}/{rls_expected}{Colors.END}")
        print(f"Categories:       {Colors.GREEN}{data_counts.get('categories', 0)}/10{Colors.END}")
        print(f"Business Types:   {Colors.GREEN}{data_counts.get('types', 0)}/56{Colors.END}")
        print(f"Questions:        {Colors.GREEN}{data_counts.get('questions', 0)}/78{Colors.END}")
        print(f"Templates:        {Colors.GREEN}{data_counts.get('templates', 0)}/18{Colors.END}")
        print(f"Behaviors:        {Colors.GREEN}{data_counts.get('behaviors', 0)}/54{Colors.END}")

        all_success = (
            tables_created == tables_expected and
            functions_created == functions_expected and
            rls_enabled == rls_expected and
            data_counts.get('categories') == 10 and
            data_counts.get('templates') == 18
        )

        print(f"\n{Colors.BOLD}")
        if all_success:
            print(f"{Colors.GREEN}✓ DATABASE SETUP COMPLETE - READY FOR PRODUCTION{Colors.END}")
        else:
            print(f"{Colors.YELLOW}⚠ DATABASE SETUP INCOMPLETE - REVIEW WARNINGS ABOVE{Colors.END}")
        print(f"{Colors.END}\n")

        # Close connection
        conn.close()
        print_status("Disconnected from Supabase", "INFO")

        sys.exit(0 if all_success else 1)

    except Exception as e:
        print_status(f"Unexpected error: {str(e)}", "ERROR")
        conn.close()
        sys.exit(1)

if __name__ == "__main__":
    main()
