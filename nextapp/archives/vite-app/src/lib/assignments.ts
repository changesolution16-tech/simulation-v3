import { supabase } from './supabase';

export interface TrainingAssignment {
  id: string;
  title: string;
  description?: string;
  created_by?: string;

  simulation_id?: string;
  category_id?: string;
  topic_id?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  scenario_ids?: string[];

  assignment_type: 'individual' | 'cohort' | 'mixed';
  cohort_ids: string[];
  individual_learner_ids: string[];

  assigned_at: string;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  available_from?: string;
  available_until?: string;
  max_attempts: number;
  passing_score: number;

  is_published: boolean;
  send_notifications: boolean;
  reminder_days_before: number;

  is_graded: boolean;
  weight: number;

  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;

  simulation?: {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    difficulty: string;
    estimated_duration_minutes: number;
  };
}

export interface AssignmentLearner {
  id: string;
  assignment_id: string;
  learner_id: string;

  status: 'assigned' | 'in_progress' | 'completed' | 'overdue' | 'exempt';
  started_at?: string;
  completed_at?: string;
  submitted_at?: string;

  attempt_count: number;
  best_score?: number;
  latest_score?: number;
  time_spent_seconds: number;

  teacher_feedback?: string;
  teacher_score_override?: number;
  graded_by?: string;
  graded_at?: string;

  current_instance_id?: string;

  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;

  assignment?: TrainingAssignment;
  profile?: {
    full_name: string;
    email: string;
  };
}

