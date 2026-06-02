
-- Travel log
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination text NOT NULL,
  trip_date date NOT NULL,
  miles numeric NOT NULL DEFAULT 0,
  flights int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chess username store
CREATE TABLE public.chess_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fitness
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  activity text NOT NULL,
  duration_minutes int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Books
CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text NOT NULL,
  finished_on date NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Movies/TV
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('movie','tv')),
  watched_on date NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Finance
CREATE TABLE public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chess_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT ALL ON public.trips, public.chess_accounts, public.workouts, public.books, public.watchlist, public.finance_entries TO service_role;

-- RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chess_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

-- Policies: owner-only access
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['trips','workouts','books','watchlist','finance_entries']
  LOOP
    EXECUTE format('CREATE POLICY "own_select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own_update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own_delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

CREATE POLICY "own_select" ON public.chess_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.chess_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.chess_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.chess_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);
