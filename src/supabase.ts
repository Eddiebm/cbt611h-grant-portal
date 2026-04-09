export type ChangeStatus = 'pending' | 'accepted' | 'rejected'
export interface DBChangeDecision { id: string; doc_id: string; status: ChangeStatus; decided_by: string; decided_at: string }
export interface DBDocumentNote { doc_id: string; note: string; updated_by: string; updated_at: string }
export interface DBTeamActivity { id?: number; member: string; action: string; created_at?: string }

const store: Record<string, any[]> = { change_decisions: [], document_notes: [], team_activity: [] }
const listeners: Record<string, ((p: any) => void)[]> = {}
const load = () => { try { const s = localStorage.getItem('cbt611h-db'); if (s) Object.assign(store, JSON.parse(s)) } catch {} }
const save = () => { try { localStorage.setItem('cbt611h-db', JSON.stringify(store)) } catch {} }
load()

const fetch1 = (table: string) => Promise.resolve({ data: [...store[table]], error: null })

export const supabase = {
  from: (table: string) => ({
    select: (_c = '*') => fetch1(table),
    upsert: (row: any, opts?: { onConflict?: string }) => {
      const keys = opts?.onConflict?.split(',').map((k:string) => k.trim()) || ['id']
      const idx = store[table].findIndex((r:any) => keys.every((k:string) => r[k] === row[k]))
      if (idx >= 0) store[table][idx] = { ...store[table][idx], ...row }
      else store[table].push(row)
      save()
      listeners[table]?.forEach(fn => fn({ new: row }))
      return Promise.resolve({ error: null })
    },
    insert: (row: any) => {
      const nr = { ...row, id: Date.now(), created_at: new Date().toISOString() }
      store[table].push(nr)
      save()
      listeners[table]?.forEach(fn => fn({ new: nr }))
      return Promise.resolve({ error: null })
    },
  }),
  channel: (_n: string) => {
    const ch = {
      on: (_e: string, opts: any, fn: (p: any) => void) => {
        const t = opts?.table
        if (t) { if (!listeners[t]) listeners[t] = []; listeners[t].push(fn) }
        return ch
      },
      subscribe: () => ch,
    }
    return ch
  },
  rem
git add -A
git commit -m "Fix: localStorage stub, no Supabase env vars needed"
git push
