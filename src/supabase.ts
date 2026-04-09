import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ChangeStatus = 'pending' | 'accepted' | 'rejected'

// ─── DB types ────────────────────────────────────────────────────────────────

export interface DBChangeDecision {
  id: string           // change id e.g. 'rs-01'
  doc_id: string       // document id e.g. 'research_strategy'
  status: ChangeStatus
  decided_by: string   // team member name
  decided_at: string   // ISO timestamp
}

export interface DBDocumentNote {
  doc_id: string
  note: string
  updated_by: string
  updated_at: string
}

export interface DBTeamActivity {
  id?: number
  member: string
  action: string       // e.g. 'accepted rs-01 in Research Strategy'
  created_at?: string
}
