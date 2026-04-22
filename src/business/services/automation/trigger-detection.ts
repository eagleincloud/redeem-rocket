/**
 * Real-time Trigger Detection System
 * Monitors business events and triggers automation rules via Supabase real-time subscriptions
 * Supports lead events, email tracking, and stage changes
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type EventType =
  | 'lead_added'
  | 'email_opened'
  | 'email_clicked'
  | 'lead_qualified'
  | 'stage_changed'
  | 'inactivity_30d';

export interface EventListener {
  (data: any): void | Promise<void>;
}

export interface TriggerEventData {
  lead_added?: {
    leadId: string;
    name: string;
    email: string;
    company: string;
    source: string;
  };
  email_opened?: {
    leadId: string;
    emailId: string;
    templateId: string;
    timestamp: string;
  };
  email_clicked?: {
    leadId: string;
    emailId: string;
    templateId: string;
    clickedUrl: string;
    timestamp: string;
  };
  lead_qualified?: {
    leadId: string;
    previousStage: string;
    newStage: string;
    timestamp: string;
  };
  stage_changed?: {
    leadId: string;
    previousStage: string;
    newStage: string;
    timestamp: string;
  };
  inactivity_30d?: {
    leadId: string;
    daysSinceUpdate: number;
    lastActivity: string;
  };
}

interface SubscriptionState {
  channel: RealtimeChannel | null;
  listeners: Set<EventListener>;
  isActive: boolean;
}

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER DETECTION SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class TriggerDetectionService {
  private businessId: string = '';
  private eventListeners: Map<EventType, Set<EventListener>> = new Map();
  private subscriptions: Map<string, SubscriptionState> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private retryConfig: RetryConfig = {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  };
  private initialized: boolean = false;
  private unsubscribeCallbacks: Array<() => void> = [];

  /**
   * Initialize the trigger detection service for a business
   */
  async init(businessId: string): Promise<void> {
    if (!supabase) {
      console.warn('Supabase client not available');
      return;
    }

    if (this.initialized && this.businessId === businessId) {
      return;
    }

    this.businessId = businessId;

    try {
      // Subscribe to all required events
      await Promise.all([
        this.subscribeToLeadEvents(),
        this.subscribeToEmailTrackingEvents(),
        this.subscribeToLeadStageChanges(),
      ]);

      this.initialized = true;
      console.log(`[TriggerDetection] Initialized for business ${businessId}`);
    } catch (error) {
      console.error('[TriggerDetection] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to lead_added events
   */
  private async subscribeToLeadEvents(): Promise<void> {
    if (!supabase || !this.businessId) return;

    const channelName = `leads:${this.businessId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          filter: `business_id=eq.${this.businessId}`,
        },
        (payload: any) => {
          this.handleLeadAdded(payload.new);
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(channelName, status);
      });

    this.subscriptions.set(channelName, {
      channel,
      listeners: new Set(),
      isActive: false,
    });

    this.unsubscribeCallbacks.push(() => {
      supabase.removeChannel(channel);
    });
  }

  /**
   * Subscribe to email tracking events
   */
  private async subscribeToEmailTrackingEvents(): Promise<void> {
    if (!supabase || !this.businessId) return;

    const channelName = `email_tracking:${this.businessId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'email_tracking',
          filter: `business_id=eq.${this.businessId}`,
        },
        (payload: any) => {
          this.handleEmailTrackingUpdate(payload.new, payload.old);
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(channelName, status);
      });

    this.subscriptions.set(channelName, {
      channel,
      listeners: new Set(),
      isActive: false,
    });

    this.unsubscribeCallbacks.push(() => {
      supabase.removeChannel(channel);
    });
  }

  /**
   * Subscribe to lead stage changes
   */
  private async subscribeToLeadStageChanges(): Promise<void> {
    if (!supabase || !this.businessId) return;

    const channelName = `leads_stage:${this.businessId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `business_id=eq.${this.businessId}`,
        },
        (payload: any) => {
          this.handleLeadStageChange(payload.new, payload.old);
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(channelName, status);
      });

    this.subscriptions.set(channelName, {
      channel,
      listeners: new Set(),
      isActive: false,
    });

    this.unsubscribeCallbacks.push(() => {
      supabase.removeChannel(channel);
    });
  }

  /**
   * Handle subscription status changes
   */
  private handleSubscriptionStatus(
    channelName: string,
    status: string
  ): void {
    const subscription = this.subscriptions.get(channelName);
    if (!subscription) return;

    if (status === 'SUBSCRIBED') {
      subscription.isActive = true;
      this.retryAttempts.delete(channelName);
      console.log(`[TriggerDetection] Subscribed to ${channelName}`);
    } else if (status === 'CLOSED') {
      subscription.isActive = false;
      this.retrySubscription(channelName);
    } else if (status === 'CHANNEL_ERROR') {
      subscription.isActive = false;
      console.error(`[TriggerDetection] Channel error on ${channelName}`);
      this.retrySubscription(channelName);
    }
  }

  /**
   * Retry subscription with exponential backoff
   */
  private retrySubscription(channelName: string): void {
    const attempts = this.retryAttempts.get(channelName) || 0;

    if (attempts >= this.retryConfig.maxRetries) {
      console.error(
        `[TriggerDetection] Max retries reached for ${channelName}`
      );
      return;
    }

    const delayMs = Math.min(
      this.retryConfig.initialDelayMs *
        Math.pow(this.retryConfig.backoffMultiplier, attempts),
      this.retryConfig.maxDelayMs
    );

    this.retryAttempts.set(channelName, attempts + 1);

    setTimeout(() => {
      const subscription = this.subscriptions.get(channelName);
      if (subscription?.channel) {
        subscription.channel.subscribe((status) => {
          this.handleSubscriptionStatus(channelName, status);
        });
      }
    }, delayMs);
  }

  /**
   * Handle lead_added event
   */
  private handleLeadAdded(lead: any): void {
    const eventData = {
      leadId: lead.id,
      name: lead.name || '',
      email: lead.email || '',
      company: lead.company || '',
      source: lead.source || 'unknown',
    };

    this.emit('lead_added', eventData);
  }

  /**
   * Handle email tracking updates
   */
  private handleEmailTrackingUpdate(newData: any, oldData: any): void {
    // Check for email opened
    if (newData.opened && !oldData?.opened) {
      const eventData = {
        leadId: newData.lead_id,
        emailId: newData.id,
        templateId: newData.template_id,
        timestamp: new Date().toISOString(),
      };
      this.emit('email_opened', eventData);
    }

    // Check for email clicked
    if (
      newData.clicked_links &&
      JSON.stringify(newData.clicked_links) !==
        JSON.stringify(oldData?.clicked_links)
    ) {
      const clickedUrls = Array.isArray(newData.clicked_links)
        ? newData.clicked_links
        : [];

      for (const url of clickedUrls) {
        const eventData = {
          leadId: newData.lead_id,
          emailId: newData.id,
          templateId: newData.template_id,
          clickedUrl: url,
          timestamp: new Date().toISOString(),
        };
        this.emit('email_clicked', eventData);
      }
    }
  }

  /**
   * Handle lead stage changes
   */
  private handleLeadStageChange(newData: any, oldData: any): void {
    if (newData.stage === oldData?.stage) {
      return;
    }

    const previousStage = oldData?.stage || 'unknown';
    const newStage = newData.stage || 'unknown';

    const baseEventData = {
      leadId: newData.id,
      previousStage,
      newStage,
      timestamp: new Date().toISOString(),
    };

    // Always emit stage_changed
    this.emit('stage_changed', baseEventData);

    // Emit lead_qualified if moving to qualified stage
    if (newStage === 'qualified') {
      this.emit('lead_qualified', baseEventData);
    }
  }

  /**
   * Register an event listener for a specific event type
   */
  on(eventType: EventType, callback: EventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  /**
   * Unregister an event listener
   */
  off(eventType: EventType, callback: EventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit an event manually (for testing or programmatic triggers)
   */
  emit(eventType: EventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        const result = listener(data);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(
              `[TriggerDetection] Error in listener for ${eventType}:`,
              error
            );
          });
        }
      } catch (error) {
        console.error(
          `[TriggerDetection] Error in listener for ${eventType}:`,
          error
        );
      }
    }
  }

  /**
   * Subscribe to a specific trigger with a handler
   */
  subscribe(
    trigger: EventType,
    handler: EventListener
  ): () => void {
    this.on(trigger, handler);

    // Return unsubscribe function
    return () => {
      this.off(trigger, handler);
    };
  }

  /**
   * Get current initialization state
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current business ID
   */
  getBusinessId(): string {
    return this.businessId;
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionCount(): number {
    let count = 0;
    for (const subscription of this.subscriptions.values()) {
      if (subscription.isActive) count++;
    }
    return count;
  }

  /**
   * Cleanup and unsubscribe from all events
   */
  cleanup(): void {
    // Unsubscribe from all channels
    for (const { channel } of this.subscriptions.values()) {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    }

    // Execute cleanup callbacks
    for (const callback of this.unsubscribeCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('[TriggerDetection] Error during cleanup:', error);
      }
    }

    // Clear all state
    this.subscriptions.clear();
    this.eventListeners.clear();
    this.unsubscribeCallbacks = [];
    this.retryAttempts.clear();
    this.businessId = '';
    this.initialized = false;
  }

  /**
   * Reset service state while keeping business context
   */
  reset(): void {
    this.eventListeners.clear();
    this.retryAttempts.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

let serviceInstance: TriggerDetectionService | null = null;

/**
 * Get singleton instance of TriggerDetectionService
 */
export function getTriggerDetectionService(): TriggerDetectionService {
  if (!serviceInstance) {
    serviceInstance = new TriggerDetectionService();
  }
  return serviceInstance;
}

/**
 * Reset service instance (useful for testing)
 */
export function resetTriggerDetectionService(): void {
  if (serviceInstance) {
    serviceInstance.cleanup();
    serviceInstance = null;
  }
}
