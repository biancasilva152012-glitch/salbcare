CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  sender text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all chat messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (is_admin_or_contador(auth.uid()));

CREATE POLICY "Admins can insert chat replies" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (is_admin_or_contador(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;