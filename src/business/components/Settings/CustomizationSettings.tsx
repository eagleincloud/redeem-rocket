/**
 * CustomizationSettings Page
 * Phase 4: Complete settings for business customization
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { CustomFieldsManager } from '../Configurable/CustomFieldsManager';
import PipelineStageEditor from '../Configurable/PipelineStageEditor';
import { PermissionMatrix } from '../Configurable/PermissionMatrix';
import { Settings, Users, Layers, Lock } from 'lucide-react';

interface CustomizationSettingsProps {
  businessId: string;
}

interface Role {
  id: string;
  name: string;
  is_system: boolean;
  permissions: any[];
}

export const CustomizationSettings: React.FC<CustomizationSettingsProps> = ({
  businessId,
}) => {
  const [activeTab, setActiveTab] = useState('fields');
  const [roles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      is_system: true,
      permissions: [],
    },
    {
      id: '2',
      name: 'Manager',
      is_system: true,
      permissions: [],
    },
    {
      id: '3',
      name: 'Team Member',
      is_system: true,
      permissions: [],
    },
    {
      id: '4',
      name: 'Viewer',
      is_system: true,
      permissions: [],
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-white border-opacity-10 pb-6">
        <h1 className="text-3xl font-bold text-white">Customization Settings</h1>
        <p className="mt-2 text-white text-opacity-70">
          Customize fields, pipelines, and permissions without code
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Fields</span>
          </TabsTrigger>
          <TabsTrigger value="pipelines" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Pipelines</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
        </TabsList>

        {/* Custom Fields Tab */}
        <TabsContent value="fields" className="mt-6 space-y-6">
          <div className="bg-white bg-opacity-8 backdrop-blur-xl rounded-xl border border-white border-opacity-15 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Custom Fields</h2>
              <p className="mt-1 text-white text-opacity-70">
                Add custom fields to your leads, contacts, deals, and other entities.
                Fields are tailored to your business needs.
              </p>
            </div>

            <CustomFieldsManager businessId={businessId} />
          </div>
        </TabsContent>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="mt-6 space-y-6">
          <div className="bg-white bg-opacity-8 backdrop-blur-xl rounded-xl border border-white border-opacity-15 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Pipeline Stages</h2>
              <p className="mt-1 text-white text-opacity-70">
                Customize your sales pipeline stages. Add stages, change colors, and
                configure what fields are required at each stage.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white text-opacity-90 mb-2">
                  Select Pipeline
                </label>
                <select className="w-full px-3 py-2 border border-white border-opacity-15 rounded-lg bg-white bg-opacity-8 backdrop-blur-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                  <option>Sales Pipeline</option>
                  <option>Support Pipeline</option>
                  <option>Custom Pipeline</option>
                </select>
              </div>

              <PipelineStageEditor
                businessId={businessId}
                pipelineId="sales-pipeline"
                stages={[
                  {
                    id: '1',
                    stageName: 'Lead',
                    stageOrder: 0,
                    stageColor: '#3b82f6',
                    isTerminalStage: false,
                    canSkipStage: false,
                  },
                  {
                    id: '2',
                    stageName: 'Opportunity',
                    stageOrder: 1,
                    stageColor: '#8b5cf6',
                    isTerminalStage: false,
                    canSkipStage: true,
                  },
                  {
                    id: '3',
                    stageName: 'Proposal',
                    stageOrder: 2,
                    stageColor: '#f59e0b',
                    isTerminalStage: false,
                    canSkipStage: true,
                  },
                  {
                    id: '4',
                    stageName: 'Won',
                    stageOrder: 3,
                    stageColor: '#10b981',
                    isTerminalStage: true,
                    canSkipStage: false,
                  },
                ]}
                onSave={() => {}}
                onCancel={() => {}}
              />
            </div>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="mt-6 space-y-6">
          <div className="bg-white bg-opacity-8 backdrop-blur-xl rounded-xl border border-white border-opacity-15 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                Role Permissions
              </h2>
              <p className="mt-1 text-white text-opacity-70">
                Control what different roles can do in your account. Set up granular
                permissions for each entity type (leads, deals, invoices, etc.).
              </p>
            </div>

            <PermissionMatrix businessId={businessId} roles={roles} />
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-6 space-y-6">
          <div className="bg-white bg-opacity-8 backdrop-blur-xl rounded-xl border border-white border-opacity-15 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Team Members</h2>
              <p className="mt-1 text-white text-opacity-70">
                Manage team members and assign them to roles. You can also override
                permissions for specific users.
              </p>
            </div>

            <div className="space-y-4">
              {/* Team Members List */}
              <div className="border border-white border-opacity-15 rounded-lg overflow-hidden">
                <div className="bg-white bg-opacity-5 p-4 border-b border-white border-opacity-10">
                  <div className="grid grid-cols-4 gap-4 font-semibold text-sm text-white text-opacity-90">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Actions</div>
                  </div>
                </div>

                <div className="space-y-0">
                  {[
                    {
                      id: '1',
                      name: 'John Doe',
                      email: 'john@example.com',
                      role: 'Admin',
                    },
                    {
                      id: '2',
                      name: 'Jane Smith',
                      email: 'jane@example.com',
                      role: 'Manager',
                    },
                    {
                      id: '3',
                      name: 'Bob Johnson',
                      email: 'bob@example.com',
                      role: 'Team Member',
                    },
                  ].map((member) => (
                    <div
                      key={member.id}
                      className="p-4 border-t border-white border-opacity-10 hover:bg-white hover:bg-opacity-10 transition-colors"
                    >
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div className="font-medium text-white">
                          {member.name}
                        </div>
                        <div className="text-white text-opacity-70">{member.email}</div>
                        <div>
                          <span className="px-2 py-1 bg-orange-500 bg-opacity-20 text-orange-200 text-sm rounded border border-orange-500 border-opacity-30">
                            {member.role}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm text-orange-400 hover:bg-orange-500 hover:bg-opacity-20 rounded border border-orange-500 border-opacity-30 transition-colors">
                            Edit
                          </button>
                          <button className="px-3 py-1 text-sm text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded border border-red-500 border-opacity-30 transition-colors">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-lg hover:shadow-orange-500/30">
                Add Team Member
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <div className="bg-orange-500 bg-opacity-15 border border-orange-500 border-opacity-30 rounded-lg p-6 backdrop-blur-xl">
        <h3 className="font-semibold text-orange-200 mb-2">Need Help?</h3>
        <p className="text-orange-100 text-sm">
          These settings help you customize your system without writing code. Changes
          take effect immediately for all team members.
        </p>
      </div>
    </div>
  );
};

CustomizationSettings.displayName = 'CustomizationSettings';
