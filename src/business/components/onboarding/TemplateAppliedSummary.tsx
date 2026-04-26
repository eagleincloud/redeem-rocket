import React, { useState, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Zap,
  Boxes,
  Link2,
} from 'lucide-react';

export interface SetupTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  completed: boolean;
}

export interface TemplateAppliedSummaryProps {
  templateName?: string;
  templateDescription?: string;
  featuresCount?: number;
  automationsCount?: number;
  setupTasks?: SetupTask[];
  onStartSetup?: () => void;
  onGoToDashboard?: () => void;
  recommendedSteps?: string[];
}

const MOCK_SETUP_TASKS: SetupTask[] = [
  {
    id: 'api_key',
    title: 'Configure API Keys',
    description: 'Set up authentication keys for external service integrations',
    priority: 'high',
    estimatedTime: '10 min',
    completed: false,
  },
  {
    id: 'email_sync',
    title: 'Enable Email Synchronization',
    description: 'Connect your email account for real-time message syncing',
    priority: 'high',
    estimatedTime: '5 min',
    completed: false,
  },
  {
    id: 'webhooks',
    title: 'Set Up Webhooks',
    description: 'Configure webhook endpoints for real-time data updates',
    priority: 'medium',
    estimatedTime: '15 min',
    completed: false,
  },
  {
    id: 'notifications',
    title: 'Configure Notifications',
    description: 'Set up email and notification preferences for your team',
    priority: 'medium',
    estimatedTime: '8 min',
    completed: false,
  },
  {
    id: 'team_members',
    title: 'Invite Team Members',
    description: 'Add your team members and assign appropriate roles',
    priority: 'medium',
    estimatedTime: '10 min',
    completed: false,
  },
  {
    id: 'automation_rules',
    title: 'Create Automation Rules',
    description: 'Set up custom automation rules for your business workflows',
    priority: 'medium',
    estimatedTime: '20 min',
    completed: false,
  },
  {
    id: 'custom_fields',
    title: 'Add Custom Fields',
    description: 'Create custom fields to match your business data structure',
    priority: 'low',
    estimatedTime: '12 min',
    completed: false,
  },
  {
    id: 'data_migration',
    title: 'Migrate Existing Data',
    description: 'Import data from your previous system into the new template',
    priority: 'high',
    estimatedTime: '30 min',
    completed: false,
  },
  {
    id: 'training',
    title: 'Team Training Session',
    description: 'Conduct training for your team on the new system features',
    priority: 'medium',
    estimatedTime: '45 min',
    completed: false,
  },
  {
    id: 'monitoring',
    title: 'Set Up Monitoring & Alerts',
    description: 'Configure monitoring for system health and performance',
    priority: 'low',
    estimatedTime: '10 min',
    completed: false,
  },
];

const MOCK_RECOMMENDED_STEPS = [
  'Start with API Key configuration for third-party integrations',
  'Enable Email Synchronization to connect your communication channels',
  'Invite team members and assign roles for collaboration',
  'Create automation rules to streamline your workflows',
  'Run a test with sample data before full migration',
];

const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

