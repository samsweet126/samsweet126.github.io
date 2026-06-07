-- Create weights table
CREATE TABLE public.weights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  weight numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weights TO authenticated;
GRANT ALL ON public.weights TO service_role;

ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_select ON public.weights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.weights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.weights FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete ON public.weights FOR DELETE TO authenticated USING (auth.uid() = user_id);
