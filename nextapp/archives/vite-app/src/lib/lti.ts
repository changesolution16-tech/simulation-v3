import { supabase } from './supabase';
import { verifyLTIToken, JWTVerificationError, sanitizeInput, validateEmail } from './jwtVerification';

export interface LTILaunchData {
  iss: string;
  aud: string;
  sub: string;
  deployment_id: string;
  target_link_uri: string;
  resource_link?: {
    id: string;
    title?: string;
    description?: string;
  };
  context?: {
    id: string;
    label?: string;
    title?: string;
    type?: string[];
  };
  roles?: string[];
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  [key: string]: any;
}

export interface LTIDeployment {
  id: string;
  platform_name: string;
  issuer: string;
  client_id: string;
  deployment_id: string;
  auth_login_url: string;
  auth_token_url: string;
  jwks_url: string;
  public_key?: string;
  is_active: boolean;
}

export class LTIService {

  static async validateLTILaunch(idToken: string): Promise<LTILaunchData | null> {
    try {
      if (!idToken || typeof idToken !== 'string') {
        console.error('[LTI] Invalid token format');
        return null;
      }

      const parts = idToken.split('.');
      if (parts.length !== 3) {
        console.error('[LTI] Malformed JWT token');
        return null;
      }

      let issuer: string;
      try {
        const unverifiedPayload = JSON.parse(atob(parts[1]));
        issuer = unverifiedPayload.iss;
      } catch (e) {
        console.error('[LTI] Failed to decode token payload');
        return null;
      }

      if (!issuer) {
        console.error('[LTI] Missing issuer in token');
        return null;
      }

      const payload = await verifyLTIToken(idToken, issuer);

      return payload as LTILaunchData;
    } catch (error) {
      if (error instanceof JWTVerificationError) {
        console.error('[LTI] Token verification failed:', error.message);
      } else {
        console.error('[LTI] Error validating LTI launch:', error);
      }
      return null;
    }
  }

  static async getOrCreateUserFromLTI(launchData: LTILaunchData): Promise<string | null> {
    try {
      const { data: deployment } = await supabase
        .from('lti_deployments')
        .select('id')
        .eq('issuer', launchData.iss)
        .eq('deployment_id', launchData.deployment_id)
        .maybeSingle();

      if (!deployment) {
        console.error('Deployment not found');
        return null;
      }

      const { data: existingMapping } = await supabase
        .from('lti_user_mappings')
        .select('profile_id')
        .eq('deployment_id', deployment.id)
        .eq('lti_user_id', launchData.sub)
        .maybeSingle();

      if (existingMapping) {
        await supabase
          .from('lti_user_mappings')
          .update({ last_launch: new Date().toISOString() })
          .eq('deployment_id', deployment.id)
          .eq('lti_user_id', launchData.sub);

        return existingMapping.profile_id;
      }

      const role = this.determineMoodleRole(launchData.roles || []);
      const rawEmail = launchData.email || `${sanitizeInput(launchData.sub, 100)}@lti.local`;
      const email = validateEmail(rawEmail) ? rawEmail : `${sanitizeInput(launchData.sub, 100)}@lti.local`;

      const fullName = sanitizeInput(
        launchData.name || `${launchData.given_name || ''} ${launchData.family_name || ''}`.trim() || 'LTI User',
        200
      );

      const securePassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password: securePassword,
        options: {
          data: {
            full_name: fullName,
            role,
            lti_user: true
          }
        }
      });

