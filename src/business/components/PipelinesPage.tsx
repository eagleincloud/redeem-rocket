/**
 * PipelinesPage Component
 * Main pipeline management interface with pipeline selection and board display
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PipelineBoard from './Pipeline/PipelineBoard';
import PipelineStats from './Pipeline/PipelineStats';
import './PipelinesPage.css';

interface Pipeline {
  id: string;
  name: string;
  pipeline_type: string;
  stages: Array<{ id: number; name: string; color: string; order: number }>;
  total_entities: number;
  is_active: boolean;
}

const PipelinesPage: React.FC = () => {
  const { id: pipelineId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [createMode, setCreateMode] = useState(false);
  const [newPipelineData, setNewPipelineData] = useState({
    name: '',
    pipeline_type: 'custom',
  });

  // Load pipelines
  useEffect(() => {
    loadPipelines();
  }, []);

  // Select pipeline from URL
  useEffect(() => {
    if (pipelineId && pipelines.length > 0) {
      const found = pipelines.find((p) => p.id === pipelineId);
      if (found) {
        setSelectedPipeline(found);
      }
    } else if (pipelines.length > 0 && !selectedPipeline) {
      setSelectedPipeline(pipelines[0]);
    }
  }, [pipelineId, pipelines, selectedPipeline]);

  const loadPipelines = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const mockPipelines: Pipeline[] = [
        {
          id: '1',
          name: 'Lead Sales Pipeline',
          pipeline_type: 'lead',
          stages: [
            { id: 1, name: 'Prospect', color: '#3B82F6', order: 1 },
            { id: 2, name: 'Qualified', color: '#8B5CF6', order: 2 },
            { id: 3, name: 'Negotiation', color: '#F59E0B', order: 3 },
            { id: 4, name: 'Won', color: '#10B981', order: 4 },
            { id: 5, name: 'Lost', color: '#EF4444', order: 5 },
          ],
          total_entities: 24,
          is_active: true,
        },
        {
          id: '2',
          name: 'Marketing Campaigns',
          pipeline_type: 'marketing',
          stages: [
            { id: 1, name: 'Planning', color: '#06B6D4', order: 1 },
            { id: 2, name: 'Launch', color: '#0EA5E9', order: 2 },
            { id: 3, name: 'Active', color: '#2563EB', order: 3 },
            { id: 4, name: 'Complete', color: '#10B981', order: 4 },
          ],
          total_entities: 8,
          is_active: true,
        },
      ];

      setPipelines(mockPipelines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  const handlePipelineSelect = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    navigate(`/app/pipelines/${pipeline.id}`);
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineData.name.trim()) {
      setError('Pipeline name is required');
      return;
    }

    try {
      // TODO: Replace with actual API call
      const newPipeline: Pipeline = {
        id: `p-${Date.now()}`,
        name: newPipelineData.name,
        pipeline_type: newPipelineData.pipeline_type,
        stages: getDefaultStages(newPipelineData.pipeline_type),
        total_entities: 0,
        is_active: true,
      };

      setPipelines([...pipelines, newPipeline]);
      setNewPipelineData({ name: '', pipeline_type: 'custom' });
      setCreateMode(false);
      handlePipelineSelect(newPipeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pipeline');
    }
  };

  const getDefaultStages = (type: string) => {
    const stageMap: Record<string, any[]> = {
      lead: [
        { id: 1, name: 'Prospect', color: '#3B82F6', order: 1 },
        { id: 2, name: 'Qualified', color: '#8B5CF6', order: 2 },
        { id: 3, name: 'Negotiation', color: '#F59E0B', order: 3 },
        { id: 4, name: 'Won', color: '#10B981', order: 4 },
        { id: 5, name: 'Lost', color: '#EF4444', order: 5 },
      ],
      marketing: [
        { id: 1, name: 'Planning', color: '#06B6D4', order: 1 },
        { id: 2, name: 'Launch', color: '#0EA5E9', order: 2 },
        { id: 3, name: 'Active', color: '#2563EB', order: 3 },
        { id: 4, name: 'Complete', color: '#10B981', order: 4 },
      ],
      retention: [
        { id: 1, name: 'Active', color: '#10B981', order: 1 },
        { id: 2, name: 'At Risk', color: '#F59E0B', order: 2 },
        { id: 3, name: 'Churned', color: '#EF4444', order: 3 },
      ],
      support: [
        { id: 1, name: 'Open', color: '#3B82F6', order: 1 },
        { id: 2, name: 'In Progress', color: '#F59E0B', order: 2 },
        { id: 3, name: 'Resolved', color: '#10B981', order: 3 },
      ],
      custom: [{ id: 1, name: 'Stage 1', color: '#9CA3AF', order: 1 }],
    };

    return stageMap[type] || stageMap.custom;
  };

  if (loading) {
    return (
      <div className="pipelines-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading pipelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pipelines-page">
      <div className="pipelines-container">
        {/* Sidebar */}
        <div className="pipelines-sidebar">
          <div className="sidebar-header">
            <h2>Pipelines</h2>
            <button
              className="btn-create"
              onClick={() => setCreateMode(!createMode)}
              title="Create new pipeline"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New
            </button>
          </div>

          {/* Create Pipeline Form */}
          {createMode && (
            <div className="create-pipeline-form">
              <input
                type="text"
                placeholder="Pipeline name"
                value={newPipelineData.name}
                onChange={(e) => setNewPipelineData({ ...newPipelineData, name: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreatePipeline();
                }}
              />
              <select
                value={newPipelineData.pipeline_type}
                onChange={(e) => setNewPipelineData({ ...newPipelineData, pipeline_type: e.target.value })}
              >
                <option value="lead">Lead Pipeline</option>
                <option value="marketing">Marketing Pipeline</option>
                <option value="retention">Retention Pipeline</option>
                <option value="support">Support Pipeline</option>
                <option value="custom">Custom Pipeline</option>
              </select>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleCreatePipeline}>
                  Create
                </button>
                <button className="btn-secondary" onClick={() => setCreateMode(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Pipeline List */}
          <div className="pipelines-list">
            {pipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className={`pipeline-item ${selectedPipeline?.id === pipeline.id ? 'active' : ''}`}
                onClick={() => handlePipelineSelect(pipeline)}
              >
                <div className="pipeline-item-content">
                  <div className="pipeline-name">{pipeline.name}</div>
                  <div className="pipeline-type">{pipeline.pipeline_type}</div>
                </div>
                <div className="pipeline-count">{pipeline.total_entities}</div>
              </div>
            ))}
          </div>

          {pipelines.length === 0 && !createMode && (
            <div className="empty-state">
              <p>No pipelines yet</p>
              <button onClick={() => setCreateMode(true)} className="btn-link">
                Create your first pipeline
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="pipelines-main">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          {selectedPipeline ? (
            <>
              {/* Header */}
              <div className="pipeline-header">
                <div>
                  <h1>{selectedPipeline.name}</h1>
                  <p className="pipeline-description">
                    {selectedPipeline.stages.length} stages · {selectedPipeline.total_entities} entities
                  </p>
                </div>
                <div className="header-actions">
                  <button
                    className={`btn-toggle ${showStats ? 'active' : ''}`}
                    onClick={() => setShowStats(!showStats)}
                    title="Toggle statistics"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="2" x2="12" y2="22"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h.5M7 13H3.5a3.5 3.5 0 0 0 0 7H7"></path>
                    </svg>
                    Stats
                  </button>
                </div>
              </div>

              {/* Stats Section */}
              {showStats && (
                <div className="stats-section">
                  <PipelineStats
                    metrics={null}
                    stages={selectedPipeline.stages}
                    loading={false}
                  />
                </div>
              )}

              {/* Kanban Board */}
              <div className="kanban-section">
                <PipelineBoard pipelineId={selectedPipeline.id} />
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a pipeline to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelinesPage;
