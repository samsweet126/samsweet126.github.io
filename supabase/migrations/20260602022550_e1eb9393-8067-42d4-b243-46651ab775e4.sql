-- Drop removed tables
DROP TABLE IF EXISTS public.watchlist;
DROP TABLE IF EXISTS public.finance_entries;

-- Rebuild trips
DROP TABLE IF EXISTS public.trips;
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  trip_date DATE NOT NULL,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('flight','drive')),
  airline TEXT,
  roundtrip BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.trips FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.trips FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete ON public.trips FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Rebuild workouts
DROP TABLE IF EXISTS public.workouts;
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  miles NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Rebuild books
DROP TABLE IF EXISTS public.books;
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  started_on DATE,
  finished_on DATE,
  rating INTEGER,
  pages INTEGER,
  book_type TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.books FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.books FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_update ON public.books FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete ON public.books FOR DELETE TO authenticated USING (auth.uid() = user_id);