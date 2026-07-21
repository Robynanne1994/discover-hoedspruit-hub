
CREATE TABLE public.admin_user_notes (
  user_id uuid PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_user_notes TO authenticated;
GRANT ALL ON public.admin_user_notes TO service_role;

ALTER TABLE public.admin_user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage user notes"
  ON public.admin_user_notes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_user_notes_updated_at
  BEFORE UPDATE ON public.admin_user_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
