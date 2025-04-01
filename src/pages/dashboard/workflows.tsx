import { useState, useEffect } from 'react';
import { Plus, ArrowRight, MoreVertical, Play, Pause, Settings, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import type { Workflow, Platform, WorkflowConfig, WorkflowStatus } from '../../lib/types';

export function WorkflowsPage() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig>({
    name: '',
    sourcePlatform: 'youtube',
    targetPlatforms: [],
    autoPublish: true,
    metadata: {
      copyTitle: true,
      copyDescription: true,
      copyTags: true,
    },
  });

  useEffect(() => {
    if (user) {
      loadWorkflows();
    }
  }, [user]);

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    setIsCreating(true);
    setWorkflowConfig({
      name: '',
      sourcePlatform: 'youtube',
      targetPlatforms: [],
      autoPublish: true,
      metadata: {
        copyTitle: true,
        copyDescription: true,
        copyTags: true,
      },
    });
  };

  const handleSaveWorkflow = async () => {
    try {
      const { error } = await supabase.from('workflows').insert({
        user_id: user?.id,
        name: workflowConfig.name,
        source_platform: workflowConfig.sourcePlatform,
        target_platforms: workflowConfig.targetPlatforms,
        is_active: true,
        config: workflowConfig,
      });

      if (error) throw error;

      setIsCreating(false);
      loadWorkflows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
    }
  };

  const toggleWorkflowStatus = async (workflowId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: !currentStatus })
        .eq('id', workflowId);

      if (error) throw error;
      loadWorkflows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow status');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automated Video Workflows</h1>
          <p className="text-gray-600">Configure automatic cross-platform video publishing</p>
        </div>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {isCreating ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Name</label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={workflowConfig.name}
              onChange={(e) => setWorkflowConfig({ ...workflowConfig, name: e.target.value })}
              placeholder="e.g., YouTube to Social Media"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Source Platform</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['youtube', 'tiktok', 'instagram'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => setWorkflowConfig({ ...workflowConfig, sourcePlatform: platform as Platform })}
                  className={`p-4 rounded-lg border ${
                    workflowConfig.sourcePlatform === platform
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <h3 className="font-medium capitalize">{platform}</h3>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Target Platforms</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['youtube', 'tiktok', 'instagram', 'twitter'].map((platform) => (
                platform !== workflowConfig.sourcePlatform && (
                  <button
                    key={platform}
                    onClick={() => {
                      const platforms = workflowConfig.targetPlatforms.includes(platform as Platform)
                        ? workflowConfig.targetPlatforms.filter(p => p !== platform)
                        : [...workflowConfig.targetPlatforms, platform as Platform];
                      setWorkflowConfig({ ...workflowConfig, targetPlatforms: platforms });
                    }}
                    className={`p-4 rounded-lg border ${
                      workflowConfig.targetPlatforms.includes(platform as Platform)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <h3 className="font-medium capitalize">{platform}</h3>
                  </button>
                )
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Content Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={workflowConfig.metadata.copyTitle}
                  onChange={(e) => setWorkflowConfig({
                    ...workflowConfig,
                    metadata: { ...workflowConfig.metadata, copyTitle: e.target.checked }
                  })}
                />
                <span className="ml-2">Copy video title</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={workflowConfig.metadata.copyDescription}
                  onChange={(e) => setWorkflowConfig({
                    ...workflowConfig,
                    metadata: { ...workflowConfig.metadata, copyDescription: e.target.checked }
                  })}
                />
                <span className="ml-2">Copy video description</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={workflowConfig.metadata.copyTags}
                  onChange={(e) => setWorkflowConfig({
                    ...workflowConfig,
                    metadata: { ...workflowConfig.metadata, copyTags: e.target.checked }
                  })}
                />
                <span className="ml-2">Copy video tags</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveWorkflow}
              disabled={!workflowConfig.name || workflowConfig.targetPlatforms.length === 0}
            >
              Save Workflow
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm divide-y">
          {workflows.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No workflows created yet</p>
              <Button className="mt-4" onClick={handleCreateWorkflow}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first workflow
              </Button>
            </div>
          ) : (
            workflows.map((workflow) => (
              <div key={workflow.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{workflow.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="capitalize">{workflow.source_platform}</span>
                      <ArrowRight className="h-4 w-4 mx-2" />
                      <span>{workflow.target_platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWorkflowStatus(workflow.id, workflow.is_active)}
                    >
                      {workflow.is_active ? (
                        <Pause className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <Play className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${workflow.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-500">
                    {workflow.is_active ? 'Active - Monitoring for new videos' : 'Paused'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}