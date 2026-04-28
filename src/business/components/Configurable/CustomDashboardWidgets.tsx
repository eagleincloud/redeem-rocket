/**
 * CustomDashboardWidgets Component
 * Widget system for custom dashboards
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Eye, EyeOff } from 'lucide-react';

interface Widget {
  id: string;
  title: string;
  widgetType: string;
  position: number;
  isVisible: boolean;
  fieldId?: string;
  size: 'small' | 'medium' | 'large' | 'full';
}

interface Props {
  fields: any[];
  widgets: Widget[];
  onWidgetsChange?: (widgets: Widget[]) => void;
  onWidgetAdd?: () => void;
  onWidgetEdit?: (widget: Widget) => void;
  onWidgetDelete?: (widgetId: string) => void;
  isLoading?: boolean;
}

const WIDGET_TYPES = {
  metric: 'Metric',
  chart: 'Chart',
  table: 'Table',
  gauge: 'Gauge',
  pie: 'Pie Chart',
  timeline: 'Timeline',
};

const SIZE_GRID_CLASS: Record<string, string> = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-3',
  full: 'col-span-4',
};

export const CustomDashboardWidgets: React.FC<Props> = ({
  fields,
  widgets,
  onWidgetsChange,
  onWidgetAdd,
  onWidgetEdit,
  onWidgetDelete,
  isLoading = false,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleToggleVisibility = (widgetId: string) => {
    const updated = widgets.map(w =>
      w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
    );
    onWidgetsChange?.(updated);
  };

  const stats = {
    total: widgets.length,
    visible: widgets.filter(w => w.isVisible).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dashboard Widgets</h3>
          <p className="text-sm text-gray-500 mt-1">
            {stats.visible} visible • {stats.total} total
          </p>
        </div>
        <button
          onClick={onWidgetAdd}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Widget
        </button>
      </div>

      {widgets.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 border-2 border-dashed rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">No Widgets</h4>
          <p className="text-gray-600 mb-4">Create widgets to visualize your data</p>
          <button
            onClick={onWidgetAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Create Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {widgets.map(widget => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => setDraggingId(widget.id)}
              onDragEnd={() => setDraggingId(null)}
              className={`${SIZE_GRID_CLASS[widget.size]} bg-white border-2 rounded-lg p-4 ${
                !widget.isVisible ? 'opacity-50 border-dashed' : 'border-gray-200'
              } ${draggingId === widget.id ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{widget.title}</h4>
                  <p className="text-xs text-gray-500">{WIDGET_TYPES[widget.widgetType as keyof typeof WIDGET_TYPES]}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleVisibility(widget.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {widget.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => onWidgetEdit?.(widget)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onWidgetDelete?.(widget.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded h-24 flex items-center justify-center">
                <p className="text-gray-500">Widget Preview</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 border-t pt-6">
        {Object.entries(WIDGET_TYPES).map(([key, label]) => (
          <div key={key} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium text-blue-900">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomDashboardWidgets;
