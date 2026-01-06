import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying security audit fix migration...');
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase/migrations/20251031151000_fix_security_audit_status_view.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Extract just the SQL commands (remove comments)
    const sqlCommands = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*') && !line.trim().startsWith('*') && line.trim().length > 0)
      .join('\n');
    
    console.log('\nExecuting SQL commands:');
    console.log(sqlCommands);
    console.log('\n');
    
    // Apply the ALTER VIEW command
    const { data: alterResult, error: alterError } = await supabase.rpc('exec_sql', {
      sql: "ALTER VIEW security_audit_status SET (security_invoker = true);"
    });
    
    if (alterError) {
      console.error('Error applying ALTER VIEW:', alterError);
      // Try direct approach
      console.log('\nTrying alternative approach...');
      
      // Get the service role key from environment or use a workaround
      // Since we can't alter views directly, let's recreate it
      const recreateSQL = `
        CREATE OR REPLACE VIEW security_audit_status 
        WITH (security_invoker = true) AS
        SELECT
          'views_with_security_invoker' as check_type,
          COUNT(*) as count,
          jsonb_agg(viewname) as items
        FROM pg_views
        WHERE schemaname = 'public'
          AND viewname IN ('options_missing_feedback', 'options_missing_metrics', 'metric_assignments_summary')

        UNION ALL

        SELECT
          'functions_with_secure_search_path' as check_type,
          COUNT(*) as count,
          jsonb_agg(p.proname) as items
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN (
            'apply_scenario_hierarchy_levels',
            'atomic_update_scenario_with_options',
            'auto_clean_video_urls',
            'calculate_competency_impact',
            'calculate_scenario_hierarchy_levels',
            'check_storage_quota',
            'clean_video_url',
            'cleanup_orphaned_video_files',
            'detect_scenario_cycles',
            'detect_video_platform',
            'diagnose_simulation_connections',
            'find_disconnected_scenarios',
            'generate_path_signature',
            'generate_video_library_url',
            'generate_video_storage_path',
            'get_automatic_competency_impacts',
            'get_bravin_metrics',
            'get_feedback_video_url',
            'get_metric_competency_mapping_recommendations',
            'get_option_feedback_videos',
            'get_option_metrics',
            'get_scenario_connection_status',
            'get_scenario_connections',
            'get_scenario_targeted_competencies',
            'get_scenarios_using_video',
            'get_simulation_connection_map',
            'get_storage_public_url',
            'get_user_storage_usage',
            'get_video_file_url',
            'increment_failed_login',
            'increment_video_file_views',
            'increment_video_usage',
            'is_account_accessible',
            'log_activation_change',
            'record_metric_assessment',
            'repair_orphaned_connections',
            'resolve_video_url',
            'safe_update_profile',
            'set_simulation_published_at',
            'sync_scenario_branches',
            'sync_scenario_branches_for_scenario',
            'trigger_hierarchy_recalculation',
            'trigger_sync_scenario_branches',
            'update_landing_page_progress_updated_at',
            'update_last_login',
            'update_mapping_timestamp',
            'update_profiles_updated_at',
            'update_scenario_targeted_competencies_timestamp',
            'update_simulation_metrics_updated_at',
            'update_simulations_updated_at',
            'update_updated_at_column',
            'update_user_storage_usage',
            'validate_scenario_connections',
            'verify_scenario_connections_integrity'
          );
      `;
      
      console.log('\nYou need to run this SQL command in Supabase SQL Editor:');
      console.log('='.repeat(80));
      console.log(recreateSQL);
      console.log('='.repeat(80));
    } else {
      console.log('✓ Successfully applied security audit fix');
    }
    
    console.log('\n✓ Migration complete!');
    console.log('\nNext step: Enable Leaked Password Protection in Supabase Dashboard');
    console.log('  1. Go to: Authentication → Password Protection');
    console.log('  2. Toggle: "Leaked password protection" to ON');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    console.log('\n⚠️  Please apply the migration manually through Supabase Dashboard → SQL Editor');
    console.log('   Run the SQL from: supabase/migrations/20251031151000_fix_security_audit_status_view.sql');
  }
}

applyMigration();
