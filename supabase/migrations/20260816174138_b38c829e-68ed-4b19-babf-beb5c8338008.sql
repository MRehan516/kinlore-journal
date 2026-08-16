ALTER TABLE public.journal_sessions
  ADD COLUMN IF NOT EXISTS unique_propositions integer,
  ADD COLUMN IF NOT EXISTS repetition_count integer;