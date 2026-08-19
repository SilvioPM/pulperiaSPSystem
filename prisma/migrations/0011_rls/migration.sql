-- Row Level Security: el usuario de la app (spsystem) conserva acceso completo;
-- cualquier otro rol de la BD no ve ni modifica datos.
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS app_acceso_total ON public.%I', t);
    EXECUTE format('CREATE POLICY app_acceso_total ON public.%I FOR ALL TO spsystem USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;