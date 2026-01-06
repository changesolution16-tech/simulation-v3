import { supabase } from './supabase';

export interface BrandingSettings {
  id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  company_name: string;
  login_title: string;
  login_subtitle: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Fetch branding settings from the database
 */
export async function getBrandingSettings(): Promise<BrandingSettings | null> {
  try {
    const { data, error } = await supabase
      .from('branding_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching branding settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching branding settings:', error);
    return null;
  }
}

/**
 * Update branding settings (admin only)
 */
export async function updateBrandingSettings(
  settings: Partial<Omit<BrandingSettings, 'id' | 'updated_at' | 'updated_by'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the first (and should be only) branding settings record
    const { data: existing } = await supabase
      .from('branding_settings')
      .select('id')
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('branding_settings')
        .update({
          ...settings,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating branding settings:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('branding_settings')
        .insert({
          ...settings,
          updated_by: user.id,
        });

      if (error) {
        console.error('Error inserting branding settings:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Exception updating branding settings:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Upload logo to storage
 */
export async function uploadLogo(file: File): Promise<{ url: string | null; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `branding/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('video-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      return { url: null, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('video-files')
      .getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (error) {
    console.error('Exception uploading logo:', error);
    return { url: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Default branding settings for fallback
 */
export const DEFAULT_BRANDING: BrandingSettings = {
  id: '',
  logo_url: null,
  primary_color: '#2563eb',
  secondary_color: '#1e40af',
  company_name: '2025 Softskills Simulations - Change Solutions Limited',
  login_title: 'Soft Skills Simulation',
  login_subtitle: 'Sign in to access your personalized soft skills training',
  updated_at: new Date().toISOString(),
  updated_by: null,
};
