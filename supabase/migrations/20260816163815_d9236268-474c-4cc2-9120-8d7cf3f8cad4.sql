CREATE TABLE public.journal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  prompt text NOT NULL,
  word_count integer NOT NULL DEFAULT 0,
  vocabulary_richness integer NOT NULL DEFAULT 0,
  sentence_complexity integer NOT NULL DEFAULT 0,
  clarity integer NOT NULL DEFAULT 0,
  sentiment integer NOT NULL DEFAULT 0,
  unique_words integer NOT NULL DEFAULT 0,
  brunet_w numeric NOT NULL DEFAULT 0,
  mean_sentence_length numeric NOT NULL DEFAULT 0,
  sd_sentence_length numeric NOT NULL DEFAULT 0,
  clause_density numeric NOT NULL DEFAULT 0,
  note text
);

GRANT SELECT, INSERT, DELETE ON public.journal_sessions TO authenticated;
GRANT ALL ON public.journal_sessions TO service_role;
ALTER TABLE public.journal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions" ON public.journal_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.journal_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.journal_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX journal_sessions_user_created_idx ON public.journal_sessions (user_id, created_at DESC);

CREATE TABLE public.shared_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  code_prefix text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  revoked_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.shared_access TO authenticated;
GRANT ALL ON public.shared_access TO service_role;
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own shares" ON public.shared_access
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own shares" ON public.shared_access
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own shares" ON public.shared_access
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.share_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.share_attempts TO service_role;
ALTER TABLE public.share_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX share_attempts_ip_time_idx ON public.share_attempts (ip_hash, attempted_at DESC);