export class AssignmentService {
  static async createAssignment(assignmentData: Partial<TrainingAssignment>): Promise<TrainingAssignment | null> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      throw new Error('Database connection not available');
    }

    try {
      console.log('Creating assignment with data:', {
        title: assignmentData.title,
        created_by: assignmentData.created_by,
        simulation_id: assignmentData.simulation_id,
        assignment_type: assignmentData.assignment_type
      });

      const { data, error } = await supabase
        .from('training_assignments')
        .insert({
          title: assignmentData.title,
          description: assignmentData.description,
          created_by: assignmentData.created_by,
          simulation_id: assignmentData.simulation_id,
          category_id: assignmentData.category_id,
          topic_id: assignmentData.topic_id,
          difficulty: assignmentData.difficulty,
          scenario_ids: assignmentData.scenario_ids || null,
          assignment_type: assignmentData.assignment_type || 'individual',
          cohort_ids: assignmentData.cohort_ids || [],
          individual_learner_ids: assignmentData.individual_learner_ids || [],
          start_date: assignmentData.start_date || new Date().toISOString(),
          end_date: assignmentData.end_date,
          due_date: assignmentData.due_date,
          available_from: assignmentData.available_from || new Date().toISOString(),
          available_until: assignmentData.available_until,
          max_attempts: assignmentData.max_attempts || 1,
          passing_score: assignmentData.passing_score || 70,
          is_published: assignmentData.is_published ?? true,
          send_notifications: assignmentData.send_notifications ?? true,
          reminder_days_before: assignmentData.reminder_days_before || 3,
          is_graded: assignmentData.is_graded ?? true,
          weight: assignmentData.weight || 100,
          metadata: assignmentData.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        if (error.code === '42501') {
          throw new Error('Permission denied. Please ensure you have instructor or admin privileges.');
        } else if (error.code === '23505') {
          throw new Error('An assignment with similar details already exists.');
        } else if (error.code === '23503') {
          throw new Error('Invalid reference: The selected simulation, category, or user does not exist.');
        } else if (error.code === '23514') {
          throw new Error('Validation failed: Please ensure all required fields are filled correctly.');
        } else {
          throw new Error(`Failed to create assignment: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('Assignment created but no data returned');
      }

      console.log('Assignment created successfully:', data.id);

      try {
        await this.createAssignmentLearners(data.id, data);
        console.log('Assignment learners created successfully');
      } catch (learnerError) {
        console.error('Error creating assignment learners:', learnerError);
        throw new Error('Assignment created but failed to assign learners. Please edit the assignment to add learners.');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Unexpected error creating assignment:', error);
      throw new Error('An unexpected error occurred while creating the assignment');
    }
  }

  private static async createAssignmentLearners(assignmentId: string, assignment: TrainingAssignment): Promise<void> {
    if (!supabase) {
      throw new Error('Database connection not available');
    }

    try {
      const learnerIds = new Set<string>();

      if (assignment.assignment_type === 'individual' || assignment.assignment_type === 'mixed') {
        assignment.individual_learner_ids.forEach(id => learnerIds.add(id));
        console.log(`[Assignment Creation] Added ${assignment.individual_learner_ids.length} individual learners`);
      }

      if (assignment.assignment_type === 'cohort' || assignment.assignment_type === 'mixed') {
        console.log(`[Assignment Creation] Processing ${assignment.cohort_ids.length} cohorts`);

        for (const cohortId of assignment.cohort_ids) {
          console.log(`[Assignment Creation] Querying members for cohort ${cohortId}`);

          const { data: members, error } = await supabase
            .from('cohort_members')
            .select('learner_id')
            .eq('cohort_id', cohortId)
            .eq('is_active', true);

          if (error) {
            console.error(`[Assignment Creation] Error fetching members for cohort ${cohortId}:`, {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            });
            throw new Error(`Failed to fetch cohort members: ${error.message}`);
          }

          console.log(`[Assignment Creation] Query result for cohort ${cohortId}:`, {
            memberCount: members?.length || 0,
            members: members
          });

          if (members && members.length > 0) {
            members.forEach(m => {
              if (m.learner_id) {
                learnerIds.add(m.learner_id);
              } else {
                console.warn(`[Assignment Creation] Member record missing learner_id:`, m);
              }
            });
            console.log(`[Assignment Creation] Added ${members.length} learners from cohort ${cohortId}`);
          } else {
            console.warn(`[Assignment Creation] No active members found in cohort ${cohortId}`);
          }
        }
      }

      const assignmentLearners = Array.from(learnerIds).map(learnerId => ({
        assignment_id: assignmentId,
        learner_id: learnerId,
        status: 'assigned' as const
      }));

      console.log(`[Assignment Creation] Creating ${assignmentLearners.length} assignment learner records`);
      console.log('[Assignment Creation] Sample learner records:', assignmentLearners.slice(0, 3));

      if (assignmentLearners.length === 0) {
        const errorMessage = assignment.assignment_type === 'cohort'
          ? 'No learners found in the selected cohorts. Please ensure the cohorts have active members before creating the assignment.'
          : 'No learners to assign. Please select at least one learner or cohort with active members.';
        console.error(`[Assignment Creation] ${errorMessage}`);
        console.error('[Assignment Creation] Assignment details:', {
          type: assignment.assignment_type,
          cohort_ids: assignment.cohort_ids,
          individual_learner_ids: assignment.individual_learner_ids
        });
        throw new Error(errorMessage);
      }

      const { data: insertedLearners, error } = await supabase
        .from('assignment_learners')
        .insert(assignmentLearners)
        .select();

      if (error) {
        console.error('[Assignment Creation] Error creating assignment learners:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          learnerCount: assignmentLearners.length
        });

        if (error.code === '42501') {
          throw new Error('Permission denied when creating assignment learners. Please check RLS policies.');
        } else if (error.code === '23503') {
          throw new Error('Invalid learner reference. One or more learner IDs do not exist.');
        } else if (error.code === '23505') {
          throw new Error('Duplicate assignment learner detected. Some learners may already be assigned.');
        }

        throw new Error(`Failed to create assignment learners: ${error.message}`);
      }

      console.log(`[Assignment Creation] Successfully created ${insertedLearners?.length || assignmentLearners.length} assignment learner records`);

      const verifyQuery = await supabase
        .from('assignment_learners')
        .select('id', { count: 'exact', head: true })
        .eq('assignment_id', assignmentId);

      console.log('[Assignment Creation] Verification: Assignment learners in database:', verifyQuery.count);

      if (verifyQuery.count === 0) {
        console.error('[Assignment Creation] WARNING: No learners found after insert. This may indicate an RLS policy issue.');
      }
    } catch (error) {
      console.error('[Assignment Creation] Error in createAssignmentLearners:', error);
      throw error;
    }
  }

  static async getAssignment(assignmentId: string): Promise<TrainingAssignment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('training_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (error) {
      console.error('Error fetching assignment:', error);
      return null;
    }

    return data;
  }

  static async getTeacherAssignments(teacherId: string): Promise<TrainingAssignment[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('training_assignments')
      .select('*')
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teacher assignments:', error);
      return [];
    }

    return data;
  }

  static async getLearnerAssignments(learnerId: string): Promise<AssignmentLearner[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('assignment_learners')
      .select(`
        *,
        training_assignments(
          *,
          simulations(
            id,
            name,
            display_name,
            description,
            difficulty,
            estimated_duration_minutes,
            landing_image_url,
            landing_image_alt
          )
        ),
        profiles!assignment_learners_learner_id_fkey(full_name, email)
      `)
      .eq('learner_id', learnerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching learner assignments:', error);
      return [];
    }

    return data.map((item: any) => ({
      ...item,
      assignment: {
        ...item.training_assignments,
        simulation: item.training_assignments?.simulations
      },
      profile: item.profiles || { full_name: 'Unknown', email: 'N/A' }
    }));
  }

  static async getAssignmentLearners(assignmentId: string): Promise<AssignmentLearner[]> {
    if (!supabase) {
      console.error('[Assignment Learners] Supabase client not available');
      return [];
    }

    console.log(`[Assignment Learners] Fetching learners for assignment: ${assignmentId}`);

    // Use explicit relationship name to avoid ambiguity
    // assignment_learners has two foreign keys to profiles (learner_id and graded_by)
    const { data, error } = await supabase
      .from('assignment_learners')
      .select(`
        *,
        profiles!assignment_learners_learner_id_fkey(full_name, email)
      `)
      .eq('assignment_id', assignmentId);

    if (error) {
      console.error('[Assignment Learners] Error fetching assignment learners:', {
        assignmentId,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    if (!data || data.length === 0) {
      console.warn(`[Assignment Learners] No learners found for assignment: ${assignmentId}`);
      console.log('[Assignment Learners] This could mean:');
      console.log('  1. No cohort members were found when creating the assignment');
      console.log('  2. RLS policies are blocking the query');
      console.log('  3. Assignment was created without selecting cohorts/learners');
      return [];
    }

    console.log(`[Assignment Learners] Found ${data.length} learners for assignment: ${assignmentId}`);

    const learners = data.map((item: any) => ({
      ...item,
      profile: item.profiles || { full_name: 'Unknown', email: 'N/A' }
    }));

    console.log('[Assignment Learners] Sample learner:', learners[0]);

    return learners;
  }

  static async updateAssignmentStatus(
    assignmentId: string,
    learnerId: string,
    updates: Partial<AssignmentLearner>
  ): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('assignment_learners')
      .update(updates)
      .eq('assignment_id', assignmentId)
      .eq('learner_id', learnerId);

    if (error) {
      console.error('Error updating assignment status:', error);
      return false;
    }

    return true;
  }

  static async startAssignment(assignmentId: string, learnerId: string, instanceId?: string): Promise<boolean> {
    const updateData: Partial<AssignmentLearner> = {
      status: 'in_progress',
      started_at: new Date().toISOString()
    };

    // Link the instance ID if provided
    if (instanceId) {
      updateData.current_instance_id = instanceId;
      console.log(`[AssignmentService] Linking instance ${instanceId} to assignment ${assignmentId}`);
    }

    return this.updateAssignmentStatus(assignmentId, learnerId, updateData);
  }

  static async completeAssignment(
    assignmentId: string,
    learnerId: string,
    score: number,
    instanceId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    const { data: current } = await supabase
      .from('assignment_learners')
      .select('attempt_count, best_score')
      .eq('assignment_id', assignmentId)
      .eq('learner_id', learnerId)
      .single();

    const attemptCount = (current?.attempt_count || 0) + 1;
    const bestScore = Math.max(current?.best_score || 0, score);

    return this.updateAssignmentStatus(assignmentId, learnerId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      attempt_count: attemptCount,
      best_score: bestScore,
      latest_score: score,
      current_instance_id: instanceId
    });
  }

  static async updateAssignment(assignmentId: string, updates: Partial<TrainingAssignment>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('training_assignments')
      .update(updates)
      .eq('id', assignmentId);

    if (error) {
      console.error('Error updating assignment:', error);
      return false;
    }

    return true;
  }

  static async deleteAssignment(assignmentId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('training_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting assignment:', error);
      return false;
    }

    return true;
  }

  static async addTeacherFeedback(
    assignmentId: string,
    learnerId: string,
    feedback: string,
    scoreOverride?: number
  ): Promise<boolean> {
    if (!supabase) return false;

    const updates: any = {
      teacher_feedback: feedback,
      graded_at: new Date().toISOString()
    };

    if (scoreOverride !== undefined) {
      updates.teacher_score_override = scoreOverride;
    }

    const { error } = await supabase
      .from('assignment_learners')
      .update(updates)
      .eq('assignment_id', assignmentId)
      .eq('learner_id', learnerId);

    if (error) {
      console.error('Error adding teacher feedback:', error);
      return false;
    }

    return true;
  }

  static async getCategories(): Promise<any[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('simulation_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  }

  static async getPublishedSimulationsByCategory(categoryId: string): Promise<any[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('simulations')
      .select('id, name, display_name, description, difficulty, estimated_duration_minutes')
      .eq('category_id', categoryId)
      .eq('status', 'published')
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching simulations:', error);
      return [];
    }

    return data || [];
  }

  static async getActiveCohorts(): Promise<any[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('cohorts')
      .select(`
        id,
        name,
        description,
        institution
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching cohorts:', error);
      return [];
    }

    if (!data) return [];

    const cohortsWithCounts = await Promise.all(
      data.map(async (cohort) => {
        const { count, error: countError } = await supabase
          .from('cohort_members')
          .select('*', { count: 'exact', head: true })
          .eq('cohort_id', cohort.id)
          .eq('is_active', true);

        if (countError) {
          console.error(`Error counting members for cohort ${cohort.id}:`, countError);
        }

        return {
          ...cohort,
          member_count: count || 0
        };
      })
    );

    return cohortsWithCounts;
  }

  static async searchLearners(query: string): Promise<any[]> {
    if (!supabase) return [];

    const searchTerm = `%${query.toLowerCase()}%`;

    // Note: In the database, students are stored with role 'learner'
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, institution')
      .eq('role', 'learner')
      .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(20);

    if (error) {
      console.error('Error searching learners:', error);
      return [];
    }

    return data || [];
  }

  static async diagnoseAssignment(assignmentId: string): Promise<any> {
    if (!supabase) return null;

    console.log(`[Assignment Diagnostics] Running diagnostics for assignment: ${assignmentId}`);

    const assignment = await supabase
      .from('training_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    console.log('[Assignment Diagnostics] Assignment data:', assignment.data);

    if (assignment.data?.cohort_ids && assignment.data.cohort_ids.length > 0) {
      console.log('[Assignment Diagnostics] Checking cohorts:', assignment.data.cohort_ids);

      for (const cohortId of assignment.data.cohort_ids) {
        const cohort = await supabase
          .from('cohorts')
          .select('id, name, is_active')
          .eq('id', cohortId)
          .single();

        console.log(`[Assignment Diagnostics] Cohort ${cohortId}:`, cohort.data);

        const members = await supabase
          .from('cohort_members')
          .select('learner_id, is_active')
          .eq('cohort_id', cohortId)
          .eq('is_active', true);

        console.log(`[Assignment Diagnostics] Cohort ${cohortId} members:`, members.data?.length || 0);
      }
    }

    const assignmentLearners = await supabase
      .from('assignment_learners')
      .select('*')
      .eq('assignment_id', assignmentId);

    console.log('[Assignment Diagnostics] Assignment learners in DB:', assignmentLearners.data?.length || 0);

    return {
      assignment: assignment.data,
      assignmentLearners: assignmentLearners.data,
      assignmentError: assignment.error,
      learnersError: assignmentLearners.error
    };
  }

  static async getSimulationDetails(simulationId: string): Promise<any> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('simulations')
      .select('id, name, display_name, description, difficulty')
      .eq('id', simulationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching simulation details:', error);
      return null;
    }

    return data;
  }

  static async getCategoryDetails(categoryId: string): Promise<any> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('simulation_categories')
      .select('id, name, description')
      .eq('id', categoryId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching category details:', error);
      return null;
    }

    return data;
  }

  static async getCohortDetails(cohortIds: string[]): Promise<any[]> {
    if (!supabase || cohortIds.length === 0) return [];

    const { data, error } = await supabase
      .from('cohorts')
      .select('id, name, description, institution')
      .in('id', cohortIds);

    if (error) {
      console.error('Error fetching cohort details:', error);
      return [];
    }

    const cohortsWithCounts = await Promise.all(
      (data || []).map(async (cohort) => {
        const { count, error: countError } = await supabase
          .from('cohort_members')
          .select('*', { count: 'exact', head: true })
          .eq('cohort_id', cohort.id)
          .eq('is_active', true);

        if (countError) {
          console.error(`Error counting members for cohort ${cohort.id}:`, countError);
        }

        return {
          ...cohort,
          member_count: count || 0
        };
      })
    );

    return cohortsWithCounts;
  }
}
