import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'student' | 'instructor' | 'admin';
  institution?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  password_last_changed?: string;
  last_login_at?: string;
  account_locked_until?: string;
  failed_login_attempts?: number;
  created_at: string;
  updated_at: string;
}

export class UserService {
  private static mapRoleToDb(role: 'student' | 'instructor' | 'admin'): string {
    return role === 'student' ? 'learner' : role;
  }

  private static mapRoleFromDb(role: string): 'student' | 'instructor' | 'admin' {
    return role === 'learner' ? 'student' : role as 'student' | 'instructor' | 'admin';
  }

  static async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    role: 'student' | 'instructor' | 'admin';
    username?: string;
    institution?: string;
    department?: string;
    position?: string;
  }): Promise<{ user: User | null; error: string | null }> {
    if (!supabase) return { user: null, error: 'Supabase not initialized' };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { user: null, error: 'No active session. Please log in again.' };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;

      console.log('Creating user via edge function:', { email: userData.email, role: userData.role });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          role: userData.role,
          username: userData.username,
          institution: userData.institution,
          department: userData.department,
          position: userData.position
        })
      });

      const result = await response.json();
      console.log('Edge function response:', result);

      if (!result.success) {
        return { user: null, error: result.error || 'Unknown error occurred' };
      }

      return { user: result.user, error: null };
    } catch (error) {
      console.error('Error creating user:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Failed to create user' };
    }
  }

  static async getAllUsers(): Promise<User[]> {
    if (!supabase) {
      console.error('Supabase not initialized');
      return [];
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session when fetching users:', session ? 'Active' : 'None');
      console.log('User ID:', session?.user?.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }

      console.log('Fetched users:', data?.length || 0);

      return data.map(user => ({
        ...user,
        role: this.mapRoleFromDb(user.role)
      }));
    } catch (err) {
      console.error('Exception fetching users:', err);
      return [];
    }
  }

  static async getUsersByRole(role: 'student' | 'instructor' | 'admin'): Promise<User[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', this.mapRoleToDb(role))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }

    return data.map(user => ({
      ...user,
      role: this.mapRoleFromDb(user.role)
    }));
  }

  static async getUser(userId: string): Promise<User | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return {
      ...data,
      role: this.mapRoleFromDb(data.role)
    };
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' };
    }

    try {
      // Verify session before update
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'No active session. Please log in again.' };
      }

      const updateData: any = { ...updates };

      // Map role if provided
      if (updates.role) {
        updateData.role = this.mapRoleToDb(updates.role);
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.created_at;
      delete updateData.id;
      delete updateData.email; // Email cannot be changed via profiles table
      delete updateData.username; // Username cannot be changed
      delete updateData.updated_at; // Will be set by database trigger
      delete updateData.progress; // Progress should be updated separately
      delete updateData.name; // 'name' is frontend-only, use 'full_name'

      // Trim string values
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'string') {
          updateData[key] = updateData[key].trim();
        }
      });

      console.log('[UserService] Updating user profile:', userId);
      console.log('[UserService] Update data:', updateData);

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, full_name, username, role, institution, department, position, is_active, updated_at')
        .single();

      if (error) {
        console.error('[UserService] Error updating user:', error);
        console.error('[UserService] Error code:', error.code);
        console.error('[UserService] Error message:', error.message);
        console.error('[UserService] Error details:', error.details);
        console.error('[UserService] Error hint:', error.hint);

        // Provide user-friendly error messages
        let errorMessage = 'Failed to update user';
        if (error.code === 'PGRST301') {
          errorMessage = 'Permission denied. Insufficient privileges to update this user.';
        } else if (error.code === '23505') {
          errorMessage = 'This value is already in use by another user.';
        } else if (error.code === '42501') {
          errorMessage = 'Database permission error. Please contact an administrator.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        return { success: false, error: errorMessage };
      }

      console.log('[UserService] User profile updated successfully:', data);
      return { success: true, data };
    } catch (err) {
      console.error('[UserService] Exception updating user:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      };
    }
  }

  static async deleteUser(userId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  }

  static async createBulkUsers(users: Array<{
    email: string;
    full_name: string;
    role: 'student' | 'instructor' | 'admin';
    institution?: string;
  }>): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('profiles')
      .insert(users);

    if (error) {
      console.error('Error creating bulk users:', error);
      return false;
    }

    return true;
  }

  static async searchUsers(query: string): Promise<User[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data.map(user => ({
      ...user,
      role: this.mapRoleFromDb(user.role)
    }));
  }
}
