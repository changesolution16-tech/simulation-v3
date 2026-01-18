import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, Trash2, RefreshCw, CheckCircle, AlertCircle, Layers, Bug, Eye, Edit, X, Youtube } from 'lucide-react';
import VideoInputSelector from '../video/VideoInputSelector';
import VideoLibrary from './VideoLibrary';
import VideoDebugger from '../video/VideoDebugger';
import YouTubeTestTool from '../video/YouTubeTestTool';
import SynthesiaPlayer from '../video/SynthesiaPlayer';
import type { VideoInput } from '../../types';

interface ScenarioVideo {
  id: string;
  scenario_id: string;
  video_type: 'introduction' | 'prompt' | 'transition' | 'feedback' | 'conclusion';
  video_url: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
  scenarios?: {
    title: string;
    difficulty: string;
  };
}

interface Scenario {
  id: string;
  title: string;
  difficulty: string;
}

const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<ScenarioVideo[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [videoType, setVideoType] = useState<'introduction' | 'prompt' | 'transition' | 'feedback' | 'conclusion'>('prompt');
  const [videoDifficulty, setVideoDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [videoInput, setVideoInput] = useState<VideoInput>({ source: 'url' });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manage' | 'library' | 'debug' | 'youtube-test'>('manage');
  const [previewVideo, setPreviewVideo] = useState<ScenarioVideo | null>(null);
  const [editingVideo, setEditingVideo] = useState<ScenarioVideo | null>(null);

  useEffect(() => {
    loadVideos();
    loadScenarios();
  }, []);
  
  const loadVideos = async () => {
    try {
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select('id, title, difficulty, prompt_video_url, transition_video_url, introduction_video_url')
        .order('title');

      if (scenariosError) throw scenariosError;

      const videosList: ScenarioVideo[] = [];

      scenariosData?.forEach(scenario => {
        if (scenario.introduction_video_url) {
          videosList.push({
            id: `${scenario.id}-introduction`,
            scenario_id: scenario.id,
            video_type: 'introduction',
            video_url: scenario.introduction_video_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            scenarios: {
              title: scenario.title,
              difficulty: scenario.difficulty
            }
          });
        }
        if (scenario.prompt_video_url) {
          videosList.push({
            id: `${scenario.id}-prompt`,
            scenario_id: scenario.id,
            video_type: 'prompt',
            video_url: scenario.prompt_video_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            scenarios: {
              title: scenario.title,
              difficulty: scenario.difficulty
            }
          });
        }
        if (scenario.transition_video_url) {
          videosList.push({
            id: `${scenario.id}-transition`,
            scenario_id: scenario.id,
            video_type: 'transition',
            video_url: scenario.transition_video_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            scenarios: {
              title: scenario.title,
              difficulty: scenario.difficulty
            }
          });
        }
      });

      const { data: optionsData, error: optionsError } = await supabase
        .from('scenario_options')
        .select(`
          id,
          scenario_id,
          feedback_video_beginner,
          feedback_video_intermediate,
          feedback_video_advanced,
          scenarios (
            title,
            difficulty
          )
        `)
        .order('scenario_id');

      if (!optionsError && optionsData) {
        optionsData.forEach(option => {
          if (option.feedback_video_beginner) {
            videosList.push({
              id: `${option.id}-feedback-beginner`,
              scenario_id: option.scenario_id,
              video_type: 'feedback',
              video_url: option.feedback_video_beginner,
              difficulty: 'beginner',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              scenarios: option.scenarios as any
            });
          }
          if (option.feedback_video_intermediate) {
            videosList.push({
              id: `${option.id}-feedback-intermediate`,
              scenario_id: option.scenario_id,
              video_type: 'feedback',
              video_url: option.feedback_video_intermediate,
              difficulty: 'intermediate',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              scenarios: option.scenarios as any
            });
          }
          if (option.feedback_video_advanced) {
            videosList.push({
              id: `${option.id}-feedback-advanced`,
              scenario_id: option.scenario_id,
              video_type: 'feedback',
              video_url: option.feedback_video_advanced,
              difficulty: 'advanced',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              scenarios: option.scenarios as any
            });
          }
        });
      }

      setVideos(videosList);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('id, title, difficulty')
        .order('title');

      if (error) throw error;
      setScenarios(data || []);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };
  

  const handleSaveVideo = async () => {
    if (!videoInput.url || !selectedScenario || !videoType) {
      setSaveError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const videoUrl = videoInput.url;
      const videoSource = videoInput.source;
      const videoFileId = videoInput.fileId || null;

      if (videoType === 'prompt' || videoType === 'transition' || videoType === 'introduction' || videoType === 'conclusion') {
        const updateData: any = {};

        if (videoType === 'prompt') {
          updateData.prompt_video_url = videoUrl;
          updateData.prompt_video_source = videoSource;
          updateData.prompt_video_file_id = videoFileId;
        } else if (videoType === 'transition') {
          updateData.transition_video_url = videoUrl;
          updateData.transition_video_source = videoSource;
          updateData.transition_video_file_id = videoFileId;
        } else if (videoType === 'introduction') {
          updateData.introduction_video_url = videoUrl;
          updateData.introduction_video_source = videoSource;
          updateData.introduction_video_file_id = videoFileId;
        } else if (videoType === 'conclusion') {
          updateData.conclusion_video_url = videoUrl;
          updateData.conclusion_video_source = videoSource;
          updateData.conclusion_video_file_id = videoFileId;
        }

        const { error } = await supabase
          .from('scenarios')
          .update(updateData)
          .eq('id', selectedScenario);

        if (error) throw error;
        setSaveSuccess(`${videoType.charAt(0).toUpperCase() + videoType.slice(1)} video saved successfully!`);
      } else if (videoType === 'feedback') {
        const { data: options, error: fetchError } = await supabase
          .from('scenario_options')
          .select('id')
          .eq('scenario_id', selectedScenario);

        if (fetchError) throw fetchError;

        if (!options || options.length === 0) {
          throw new Error('No options found for this scenario');
        }

        const updateData: any = {};
        if (videoDifficulty === 'beginner') {
          updateData.feedback_video_beginner = videoUrl;
          updateData.feedback_video_beginner_source = videoSource;
          updateData.feedback_video_beginner_file_id = videoFileId;
        } else if (videoDifficulty === 'intermediate') {
          updateData.feedback_video_intermediate = videoUrl;
          updateData.feedback_video_intermediate_source = videoSource;
          updateData.feedback_video_intermediate_file_id = videoFileId;
        } else if (videoDifficulty === 'advanced') {
          updateData.feedback_video_advanced = videoUrl;
          updateData.feedback_video_advanced_source = videoSource;
          updateData.feedback_video_advanced_file_id = videoFileId;
        }

        for (const option of options) {
          const { error } = await supabase
            .from('scenario_options')
            .update(updateData)
            .eq('id', option.id);

          if (error) throw error;
        }

        setSaveSuccess(`Feedback video (${videoDifficulty}) saved for all options!`);
      }

      await loadVideos();
      setVideoInput({ source: 'url' });
      setSelectedScenario('');
      setVideoType('prompt');
      setVideoDifficulty('beginner');

    } catch (error: any) {
      console.error('Error saving video:', error);
      setSaveError(error.message || 'Failed to save video. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) {
        console.error('Video not found:', videoId);
        return;
      }

      console.log('Deleting video:', videoId, video);

      if (video.video_type === 'feedback') {
        const optionId = video.id.split('-feedback-')[0];
        const difficulty = video.difficulty;

        const updateData: any = {};
        if (difficulty === 'beginner') {
          updateData.feedback_video_beginner = null;
        } else if (difficulty === 'intermediate') {
          updateData.feedback_video_intermediate = null;
        } else if (difficulty === 'advanced') {
          updateData.feedback_video_advanced = null;
        }

        const { error } = await supabase
          .from('scenario_options')
          .update(updateData)
          .eq('id', optionId);

        if (error) throw error;
      } else {
        const parts = videoId.split('-');
        const scenarioId = video.scenario_id;
        const type = video.video_type;

        const updateData: any = {};
        if (type === 'introduction') {
          updateData.introduction_video_url = null;
        } else if (type === 'prompt') {
          updateData.prompt_video_url = null;
        } else if (type === 'transition') {
          updateData.transition_video_url = null;
        }

        const { error } = await supabase
          .from('scenarios')
          .update(updateData)
          .eq('id', scenarioId);

        if (error) throw error;
      }

      await loadVideos();
      setSaveSuccess('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting video:', error);
      setSaveError('Failed to delete video: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }
  
  const handleValidateAll = async () => {
    setValidating(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      let brokenCount = 0;
      const { data: allScenarios } = await supabase
        .from('scenarios')
        .select('id, title, prompt_video_url, introduction_video_url, transition_video_url')
        .or('prompt_video_url.not.is.null,introduction_video_url.not.is.null,transition_video_url.not.is.null');

      if (allScenarios) {
        for (const scenario of allScenarios) {
          const urls = [
            scenario.prompt_video_url,
            scenario.introduction_video_url,
            scenario.transition_video_url
          ].filter(url => url);

          for (const url of urls) {
            try {
              const response = await fetch(url, { method: 'HEAD' });
              if (!response.ok) brokenCount++;
            } catch {
              brokenCount++;
            }
          }
        }
      }

      if (brokenCount > 0) {
        setSaveError(`Found ${brokenCount} inaccessible video URL(s)`);
      } else {
        setSaveSuccess('All video URLs are accessible!');
      }
    } catch (error: any) {
      setSaveError('Failed to validate videos');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="inline w-4 h-4 mr-2" />
            Manage Videos
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'library'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Layers className="inline w-4 h-4 mr-2" />
            Video Library
          </button>
          <button
            onClick={() => setActiveTab('youtube-test')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'youtube-test'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Youtube className="inline w-4 h-4 mr-2" />
            YouTube Test
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'debug'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bug className="inline w-4 h-4 mr-2" />
            Debug Videos
          </button>
        </nav>
      </div>

      {activeTab === 'library' ? (
        <VideoLibrary />
      ) : activeTab === 'youtube-test' ? (
        <div className="space-y-6">
          <YouTubeTestTool />
        </div>
      ) : activeTab === 'debug' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Test Any Video</h3>
            <VideoInputSelector
              label="Video to Test"
              value={videoInput}
              onChange={setVideoInput}
              helpText="Test any video source: URL, embed code, or upload a file"
              category="test"
            />
          </div>
          {videoInput.url && <VideoDebugger videoUrl={videoInput.url} />}
        </div>
      ) : (
        <>
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{saveError}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-800">{saveSuccess}</p>
        </div>
      )}

      {editingVideo && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Editing Video</p>
              <p className="text-xs text-blue-700">{editingVideo.scenarios?.title} - {editingVideo.video_type}</p>
            </div>
            <button
              onClick={() => {
                setEditingVideo(null);
                setSelectedScenario('');
                setVideoType('prompt');
                setVideoInput({ source: 'url' });
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">{editingVideo ? 'Update Video' : 'Add Video URL'}</h3>
          <p className="mt-1 text-sm text-gray-500">{editingVideo ? 'Update the video URL or settings' : 'Enter the Synthesia video URL for your scenario'}</p>

          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="scenario" className="block text-sm font-medium text-gray-700">
                Scenario *
              </label>
              <select
                id="scenario"
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a scenario...</option>
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title} ({scenario.difficulty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Video Type *
              </label>
              <select
                id="type"
                value={videoType}
                onChange={(e) => setVideoType(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="introduction">Introduction</option>
                <option value="prompt">Prompt (Scenario Introduction)</option>
                <option value="transition">Transition (Between Scenarios)</option>
                <option value="feedback">Feedback (After Option Selection)</option>
                <option value="conclusion">Conclusion (Final Summary)</option>
              </select>
            </div>

            {videoType === 'feedback' && (
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                  Difficulty Level *
                </label>
                <select
                  id="difficulty"
                  value={videoDifficulty}
                  onChange={(e) => setVideoDifficulty(e.target.value as any)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">This video will be applied to ALL options in this scenario</p>
              </div>
            )}

            <div>
              <VideoInputSelector
                label="Video"
                value={videoInput}
                onChange={setVideoInput}
                videoType={videoType === 'prompt' ? 'prompt' : videoType === 'introduction' ? 'introduction' : videoType === 'transition' ? 'transition' : 'feedback'}
                required
                helpText="Choose how to add your video: enter a URL, paste embed code, or upload a file"
                category={videoType}
                referenceId={selectedScenario}
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveVideo}
              disabled={!videoInput.url || !selectedScenario || uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Save Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">Uploaded Videos</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scenario
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {videos.map((video) => (
                  <tr key={video.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="font-medium">{video.scenarios?.title || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 capitalize">{video.scenarios?.difficulty}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        video.video_type === 'prompt'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {video.video_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(video.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewVideo(video)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Preview video"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingVideo(video);
                            setSelectedScenario(video.scenario_id);
                            setVideoType(video.video_type);
                            setVideoInput({ source: 'url', url: video.video_url });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-100"
                          title="Edit video"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">Video URL Validation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Check all scenario videos to ensure URLs are accessible
          </p>
          <button
            onClick={handleValidateAll}
            disabled={validating}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Validate All Videos
              </>
            )}
          </button>
        </div>
      </div>
        </>
      )}

      {previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Video Preview</h3>
                <p className="text-sm text-gray-500">{previewVideo.scenarios?.title} - {previewVideo.video_type}</p>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <SynthesiaPlayer
                videoUrl={previewVideo.video_url}
                videoType={previewVideo.video_type}
                testingMode={true}
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <p className="text-xs font-medium text-gray-700 mb-2">Video Details</p>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Scenario:</span> {previewVideo.scenarios?.title}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {previewVideo.video_type}
                  </div>
                  <div>
                    <span className="font-medium">Difficulty:</span> {previewVideo.scenarios?.difficulty}
                  </div>
                  <div>
                    <span className="font-medium">Added:</span> {new Date(previewVideo.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-gray-700">URL:</span>
                  <p className="text-gray-600 break-all mt-1">{previewVideo.video_url}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManager;