
ALTER TABLE public.trips RENAME COLUMN trip_date TO date;

ALTER TABLE public.workouts RENAME COLUMN activity_date TO date;
ALTER TABLE public.workouts RENAME COLUMN duration_minutes TO time_minutes;

ALTER TABLE public.books RENAME COLUMN started_on TO date_started;
ALTER TABLE public.books RENAME COLUMN finished_on TO date_finished;
ALTER TABLE public.books RENAME COLUMN book_type TO type;

CREATE TABLE public.chess_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text NOT NULL,
  rating integer NOT NULL,
  rating_type text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chess_ratings TO authenticated;
GRANT ALL ON public.chess_ratings TO service_role;
ALTER TABLE public.chess_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.chess_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.chess_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.chess_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete ON public.chess_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.finances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finances TO authenticated;
GRANT ALL ON public.finances TO service_role;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.finances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.finances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.finances FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete ON public.finances FOR DELETE TO authenticated USING (auth.uid() = user_id);
