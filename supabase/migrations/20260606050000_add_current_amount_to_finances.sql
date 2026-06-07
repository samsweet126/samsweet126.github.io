-- Add current amount tracking for finances
CREATE TABLE public.finances_balance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.finances_balance TO authenticated;
GRANT ALL ON public.finances_balance TO service_role;

ALTER TABLE public.finances_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_select ON public.finances_balance FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.finances_balance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.finances_balance FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete ON public.finances_balance FOR DELETE TO authenticated USING (auth.uid() = user_id);
