import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, Edit2, Trash2, Eye, Copy } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'slack' | 'webhook';
  content: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export const TemplateManager: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Load templates from Supabase
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // TODO: Load from Supabase
      // const { data, error } = await supabase
      //   .from('automation_templates')
      //   .select('*')
      //   .order('created_at', { ascending: false });

      setTemplates([]);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      // TODO: Delete from Supabase
      setTemplates(templates.filter(t => t.id !== templateId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const newTemplate = {
        ...template,
        id: `template_${Date.now()}`,
        name: `${template.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // TODO: Save to Supabase
      setTemplates([newTemplate, ...templates]);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage reusable email templates</p>
          </div>
          <button
            onClick={() => navigate('/app/automation/templates/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            New Template
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading templates...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-4">Create your first email template to get started</p>
            <button
              onClick={() => navigate('/app/automation/templates/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {template.type.toUpperCase()}
                  </span>
                </div>

                {/* Template preview */}
                <div className="bg-gray-50 rounded p-3 mb-4 max-h-24 overflow-hidden">
                  <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
                </div>

                {/* Variables */}
                {template.variables.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="flex items-center gap-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition text-sm"
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                  <button
                    onClick={() => navigate(`/app/automation/templates/${template.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition text-sm"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="flex items-center gap-1 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded transition text-sm"
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(template.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>

                {/* Delete confirmation */}
                {showDeleteConfirm === template.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex items-center justify-between">
                    <p className="text-sm text-red-800">Delete this template?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{selectedTemplate.name}</h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Description:</p>
                <p className="text-gray-900">{selectedTemplate.description}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Content:</p>
                <div className="bg-gray-50 rounded p-4 whitespace-pre-wrap text-sm text-gray-900 font-mono">
                  {selectedTemplate.content}
                </div>
              </div>
              {selectedTemplate.variables.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded font-mono"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