interface SetupTaskItemProps {
  task: SetupTask;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

const SetupTaskItem: React.FC<SetupTaskItemProps> = ({
  task,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div className="border border-slate-600 rounded-lg overflow-hidden hover:border-slate-500 transition-all duration-200">
      <button
        onClick={() => onToggleExpand(task.id)}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-700/30 transition-all duration-200"
      >
        {/* Checkbox */}
        <div
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-slate-600 hover:border-slate-500'
          }`}
        >
          {task.completed && (
            <CheckCircle2 className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Task Info */}
        <div className="flex-1 text-left">
          <h4 className="font-semibold text-white">{task.title}</h4>
          <p className="text-sm text-slate-400 mt-0.5">
            {task.description}
          </p>
        </div>

        {/* Priority & Time */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            {task.estimatedTime}
          </div>
        </div>

        {/* Expand Arrow */}
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 py-4 bg-slate-700/20 border-t border-slate-600">
          <p className="text-sm text-slate-300 mb-4">{task.description}</p>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200">
            Start Task
          </button>
        </div>
      )}
    </div>
  );
};

const TemplateAppliedSummary: React.FC<TemplateAppliedSummaryProps> = ({
  templateName = 'Sales Pipeline',
  templateDescription = 'Comprehensive sales workflow with lead tracking, opportunity management, and deal closing automation',
  featuresCount = 24,
  automationsCount = 18,
  setupTasks = MOCK_SETUP_TASKS,
  onStartSetup,
  onGoToDashboard,
  recommendedSteps = MOCK_RECOMMENDED_STEPS,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleTaskExpand = useCallback((id: string) => {
    setExpandedTaskId(prev => (prev === id ? null : id));
  }, []);

  const completedTasks = setupTasks.filter(t => t.completed).length;
  const progressPercent = (completedTasks / setupTasks.length) * 100;

  const integrationsCount = 12;

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Celebration Section */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Template Applied Successfully!
              </h1>
              <p className="text-slate-300 max-w-xl mx-auto">
                {templateDescription}
              </p>
            </div>

            {/* What You Got Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                What You Got
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Features */}
                <div className="bg-slate-700/50 rounded-lg p-5 border border-slate-600">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/20">
                      <Zap className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-white">Features</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-400 mb-2">
                    {featuresCount}
                  </p>
                  <p className="text-sm text-slate-400">Ready-to-use features</p>
                </div>

                {/* Automations */}
                <div className="bg-slate-700/50 rounded-lg p-5 border border-slate-600">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-purple-500/20">
                      <Boxes className="h-5 w-5 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white">Automations</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-400 mb-2">
                    {automationsCount}
                  </p>
                  <p className="text-sm text-slate-400">
                    Workflow automations
                  </p>
                </div>

                {/* Integrations */}
                <div className="bg-slate-700/50 rounded-lg p-5 border border-slate-600">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-pink-500/20">
                      <Link2 className="h-5 w-5 text-pink-400" />
                    </div>
                    <h3 className="font-semibold text-white">Integrations</h3>
                  </div>
                  <p className="text-3xl font-bold text-pink-400 mb-2">
                    {integrationsCount}
                  </p>
                  <p className="text-sm text-slate-400">Connected platforms</p>
                </div>
              </div>

              {/* Included Items List */}
              <div className="mt-6 space-y-3 border-t border-slate-600 pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    Custom workflow templates
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    Role-based access control
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    Real-time collaboration tools
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">Advanced analytics & reporting</span>
                </div>
              </div>
            </div>

            {/* Setup Progress Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Setup Progress
              </h2>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-300">
                    {completedTasks} of {setupTasks.length} tasks completed
                  </p>
                  <p className="text-sm font-bold text-purple-400">
                    {Math.round(progressPercent)}%
                  </p>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {setupTasks.map(task => (
                  <SetupTaskItem
                    key={task.id}
                    task={task}
                    isExpanded={expandedTaskId === task.id}
                    onToggleExpand={handleTaskExpand}
                  />
                ))}
              </div>

              {/* Start Setup Button */}
              <button
                onClick={onStartSetup}
                className="w-full mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-5 w-5" />
                Start Setup Wizard
              </button>
            </div>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="font-bold text-white mb-4">Quick Stats</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Total Features
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {featuresCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Setup Time
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ~2-3 hours
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      Automations Ready
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {automationsCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended First Steps */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="font-bold text-white mb-4">
                  Recommended First Steps
                </h3>

                <ol className="space-y-3">
                  {recommendedSteps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm text-slate-300 pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Go to Dashboard Button */}
              <button
                onClick={onGoToDashboard}
                className="w-full px-6 py-3 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-5 w-5" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateAppliedSummary;
