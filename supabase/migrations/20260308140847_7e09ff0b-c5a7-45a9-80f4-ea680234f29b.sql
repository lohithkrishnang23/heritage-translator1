-- Create translations history table
CREATE TABLE public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_lang TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and insert (no auth in this app)
CREATE POLICY "Anyone can view translations" ON public.translations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert translations" ON public.translations FOR INSERT WITH CHECK (true);