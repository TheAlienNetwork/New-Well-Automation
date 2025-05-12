-- Modify surveys table to accept string IDs instead of UUIDs
ALTER TABLE public.surveys ALTER COLUMN id TYPE TEXT;
