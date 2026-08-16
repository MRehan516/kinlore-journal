CREATE POLICY "Users delete own shares" ON public.shared_access FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.share_attempts FROM anon, authenticated;
GRANT ALL ON public.share_attempts TO service_role;
CREATE POLICY "No client access to share attempts" ON public.share_attempts FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);