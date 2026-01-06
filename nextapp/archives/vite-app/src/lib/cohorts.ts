import { supabase } from './supabase';

export interface Cohort {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  institution?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  learner_id: string;
  joined_at: string;
  role: 'member' | 'leader';
  is_active: boolean;
  profile?: {
    full_name: string;
    email: string;
  };
}

export class CohortService {
  static async createCohort(cohortData: Partial<Cohort>): Promise<Cohort | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('cohorts')
      .insert({
        name: cohortData.name,
        description: cohortData.description,
        created_by: cohortData.created_by,
        institution: cohortData.institution,
        start_date: cohortData.start_date,
        end_date: cohortData.end_date,
        metadata: cohortData.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cohort:', error);
      return null;
    }

    return data;
  }

  static async getCohort(cohortId: string): Promise<Cohort | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('cohorts')
      .select(`
        *,
        cohort_members(count)
      `)
      .eq('id', cohortId)
      .single();

    if (error) {
      console.error('Error fetching cohort:', error);
      return null;
    }

    return {
      ...data,
      member_count: data.cohort_members?.[0]?.count || 0
    };
  }

  static async getAllCohorts(): Promise<Cohort[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('cohorts')
      .select(`
        *,
        cohort_members(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all cohorts:', error);
      return [];
    }

    return data.map((cohort: any) => ({
      ...cohort,
      member_count: cohort.cohort_members?.[0]?.count || 0
    }));
  }

  static async getTeacherCohorts(teacherId: string): Promise<Cohort[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('cohorts')
      .select(`
        *,
        cohort_members(count)
      `)
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cohorts:', error);
      return [];
    }

    return data.map((cohort: any) => ({
      ...cohort,
      member_count: cohort.cohort_members?.[0]?.count || 0
    }));
  }

  static async getLearnerCohorts(learnerId: string): Promise<Cohort[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('cohort_members')
      .select(`
        cohort_id,
        cohorts(*)
      `)
      .eq('learner_id', learnerId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching learner cohorts:', error);
      return [];
    }

    return data.map((item: any) => item.cohorts).filter(Boolean);
  }

  static async updateCohort(cohortId: string, updates: Partial<Cohort>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('cohorts')
      .update(updates)
      .eq('id', cohortId);

    if (error) {
      console.error('Error updating cohort:', error);
      return false;
    }

    return true;
  }

  static async deleteCohort(cohortId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('cohorts')
      .delete()
      .eq('id', cohortId);

    if (error) {
      console.error('Error deleting cohort:', error);
      return false;
    }

    return true;
  }

  static async addMember(cohortId: string, learnerId: string, role: 'member' | 'leader' = 'member'): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('cohort_members')
      .insert({
        cohort_id: cohortId,
        learner_id: learnerId,
        role
      });

    if (error) {
      console.error('Error adding cohort member:', error);
      return false;
    }

    return true;
  }

  static async removeMember(cohortId: string, learnerId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('cohort_members')
      .delete()
      .eq('cohort_id', cohortId)
      .eq('learner_id', learnerId);

    if (error) {
      console.error('Error removing cohort member:', error);
      return false;
    }

    return true;
  }

  static async getCohortMembers(cohortId: string): Promise<CohortMember[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('cohort_members')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .eq('cohort_id', cohortId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching cohort members:', error);
      return [];
    }

    return data.map((member: any) => ({
      ...member,
      profile: member.profiles
    }));
  }

  static async addMultipleMembers(cohortId: string, learnerIds: string[]): Promise<boolean> {
    if (!supabase) return false;

    const members = learnerIds.map(learnerId => ({
      cohort_id: cohortId,
      learner_id: learnerId,
      role: 'member' as const
    }));

    const { error } = await supabase
      .from('cohort_members')
      .insert(members);

    if (error) {
      console.error('Error adding multiple cohort members:', error);
      return false;
    }

    return true;
  }
}
