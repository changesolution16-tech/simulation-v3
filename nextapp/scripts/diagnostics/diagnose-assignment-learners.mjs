#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ASSIGNMENT_ID = 'a01d2126-4af3-4b7f-a715-a567156db01c';
const INSTRUCTOR_EMAIL = 'teacher@example.edu';

async function diagnose() {
  console.log('='.repeat(60));
  console.log('ASSIGNMENT LEARNERS DIAGNOSTIC');
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Sign in as instructor
  console.log('Step 1: Signing in as instructor...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: INSTRUCTOR_EMAIL,
    password: 'teacher123'
  });

  if (authError) {
    console.error('❌ Failed to sign in:', authError.message);
    return;
  }

  console.log('✅ Signed in as:', authData.user.email);
  console.log('   User ID:', authData.user.id);
  console.log('');

  // Step 2: Get instructor profile
  console.log('Step 2: Fetching instructor profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Failed to fetch profile:', profileError.message);
    return;
  }

  console.log('✅ Profile role:', profile.role);
  console.log('');

  // Step 3: Get assignment
  console.log('Step 3: Fetching assignment...');
  const { data: assignment, error: assignmentError } = await supabase
    .from('training_assignments')
    .select('*')
    .eq('id', ASSIGNMENT_ID)
    .single();

  if (assignmentError) {
    console.error('❌ Failed to fetch assignment:', assignmentError.message);
    console.error('   Error code:', assignmentError.code);
    console.error('   Error details:', assignmentError.details);
    return;
  }

  console.log('✅ Assignment found:', assignment.title);
  console.log('   Created by:', assignment.created_by);
  console.log('   Cohort IDs:', assignment.cohort_ids);
  console.log('   Assignment type:', assignment.assignment_type);
  console.log('   Published:', assignment.is_published);
  console.log('');

  // Step 4: Check cohort members
  if (assignment.cohort_ids && assignment.cohort_ids.length > 0) {
    console.log('Step 4: Checking cohort members...');
    for (const cohortId of assignment.cohort_ids) {
      const { data: cohort, error: cohortError } = await supabase
        .from('cohorts')
        .select('id, name, is_active')
        .eq('id', cohortId)
        .single();

      if (cohortError) {
        console.error(`❌ Failed to fetch cohort ${cohortId}:`, cohortError.message);
        continue;
      }

      console.log(`   Cohort: ${cohort.name} (${cohort.is_active ? 'active' : 'inactive'})`);

      const { data: members, error: membersError } = await supabase
        .from('cohort_members')
        .select('learner_id, is_active, profiles(email, full_name, role)')
        .eq('cohort_id', cohortId);

      if (membersError) {
        console.error(`   ❌ Failed to fetch members:`, membersError.message);
        console.error('      Error code:', membersError.code);
        console.error('      Error details:', membersError.details);
      } else {
        console.log(`   ✅ Found ${members.length} members in cohort`);
        members.forEach((m, i) => {
          console.log(`      ${i + 1}. ${m.profiles?.full_name || 'Unknown'} (${m.profiles?.email || 'N/A'}) - Active: ${m.is_active}`);
        });
      }
    }
    console.log('');
  }

  // Step 5: Get assignment learners (the main query from the frontend)
  console.log('Step 5: Fetching assignment learners (frontend query)...');
  const { data: assignmentLearners, error: learnersError } = await supabase
    .from('assignment_learners')
    .select(`
      *,
      profiles!assignment_learners_learner_id_fkey(full_name, email)
    `)
    .eq('assignment_id', ASSIGNMENT_ID);

  if (learnersError) {
    console.error('❌ Failed to fetch assignment learners:', learnersError.message);
    console.error('   Error code:', learnersError.code);
    console.error('   Error details:', learnersError.details);
    console.error('   Error hint:', learnersError.hint);
    console.log('');
    console.log('🔍 This is likely an RLS policy issue!');
    console.log('   The policy requires the user to be an admin or instructor.');
    console.log('   Current user role:', profile.role);
  } else if (!assignmentLearners || assignmentLearners.length === 0) {
    console.error('❌ No assignment learners found');
    console.log('');
    console.log('🔍 Possible reasons:');
    console.log('   1. RLS policy is blocking the query');
    console.log('   2. No learners were created when assignment was made');
    console.log('   3. Learners were deleted');
  } else {
    console.log(`✅ Found ${assignmentLearners.length} assignment learners`);
    assignmentLearners.forEach((learner, i) => {
      console.log(`   ${i + 1}. ${learner.profiles?.full_name || 'Unknown'} (${learner.profiles?.email || 'N/A'})`);
      console.log(`      Status: ${learner.status}`);
      console.log(`      Learner ID: ${learner.learner_id}`);
    });
  }
  console.log('');

  // Step 6: Direct count query without RLS interference
  console.log('Step 6: Checking assignment_learners table directly...');
  const { count, error: countError } = await supabase
    .from('assignment_learners')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', ASSIGNMENT_ID);

  if (countError) {
    console.error('❌ Failed to count:', countError.message);
  } else {
    console.log(`✅ Total assignment_learners records: ${count}`);
    if (count !== assignmentLearners?.length) {
      console.log(`⚠️  WARNING: RLS is filtering results!`);
      console.log(`   Records in DB: ${count}`);
      console.log(`   Records visible: ${assignmentLearners?.length || 0}`);
    }
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('DIAGNOSIS COMPLETE');
  console.log('='.repeat(60));

  await supabase.auth.signOut();
}

diagnose().catch(console.error);
