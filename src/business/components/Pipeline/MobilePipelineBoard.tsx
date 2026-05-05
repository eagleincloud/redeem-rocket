import React, { useRef, useState } from 'react';
import { useMobileView, useHorizontalScroll } from '../../hooks/useMobileView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  leads: any[];
  count: number;
}

interface MobilePipelineBoardProps {
  stages: PipelineStage[];
  onAddLead?: (stageId: string) => void;
  onLeadClick?: (leadId: string) => void;
  onMoveLead?: (leadId: string, toStageId: string) => void;
}

/**
 * Mobile-responsive pipeline board using horizontal scroll
 * Each stage is a full-width column that can be swiped through
 */
export function MobilePipelineBoard({
  stages,
  onAddLead,
  onLeadClick,
  onMoveLead,
}: MobilePipelineBoardProps) {
  const { isMobile } = useMobileView();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useHorizontalScroll(scrollRef, (scrollLeft) => {
    const index = Math.round(
      scrollLeft / (scrollRef.current?.offsetWidth || 400)
    );
    setCurrentStageIndex(index);
  });

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const scrollAmount = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!isMobile) {
    return (
      <div className="text-center text-muted-foreground">
        This component is optimized for mobile devices.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stage Progress */}
      <div className="flex items-center justify-between px-4">
        <span className="text-sm font-medium text-foreground">
          Stage {currentStageIndex + 1} of {stages.length}
        </span>
        <span className="text-xs text-muted-foreground">
          {stages[currentStageIndex]?.name}
        </span>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2 px-4">
        {stages.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-all ${
              index === currentStageIndex ? 'bg-primary' : 'bg-secondary'
            }`}
          />
        ))}
      </div>

      {/* Scrollable Pipeline Container */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto snap-x snap-mandatory scrollbar-hide flex gap-4 px-4 pb-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {stages.map((stage) => (
            <MobileStageColumn
              key={stage.id}
              stage={stage}
              onAddLead={onAddLead}
              onLeadClick={onLeadClick}
              onMoveLead={onMoveLead}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        {currentStageIndex > 0 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-r-lg"
            aria-label="Previous stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {currentStageIndex < stages.length - 1 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-l-lg"
            aria-label="Next stage"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Individual stage column for mobile
 */
function MobileStageColumn({
  stage,
  onAddLead,
  onLeadClick,
  onMoveLead,
}: {
  stage: PipelineStage;
  onAddLead?: (stageId: string) => void;
  onLeadClick?: (leadId: string) => void;
  onMoveLead?: (leadId: string, toStageId: string) => void;
}) {
  return (
    <div className="min-w-full snap-center px-2">
      <Card className="flex flex-col gap-4 p-4 h-full bg-gradient-to-b from-secondary/50 to-secondary/30">
        {/* Stage Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <div>
              <h3 className="font-semibold text-foreground">{stage.name}</h3>
              <p className="text-xs text-muted-foreground">{stage.count}</p>
            </div>
          </div>
          {onAddLead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddLead(stage.id)}
              className="h-8 w-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Leads List */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[60vh]">
          {stage.leads.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              No leads yet
            </div>
          ) : (
            stage.leads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onLeadClick?.(lead.id)}
                className="p-3 rounded-lg bg-card border border-border cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium text-sm text-foreground line-clamp-1">
                    {lead.name}
                  </h4>
                  {lead.email && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {lead.email}
                    </p>
                  )}
                  {lead.deal_value && (
                    <p className="text-xs font-semibold text-primary">
                      ${lead.deal_value.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export default MobilePipelineBoard;
