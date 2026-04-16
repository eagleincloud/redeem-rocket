import { create } from 'zustand'
import { supabase } from '../services/supabase'
import type {
  Lead,
  EmailSequence,
  AutomationRule,
  SocialAccount,
  EmailProviderConfig,
  LeadConnector,
  GrowthStats,
  LeadFilter,
} from '../types/growth-platform'

interface GrowthState {
  // Data
  leads: Lead[]
  sequences: EmailSequence[]
  rules: AutomationRule[]
  socialAccounts: SocialAccount[]
  providers: EmailProviderConfig[]
  connectors: LeadConnector[]
  stats: GrowthStats | null

  // UI State
  isLoading: boolean
  error: string | null
  selectedLeadId: string | null
  filters: LeadFilter

  // Actions
  fetchStats: () => Promise<void>
  fetchLeads: (filters?: LeadFilter) => Promise<void>
  fetchSequences: () => Promise<void>
  fetchRules: () => Promise<void>
  fetchSocialAccounts: () => Promise<void>
  fetchProviders: () => Promise<void>
  fetchConnectors: () => Promise<void>

  setSelectedLeadId: (id: string | null) => void
  setFilters: (filters: LeadFilter) => void
  clearError: () => void
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  // Initial state
  leads: [],
  sequences: [],
  rules: [],
  socialAccounts: [],
  providers: [],
  connectors: [],
  stats: null,
  isLoading: false,
  error: null,
  selectedLeadId: null,
  filters: {},

  // Fetch stats
  fetchStats: async () => {
    set({ isLoading: true, error: null })
    try {
      const [leadsRes, sequencesRes, rulesRes, accountsRes] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact' }).limit(0),
        supabase.from('email_sequences').select('*', { count: 'exact' }).limit(0),
        supabase.from('automation_rules').select('*', { count: 'exact' }).limit(0),
        supabase.from('social_accounts').select('*'),
      ])

      const totalLeads = leadsRes.count || 0
      const totalSequences = sequencesRes.count || 0
      const totalRules = rulesRes.count || 0
      const totalAccounts = accountsRes.data?.length || 0

      // Fetch detailed stats
      const [newLeadsRes, wonLeadsRes, activeProviersRes] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact' }).eq('stage', 'new').limit(0),
        supabase.from('leads').select('*', { count: 'exact' }).eq('stage', 'won').limit(0),
        supabase.from('email_provider_configs').select('*', { count: 'exact' }).eq('is_active', true).limit(0),
      ])

      set({
        stats: {
          totalLeads,
          newLeads: newLeadsRes.count || 0,
          qualifiedLeads: 0, // Would calculate from stage = 'qualified'
          wonLeads: wonLeadsRes.count || 0,
          lostLeads: 0,
          totalEmailsSent: 0,
          emailOpenRate: 0,
          emailClickRate: 0,
          activeRules: totalRules,
          automationTriggered: 0,
          connectedSocialAccounts: totalAccounts,
          socialPostsPublished: 0,
        },
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
        isLoading: false,
      })
    }
  },

  // Fetch leads
  fetchLeads: async (filters?: LeadFilter) => {
    set({ isLoading: true, error: null })
    try {
      let query = supabase.from('leads').select('*')

      if (filters?.stage) {
        query = query.eq('stage', filters.stage)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.source) {
        query = query.eq('source', filters.source)
      }
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      set({ leads: data || [], isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch leads',
        isLoading: false,
      })
    }
  },

  // Fetch sequences
  fetchSequences: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('email_sequences')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ sequences: data || [], isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sequences',
        isLoading: false,
      })
    }
  },

  // Fetch rules
  fetchRules: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ rules: data || [], isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch rules',
        isLoading: false,
      })
    }
  },

  // Fetch social accounts
  fetchSocialAccounts: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ socialAccounts: data || [], isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch social accounts',
        isLoading: false,
      })
    }
  },

  // Fetch providers
  fetchProviders: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('email_provider_configs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ providers: data || [], isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch providers',
        isLoading: false,
      })
    }
  },

  // Fetch connectors
  fetchConnectors: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('lead_connectors')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ connectors: data || [], isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch connectors',
        isLoading: false,
      })
    }
  },

  // Set selected lead
  setSelectedLeadId: (id: string | null) => {
    set({ selectedLeadId: id })
  },

  // Set filters
  setFilters: (filters: LeadFilter) => {
    set({ filters })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))
