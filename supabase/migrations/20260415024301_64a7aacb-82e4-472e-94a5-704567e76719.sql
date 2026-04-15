
-- Table for share links
CREATE TABLE public.shared_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type text NOT NULL CHECK (card_type IN ('note', 'event', 'contact')),
  card_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  shared_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_cards ENABLE ROW LEVEL SECURITY;

-- Anyone can read shared cards by token (needed for public share page)
CREATE POLICY "Anyone can view shared cards by token"
  ON public.shared_cards FOR SELECT
  USING (true);

CREATE POLICY "Users can create share links for own cards"
  ON public.shared_cards FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can delete own share links"
  ON public.shared_cards FOR DELETE
  USING (auth.uid() = shared_by);

-- Table for saved copies
CREATE TABLE public.saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type text NOT NULL CHECK (card_type IN ('note', 'event', 'contact')),
  original_card_id uuid NOT NULL,
  saved_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(original_card_id, saved_by)
);

ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved cards"
  ON public.saved_cards FOR SELECT
  USING (auth.uid() = saved_by);

CREATE POLICY "Users can save cards"
  ON public.saved_cards FOR INSERT
  WITH CHECK (auth.uid() = saved_by);

CREATE POLICY "Users can unsave cards"
  ON public.saved_cards FOR DELETE
  USING (auth.uid() = saved_by);
