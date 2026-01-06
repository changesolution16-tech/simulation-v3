import { supabase, isSupabaseConfigured } from './supabase';
import { VideoWatchStatus } from '../types';

export interface VideoTrackingRecord {
  userId: string;
  scenarioId?: string;
  optionId?: string;
  videoType: 'introduction' | 'prompt' | 'feedback' | 'transition';
  watchPercentage: number;
  completed: boolean;
  watchDurationSeconds: number;
  wasSkipped?: boolean;
  skipReason?: string;
}

export const saveVideoWatchProgress = async (record: VideoTrackingRecord): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Supabase not configured, video tracking skipped');
    return;
  }

  try {
    const { error } = await supabase.from('video_watch_tracking').upsert({
      user_id: record.userId,
      scenario_id: record.scenarioId || null,
      option_id: record.optionId || null,
      video_type: record.videoType,
      watch_percentage: record.watchPercentage,
      completed: record.completed,
      watch_duration_seconds: record.watchDurationSeconds,
      was_skipped: record.wasSkipped || false,
      skip_reason: record.skipReason || null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,scenario_id,option_id,video_type'
    });

    if (error) {
      console.error('Error saving video watch progress:', error);
    }
  } catch (error) {
    console.error('Error saving video watch progress:', error);
  }
};

export const getVideoWatchStatus = async (
  userId: string,
  scenarioId?: string,
  optionId?: string,
  videoType?: 'introduction' | 'prompt' | 'feedback' | 'transition'
): Promise<VideoWatchStatus[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('video_watch_tracking')
      .select('*')
      .eq('user_id', userId);

    if (scenarioId) {
      query = query.eq('scenario_id', scenarioId);
    }

    if (optionId) {
      query = query.eq('option_id', optionId);
    }

    if (videoType) {
      query = query.eq('video_type', videoType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching video watch status:', error);
      return [];
    }

    return (data || []).map(record => ({
      videoType: record.video_type as 'introduction' | 'prompt' | 'feedback' | 'transition',
      scenarioId: record.scenario_id,
      optionId: record.option_id,
      watchPercentage: Number(record.watch_percentage),
      completed: record.completed,
      watchDuration: record.watch_duration_seconds || 0,
      wasSkipped: record.was_skipped,
      skipReason: record.skip_reason
    }));
  } catch (error) {
    console.error('Error fetching video watch status:', error);
    return [];
  }
};

export const markVideoAsSkipped = async (
  userId: string,
  videoType: 'introduction' | 'prompt' | 'feedback' | 'transition',
  scenarioId?: string,
  optionId?: string,
  skipReason?: string
): Promise<void> => {
  await saveVideoWatchProgress({
    userId,
    scenarioId,
    optionId,
    videoType,
    watchPercentage: 0,
    completed: true,
    watchDurationSeconds: 0,
    wasSkipped: true,
    skipReason: skipReason || 'Testing mode skip'
  });
};

export const hasWatchedVideo = async (
  userId: string,
  videoType: 'introduction' | 'prompt' | 'feedback' | 'transition',
  scenarioId?: string,
  optionId?: string
): Promise<boolean> => {
  const statuses = await getVideoWatchStatus(userId, scenarioId, optionId, videoType);
  return statuses.some(status => status.completed);
};

export const getScenarioVideoProgress = async (
  userId: string,
  scenarioId: string
): Promise<{
  introduction: boolean;
  prompt: boolean;
  feedbackWatched: boolean;
  transitionWatched: boolean;
}> => {
  const statuses = await getVideoWatchStatus(userId, scenarioId);

  return {
    introduction: statuses.some(s => s.videoType === 'introduction' && s.completed),
    prompt: statuses.some(s => s.videoType === 'prompt' && s.completed),
    feedbackWatched: statuses.some(s => s.videoType === 'feedback' && s.completed),
    transitionWatched: statuses.some(s => s.videoType === 'transition' && s.completed)
  };
};
