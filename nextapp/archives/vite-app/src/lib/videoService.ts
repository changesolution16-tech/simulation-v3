import { supabase } from './supabase';

export type VideoSource = 'url' | 'embed' | 'upload' | 'library';
export type VideoPlatform = 'synthesia' | 'youtube' | 'vimeo' | 'loom' | 'custom' | 'file';
export type VideoType = 'introduction' | 'prompt' | 'feedback' | 'transition' | 'supplementary' | 'closing';
export type EntityType =
  | 'scenario_introduction'
  | 'scenario_prompt'
  | 'scenario_transition'
  | 'option_feedback'
  | 'option_transition'
  | 'simulation_landing'
  | 'simulation_closing';

export interface VideoLibraryItem {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  video_platform: VideoPlatform;
  thumbnail_url?: string;
  duration_seconds?: number;
  tags: string[];
  topic_ids?: string[];
  difficulty?: string;
  video_type: VideoType;
  embed_parameters: Record<string, any>;
  usage_count: number;
  last_used_at?: string;
  created_by?: string;
  is_public: boolean;
  is_active: boolean;
  transcript?: string;
  captions_url?: string;
  quality_info?: Record<string, any>;
  industry?: string[];
  competency_ids?: string[];
  avg_engagement_score?: number;
  avg_completion_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface VideoContentReference {
  id: string;
  video_library_id: string;
  entity_type: EntityType;
  entity_id: string;
  difficulty_level?: string;
  display_order: number;
  is_required: boolean;
  autoplay: boolean;
  allow_skip: boolean;
  min_watch_percentage: number;
  is_active: boolean;
  video?: VideoLibraryItem;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  video_slots: Array<{
    slot_name: string;
    video_type: VideoType;
    is_required: boolean;
    default_video_id?: string;
  }>;
  default_settings: Record<string, any>;
  tags: string[];
  category?: string;
  industry?: string;
  created_by?: string;
  is_public: boolean;
  usage_count: number;
}

export interface VideoPlaylist {
  id: string;
  name: string;
  description?: string;
  playlist_type: string;
  autoplay_next: boolean;
  allow_skip_videos: boolean;
  require_sequential: boolean;
  created_by?: string;
  is_public: boolean;
  items?: VideoPlaylistItem[];
}

export interface VideoPlaylistItem {
  id: string;
  playlist_id: string;
  video_library_id: string;
  sequence_order: number;
  title_override?: string;
  description_override?: string;
  is_optional: boolean;
  min_watch_percentage: number;
  transition_delay_seconds: number;
  video?: VideoLibraryItem;
}

export interface VideoEngagement {
  id: string;
  learner_id: string;
  video_library_id?: string;
  video_url: string;
  simulation_instance_id?: string;
  scenario_id?: string;
  option_id?: string;
  video_type: VideoType;
  total_watch_time_seconds: number;
  unique_plays: number;
  completion_count: number;
  skip_count: number;
  pause_count: number;
  rewind_count: number; 
  interaction_events: Array<{
    timestamp: number;
    event_type: string;
    position: number;
    value?: any;
  }>;
  max_percentage_watched: number;
  fully_completed: boolean;
  average_watch_percentage?: number;
  first_viewed_at: string;
  last_viewed_at: string;
  session_count: number;
}

export class VideoService {
  static async getVideoLibrary(filters: {
    platform?: VideoPlatform;
    videoType?: VideoType;
    tags?: string[];
    difficulty?: string;
    searchTerm?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<VideoLibraryItem[]> {
    let query = supabase
      .from('video_library')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    if (filters.platform) {
      query = query.eq('video_platform', filters.platform);
    }

    if (filters.videoType) {
      query = query.eq('video_type', filters.videoType);
    }

    if (filters.difficulty) {
      query = query.or(`difficulty.eq.${filters.difficulty},difficulty.eq.all`);
    }

    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters.searchTerm) {
      query = query.or(
        `title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching video library:', error);
      throw error;
    }

    return data || [];
  }

  static async getVideoById(videoId: string): Promise<VideoLibraryItem | null> {
    const { data, error } = await supabase
      .from('video_library')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching video:', error);
      throw error;
    }

    return data;
  }

  static async createVideo(videoData: Partial<VideoLibraryItem>): Promise<VideoLibraryItem | null> {
    const platform = this.detectPlatform(videoData.video_url || '');

    const { data, error } = await supabase
      .from('video_library')
      .insert({
        ...videoData,
        video_platform: videoData.video_platform || platform,
        embed_parameters: videoData.embed_parameters || {
          autoplay: false,
          controls: true,
          muted: false,
          loop: false
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating video:', error);
      throw error;
    }

    return data;
  }

  static async updateVideo(videoId: string, updates: Partial<VideoLibraryItem>): Promise<boolean> {
    const { error } = await supabase
      .from('video_library')
      .update(updates)
      .eq('id', videoId);

    if (error) {
      console.error('Error updating video:', error);
      throw error;
    }

    return true;
  }

  static async deleteVideo(videoId: string): Promise<boolean> {
    const { error } = await supabase
      .from('video_library')
      .update({ is_active: false })
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting video:', error);
      throw error;
    }

    return true;
  }

  static async assignVideoToEntity(
    videoLibraryId: string,
    entityType: EntityType,
    entityId: string,
    options: {
      difficultyLevel?: string;
      displayOrder?: number;
      isRequired?: boolean;
      autoplay?: boolean;
      allowSkip?: boolean;
      minWatchPercentage?: number;
    } = {}
  ): Promise<VideoContentReference | null> {
    const { data, error } = await supabase
      .from('video_content_references')
      .insert({
        video_library_id: videoLibraryId,
        entity_type: entityType,
        entity_id: entityId,
        difficulty_level: options.difficultyLevel || 'all',
        display_order: options.displayOrder || 0,
        is_required: options.isRequired !== undefined ? options.isRequired : false,
        autoplay: options.autoplay || false,
        allow_skip: options.allowSkip !== undefined ? options.allowSkip : true,
        min_watch_percentage: options.minWatchPercentage || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning video to entity:', error);
      throw error;
    }

    await this.incrementVideoUsage(videoLibraryId);

    return data;
  }

  static async getVideosForEntity(
    entityType: EntityType,
    entityId: string,
    difficultyLevel?: string
  ): Promise<VideoContentReference[]> {
    let query = supabase
      .from('video_content_references')
      .select(`
        *,
        video:video_library_id (*)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_active', true)
      .order('display_order');

    if (difficultyLevel) {
      query = query.or(`difficulty_level.eq.${difficultyLevel},difficulty_level.eq.all`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching entity videos:', error);
      throw error;
    }

    return data || [];
  }

  static async removeVideoFromEntity(referenceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('video_content_references')
      .delete()
      .eq('id', referenceId);

    if (error) {
      console.error('Error removing video from entity:', error);
      throw error;
    }

    return true;
  }

  static async createPlaylist(playlistData: Partial<VideoPlaylist>): Promise<VideoPlaylist | null> {
    const { data, error } = await supabase
      .from('video_playlists')
      .insert(playlistData)
      .select()
      .single();

    if (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }

    return data;
  }

  static async addVideoToPlaylist(
    playlistId: string,
    videoLibraryId: string,
    options: {
      sequenceOrder?: number;
      titleOverride?: string;
      descriptionOverride?: string;
      isOptional?: boolean;
      minWatchPercentage?: number;
    } = {}
  ): Promise<VideoPlaylistItem | null> {
    const { data, error } = await supabase
      .from('video_playlist_items')
      .insert({
        playlist_id: playlistId,
        video_library_id: videoLibraryId,
        sequence_order: options.sequenceOrder || 0,
        title_override: options.titleOverride,
        description_override: options.descriptionOverride,
        is_optional: options.isOptional || false,
        min_watch_percentage: options.minWatchPercentage || 80
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding video to playlist:', error);
      throw error;
    }

    return data;
  }

  static async getPlaylist(playlistId: string): Promise<VideoPlaylist | null> {
    const { data: playlist, error: playlistError } = await supabase
      .from('video_playlists')
      .select('*')
      .eq('id', playlistId)
      .maybeSingle();

    if (playlistError) {
      console.error('Error fetching playlist:', playlistError);
      throw playlistError;
    }

    if (!playlist) return null;

    const { data: items, error: itemsError } = await supabase
      .from('video_playlist_items')
      .select(`
        *,
        video:video_library_id (*)
      `)
      .eq('playlist_id', playlistId)
      .order('sequence_order');

    if (itemsError) {
      console.error('Error fetching playlist items:', itemsError);
      throw itemsError;
    }

    return {
      ...playlist,
      items: items || []
    };
  }

  static async trackVideoEngagement(
    learnerId: string,
    videoLibraryId: string | null,
    videoUrl: string,
    simulationInstanceId: string | null,
    context: {
      scenarioId?: string;
      optionId?: string;
      videoType?: VideoType;
      eventType?: string;
      watchPercentage?: number;
    } = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('track_video_engagement', {
        learner_id_param: learnerId,
        video_library_id_param: videoLibraryId,
        video_url_param: videoUrl,
        simulation_instance_id_param: simulationInstanceId,
        scenario_id_param: context.scenarioId || null,
        option_id_param: context.optionId || null,
        video_type_param: context.videoType || 'supplementary',
        event_type_param: context.eventType || 'play',
        watch_percentage_param: context.watchPercentage || 0
      });

      if (error) {
        console.error('Error tracking video engagement:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error calling track_video_engagement function:', error);
      return null;
    }
  }

  static async getLearnerVideoEngagement(
    learnerId: string,
    simulationInstanceId?: string
  ): Promise<VideoEngagement[]> {
    let query = supabase
      .from('video_engagement_tracking')
      .select('*')
      .eq('learner_id', learnerId)
      .order('last_viewed_at', { ascending: false });

    if (simulationInstanceId) {
      query = query.eq('simulation_instance_id', simulationInstanceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching video engagement:', error);
      throw error;
    }

    return data || [];
  }

  static async getVideoAnalytics(videoLibraryId: string): Promise<{
    totalViews: number;
    uniqueViewers: number;
    avgCompletionRate: number;
    avgEngagementScore: number;
    totalWatchTime: number;
  }> {
    const { data, error } = await supabase
      .from('video_engagement_tracking')
      .select('*')
      .eq('video_library_id', videoLibraryId);

    if (error) {
      console.error('Error fetching video analytics:', error);
      throw error;
    }

    const engagements = data || [];
    const uniqueViewers = new Set(engagements.map(e => e.learner_id)).size;
    const totalViews = engagements.reduce((sum, e) => sum + e.unique_plays, 0);
    const completions = engagements.filter(e => e.fully_completed).length;
    const avgCompletionRate = engagements.length > 0 ? (completions / engagements.length) * 100 : 0;
    const avgEngagementScore = engagements.length > 0
      ? engagements.reduce((sum, e) => sum + e.max_percentage_watched, 0) / engagements.length
      : 0;
    const totalWatchTime = engagements.reduce((sum, e) => sum + e.total_watch_time_seconds, 0);

    return {
      totalViews,
      uniqueViewers,
      avgCompletionRate,
      avgEngagementScore,
      totalWatchTime
    };
  }

  static async incrementVideoUsage(videoLibraryId: string): Promise<void> {
    try {
      await supabase.rpc('increment_video_usage', {
        video_id_param: videoLibraryId
      });
    } catch (error) {
      console.error('Error incrementing video usage:', error);
    }
  }

  static async updateVideoLibraryStats(videoLibraryId: string): Promise<void> {
    try {
      await supabase.rpc('update_video_library_stats', {
        video_id_param: videoLibraryId
      });
    } catch (error) {
      console.error('Error updating video library stats:', error);
    }
  }

  static detectPlatform(url: string): VideoPlatform {
    if (!url) return 'custom';

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('synthesia.io')) return 'synthesia';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';
    if (lowerUrl.includes('loom.com')) return 'loom';
    if (lowerUrl.includes('blob:') || lowerUrl.includes('supabase.co/storage')) return 'file';

    return 'custom';
  }

  static getEmbedUrl(url: string, platform: VideoPlatform, embedParams: Record<string, any> = {}): string {
    const params = {
      autoplay: embedParams.autoplay ? 1 : 0,
      controls: embedParams.controls !== false ? 1 : 0,
      muted: embedParams.muted ? 1 : 0,
      loop: embedParams.loop ? 1 : 0,
      ...embedParams
    };

    switch (platform) {
      case 'youtube': {
        let videoId = url;
        if (url.includes('youtube.com/watch?v=')) {
          videoId = new URL(url).searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
        }
        const queryParams = new URLSearchParams({
          autoplay: params.autoplay.toString(),
          controls: params.controls.toString(),
          mute: params.muted.toString(),
          loop: params.loop.toString()
        });
        return `https://www.youtube.com/embed/${videoId}?${queryParams.toString()}`;
      }

      case 'vimeo': {
        const videoId = url.split('vimeo.com/')[1]?.split(/[?#]/)[0];
        const queryParams = new URLSearchParams({
          autoplay: params.autoplay.toString(),
          muted: params.muted.toString(),
          loop: params.loop.toString()
        });
        return `https://player.vimeo.com/video/${videoId}?${queryParams.toString()}`;
      }

      case 'loom': {
        const videoId = url.split('loom.com/share/')[1]?.split(/[?#]/)[0];
        return `https://www.loom.com/embed/${videoId}`;
      }

      case 'synthesia':
      case 'file':
      case 'custom':
      default:
        return url;
    }
  }

  static extractVideoId(url: string, platform: VideoPlatform): string | null {
    try {
      switch (platform) {
        case 'youtube': {
          if (url.includes('youtube.com/watch?v=')) {
            return new URL(url).searchParams.get('v');
          } else if (url.includes('youtu.be/')) {
            return url.split('youtu.be/')[1].split(/[?#]/)[0];
          }
          return null;
        }

        case 'vimeo': {
          return url.split('vimeo.com/')[1]?.split(/[?#]/)[0] || null;
        }

        case 'loom': {
          return url.split('loom.com/share/')[1]?.split(/[?#]/)[0] || null;
        }

        case 'synthesia': {
          return url.split('synthesia.io/')[1]?.split(/[?#]/)[0] || null;
        }

        default:
          return null;
      }
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  }

  static async validateVideoUrl(url: string): Promise<{
    isValid: boolean;
    platform: VideoPlatform;
    videoId?: string;
    error?: string;
  }> {
    const platform = this.detectPlatform(url);
    const videoId = this.extractVideoId(url, platform);

    if (!videoId && platform !== 'custom' && platform !== 'file') {
      return {
        isValid: false,
        platform,
        error: 'Could not extract video ID from URL'
      };
    }

    return {
      isValid: true,
      platform,
      videoId: videoId || undefined
    };
  }
}
