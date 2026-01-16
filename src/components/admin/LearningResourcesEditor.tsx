'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Search, BookOpen, FileText, Video, Headphones, Wrench, ExternalLink } from 'lucide-react';

interface LearningResource {
  id: string;
  title: string;
  resource_type: 'book' | 'article' | 'course' | 'video' | 'podcast' | 'tool' | 'framework' | 'assessment';
  url?: string;
  description?: string;
  author?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  tags?: string[];
}

interface LearningResourcesEditorProps {
  optionId?: string;
  assignedResources?: LearningResource[];
  onChange?: (resources: LearningResource[]) => void;
  label?: string;
}

const resourceIcons = {
  book: BookOpen,
  article: FileText,
  course: BookOpen,
  video: Video,
  podcast: Headphones,
  tool: Wrench,
  framework: Wrench,
  assessment: FileText,
};

const resourceColors = {
  book: 'bg-purple-100 text-purple-700',
  article: 'bg-blue-100 text-blue-700',
  course: 'bg-green-100 text-green-700',
  video: 'bg-red-100 text-red-700',
  podcast: 'bg-yellow-100 text-yellow-700',
  tool: 'bg-gray-100 text-gray-700',
  framework: 'bg-indigo-100 text-indigo-700',
  assessment: 'bg-pink-100 text-pink-700',
};

export default function LearningResourcesEditor({
  optionId,
  assignedResources = [],
  onChange,
  label = 'Learning Resources'
}: LearningResourcesEditorProps) {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [selectedResources, setSelectedResources] = useState<LearningResource[]>(assignedResources);
  const [showBrowser, setShowBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Load all resources
  useEffect(() => {
    loadResources();
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(selectedResources);
    }
  }, [selectedResources]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/learning-resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to load learning resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const addResource = (resource: LearningResource) => {
    if (!selectedResources.find(r => r.id === resource.id)) {
      setSelectedResources([...selectedResources, resource]);
    }
    setShowBrowser(false);
  };

  const removeResource = (resourceId: string) => {
    setSelectedResources(selectedResources.filter(r => r.id !== resourceId));
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = !searchQuery ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.author?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || resource.resource_type === filterType;

    const notSelected = !selectedResources.find(r => r.id === resource.id);

    return matchesSearch && matchesType && notSelected;
  });

  const ResourceIcon = ({ type }: { type: string }) => {
    const Icon = resourceIcons[type as keyof typeof resourceIcons] || BookOpen;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Curate books, articles, courses, and videos to support continued learning.
        </p>
      </div>

      {/* Selected resources */}
      <div className="space-y-2">
        {selectedResources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg"
          >
            <div className={`p-2 rounded-lg ${resourceColors[resource.resource_type]}`}>
              <ResourceIcon type={resource.resource_type} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{resource.title}</h4>
                  {resource.author && (
                    <p className="text-xs text-gray-600 mt-0.5">by {resource.author}</p>
                  )}
                  {resource.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {resource.resource_type}
                    </span>
                    {resource.difficulty_level && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {resource.difficulty_level}
                      </span>
                    )}
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeResource(resource.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove resource"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add resource button */}
      {!showBrowser ? (
        <button
          type="button"
          onClick={() => setShowBrowser(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Learning Resource
        </button>
      ) : (
        /* Resource browser */
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Browse Resources</h4>
            <button
              type="button"
              onClick={() => setShowBrowser(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {/* Search and filter */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="book">Books</option>
              <option value="article">Articles</option>
              <option value="course">Courses</option>
              <option value="video">Videos</option>
              <option value="podcast">Podcasts</option>
              <option value="tool">Tools</option>
              <option value="framework">Frameworks</option>
            </select>
          </div>

          {/* Resource list */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Loading resources...</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No resources found.</p>
                <p className="text-xs mt-1">Try adjusting your search or filter.</p>
              </div>
            ) : (
              filteredResources.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => addResource(resource)}
                  className="w-full flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className={`p-2 rounded-lg ${resourceColors[resource.resource_type]}`}>
                    <ResourceIcon type={resource.resource_type} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900">{resource.title}</h5>
                    {resource.author && (
                      <p className="text-xs text-gray-600 mt-0.5">by {resource.author}</p>
                    )}
                    {resource.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {resource.resource_type}
                      </span>
                      {resource.difficulty_level && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {resource.difficulty_level}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {selectedResources.length === 0 && !showBrowser && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No learning resources assigned yet.</p>
          <p className="text-xs mt-1">Add curated resources to support continued learning.</p>
        </div>
      )}
    </div>
  );
}
