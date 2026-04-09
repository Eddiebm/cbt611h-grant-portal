-- CBT-611H Grant Portal — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query → Paste → Run

-- Change decisions: stores each team member's accept/reject per change
create table if not exists change_decisions (
  id text not null,           -- change id e.g. 'rs-01'
  doc_id text not null,       -- document id e.g. 'research_strategy'
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  decided_by text not null,   -- team member name
  decided_at timestamptz not null default now(),
  primary key (id, doc_id)
);

-- Document notes: one note per document, last-write-wins
create table if not exists document_notes (
  doc_id text primary key,
  note text not null default '',
  updated_by text not null,
  updated_at timestamptz not null default now()
);

-- Team activity feed
create table if not exists team_activity (
  id bigint generated always as identity primary key,
  member text not null,
  action text not null,
  created_at timestamptz not null default now()
);

-- Enable real-time on all three tables
alter publication supabase_realtime add table change_decisions;
alter publication supabase_realtime add table document_notes;
alter publication supabase_realtime add table team_activity;

-- Row Level Security: open read/write for all (no auth required)
alter table change_decisions enable row level security;
alter table document_notes enable row level security;
alter table team_activity enable row level security;

create policy "allow all" on change_decisions for all using (true) with check (true);
create policy "allow all" on document_notes for all using (true) with check (true);
create policy "allow all" on team_activity for all using (true) with check (true);
