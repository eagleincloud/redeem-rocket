import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';

export interface LeadFilterOptions {
  search: string;
  stage: string[];
  priority: string[];
  source: string[];
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface LeadFiltersProps {
  filters: LeadFilterOptions;
  onFiltersChange: (filters: LeadFilterOptions) => void;
  onReset: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const STAGES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'referral', label: 'Referral' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'manual', label: 'Manual' },
];

const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  isOpen = true,
  onClose,
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStageToggle = (stage: string) => {
    const newStages = filters.stage.includes(stage)
      ? filters.stage.filter((s) => s !== stage)
      : [...filters.stage, stage];
    onFiltersChange({ ...filters, stage: newStages });
  };

  const handlePriorityToggle = (priority: string) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ ...filters, priority: newPriorities });
  };

  const handleSourceToggle = (source: string) => {
    const newSources = filters.source.includes(source)
      ? filters.source.filter((s) => s !== source)
      : [...filters.source, source];
    onFiltersChange({ ...filters, source: newSources });
  };

  const activeFilterCount = [
    filters.search ? 1 : 0,
    filters.stage.length,
    filters.priority.length,
    filters.source.length,
    filters.dateRange !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={onClose}>
        Show Filters {activeFilterCount > 0 && <span>({activeFilterCount})</span>}
      </Button>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <CardTitle className="text-lg">Filter Leads</CardTitle>
          <CardDescription>Narrow down your search</CardDescription>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-0 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <CardContent className="p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stage Filter */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground">
            Lead Stage
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STAGES.map((stage) => (
              <label
                key={stage.value}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  filters.stage.includes(stage.value)
                    ? 'bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-secondary'
                }`}
              >
                <Checkbox
                  checked={filters.stage.includes(stage.value)}
                  onCheckedChange={() => handleStageToggle(stage.value)}
                />
                <span className="text-sm text-muted-foreground">
                  {stage.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground">
            Priority
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRIORITIES.map((priority) => (
              <label
                key={priority.value}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  filters.priority.includes(priority.value)
                    ? 'bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-secondary'
                }`}
              >
                <Checkbox
                  checked={filters.priority.includes(priority.value)}
                  onCheckedChange={() => handlePriorityToggle(priority.value)}
                />
                <span className="text-sm text-muted-foreground">
                  {priority.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Source Filter */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground">
            Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SOURCES.map((source) => (
              <label
                key={source.value}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  filters.source.includes(source.value)
                    ? 'bg-blue-50 dark:bg-blue-950'
                    : 'hover:bg-secondary'
                }`}
              >
                <Checkbox
                  checked={filters.source.includes(source.value)}
                  onCheckedChange={() => handleSourceToggle(source.value)}
                />
                <span className="text-sm text-muted-foreground">
                  {source.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-foreground">
            Created
          </label>
          <Select value={filters.dateRange} onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" className="w-full" onClick={onReset}>
            Clear All Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
