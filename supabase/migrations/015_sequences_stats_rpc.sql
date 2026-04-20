-- RPC d'agrégation : remplace le N+1 (2 queries × N séquences) par 1 query
CREATE OR REPLACE FUNCTION public.sequences_with_counts()
RETURNS TABLE (
  sequence_id UUID,
  total_enrollments BIGINT,
  active_enrollments BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id AS sequence_id,
    COALESCE(sum(CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END), 0) AS total_enrollments,
    COALESCE(sum(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END), 0) AS active_enrollments
  FROM public.email_sequences s
  LEFT JOIN public.email_sequence_enrollments e ON e.sequence_id = s.id
  GROUP BY s.id;
$$;

GRANT EXECUTE ON FUNCTION public.sequences_with_counts() TO authenticated, service_role;
