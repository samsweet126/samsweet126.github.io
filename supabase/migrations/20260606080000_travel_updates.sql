ALTER TABLE public.trips RENAME COLUMN trip_date TO date;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS destination_airport TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS stops JSONB;