      if (authError || !authUser.user) {
        console.error('Error creating auth user:', authError);
        return null;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email,
          full_name: fullName,
          role,
          metadata: { lti_user: true }
        })
        .select()
        .single();

      await supabase
        .from('lti_user_mappings')
        .insert({
          deployment_id: deployment.id,
          lti_user_id: sanitizeInput(launchData.sub, 255),
          profile_id: authUser.user.id,
          roles: launchData.roles || [],
          given_name: sanitizeInput(launchData.given_name || '', 100),
          family_name: sanitizeInput(launchData.family_name || '', 100),
          email: launchData.email ? sanitizeInput(launchData.email, 254) : null
        });

      return authUser.user.id;
    } catch (error) {
      console.error('Error creating user from LTI:', error);
      return null;
    }
  }

  static async syncLTIContext(launchData: LTILaunchData): Promise<string | null> {
    if (!launchData.context) return null;

    try {
      const { data: deployment } = await supabase
        .from('lti_deployments')
        .select('id')
        .eq('issuer', launchData.iss)
        .eq('deployment_id', launchData.deployment_id)
        .maybeSingle();

      if (!deployment) return null;

      const { data: context, error } = await supabase
        .from('lti_contexts')
        .upsert({
          deployment_id: deployment.id,
          context_id: launchData.context.id,
          context_label: launchData.context.label,
          context_title: launchData.context.title,
          context_type: launchData.context.type?.[0] || 'CourseSection'
        }, {
          onConflict: 'deployment_id,context_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      return context?.id || null;
    } catch (error) {
      console.error('Error syncing LTI context:', error);
      return null;
    }
  }

  static async syncResourceLink(launchData: LTILaunchData, contextId: string): Promise<string | null> {
    if (!launchData.resource_link) return null;

    try {
      const { data: resourceLink } = await supabase
        .from('lti_resource_links')
        .upsert({
          context_id: contextId,
          resource_link_id: launchData.resource_link.id,
          resource_link_title: launchData.resource_link.title,
          resource_link_description: launchData.resource_link.description,
          custom_parameters: launchData.custom || {}
        }, {
          onConflict: 'context_id,resource_link_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      return resourceLink?.id || null;
    } catch (error) {
      console.error('Error syncing resource link:', error);
      return null;
    }
  }

  static async submitGrade(
    resourceLinkId: string,
    learnerId: string,
    attemptId: string,
    score: number,
    maxScore: number = 100
  ): Promise<boolean> {
    try {
      const { data: resourceLink } = await supabase
        .from('lti_resource_links')
        .select('*, lti_contexts!inner(*, lti_deployments!inner(*))')
        .eq('id', resourceLinkId)
        .maybeSingle();

      if (!resourceLink) {
        console.error('Resource link not found');
        return false;
      }

      const { data: userMapping } = await supabase
        .from('lti_user_mappings')
        .select('lti_user_id')
        .eq('profile_id', learnerId)
        .maybeSingle();

      if (!userMapping) {
        console.error('User mapping not found');
        return false;
      }

      const gradeData = {
        scoreGiven: score,
        scoreMaximum: maxScore,
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
        userId: userMapping.lti_user_id,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('grade_submissions')
        .insert({
          resource_link_id: resourceLinkId,
          learner_id: learnerId,
          attempt_id: attemptId,
          score_given: score,
          score_maximum: maxScore,
          activity_progress: 'Completed',
          grading_progress: 'FullyGraded',
          lti_response: gradeData,
          success: true
        });

      return true;
    } catch (error) {
      console.error('Error submitting grade:', error);

      await supabase
        .from('grade_submissions')
        .insert({
          resource_link_id: resourceLinkId,
          learner_id: learnerId,
          attempt_id: attemptId,
          score_given: score,
          score_maximum: maxScore,
          activity_progress: 'Completed',
          grading_progress: 'Failed',
          success: false
        });

      return false;
    }
  }

  private static determineMoodleRole(roles: string[]): 'learner' | 'instructor' | 'admin' {
    const roleString = roles.join(',').toLowerCase();

    if (roleString.includes('administrator') || roleString.includes('admin')) {
      return 'admin';
    }
    if (roleString.includes('instructor') || roleString.includes('teacher') || roleString.includes('faculty')) {
      return 'instructor';
    }
    return 'learner';
  }

  static generateLTIConfigJSON(baseUrl: string) {
    return {
      title: 'Soft Skills Leadership Simulation',
      description: 'Interactive branching scenario simulations for leadership and soft skills development',
      oidc_initiation_url: `${baseUrl}/lti/login`,
      target_link_uri: `${baseUrl}/lti/launch`,
      scopes: [
        'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
        'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
        'https://purl.imsglobal.org/spec/lti-ags/scope/score',
        'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly'
      ],
      extensions: [
        {
          domain: baseUrl,
          tool_id: 'soft_skills_simulation',
          platform: 'moodle',
          settings: {
            text: 'Soft Skills Simulation',
            icon_url: `${baseUrl}/icon.png`,
            selection_width: 800,
            selection_height: 600
          }
        }
      ],
      public_jwk_url: `${baseUrl}/lti/jwks`,
      custom_fields: {
        context_id: '$CourseSection.sourcedId',
        context_label: '$CourseSection.label',
        context_title: '$CourseSection.title',
        user_id: '$User.id',
        user_email: '$Person.email.primary',
        user_name: '$Person.name.full',
        resource_link_id: '$ResourceLink.id',
        resource_link_title: '$ResourceLink.title'
      }
    };
  }
}
