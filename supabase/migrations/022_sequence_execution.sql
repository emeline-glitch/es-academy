-- Infrastructure d'exécution des séquences
-- Le moteur de cron /api/cron/process-sequences utilise ces colonnes et cette RPC.

-- S'assurer que email_sequence_enrollments a les bonnes colonnes (migration défensive)
ALTER TABLE public.email_sequence_enrollments
  ADD COLUMN IF NOT EXISTS next_send_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_enrollments_pending
  ON public.email_sequence_enrollments(next_send_at, status)
  WHERE status = 'active';

-- RPC qui picke les prochains envois à faire (LIMIT pour éviter surcharge)
-- Utilisée par /api/cron/process-sequences
CREATE OR REPLACE FUNCTION public.get_pending_sequence_sends(batch_size INTEGER DEFAULT 50)
RETURNS TABLE (
  enrollment_id UUID,
  sequence_id UUID,
  sequence_name TEXT,
  contact_id UUID,
  contact_email TEXT,
  contact_first_name TEXT,
  contact_last_name TEXT,
  current_step INTEGER,
  next_step_id UUID,
  next_step_order INTEGER,
  next_step_subject TEXT,
  next_step_html TEXT,
  next_step_delay_days INTEGER,
  next_step_delay_hours INTEGER,
  is_last_step BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id AS enrollment_id,
    s.id AS sequence_id,
    s.name AS sequence_name,
    c.id AS contact_id,
    c.email AS contact_email,
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    e.current_step,
    next_step.id AS next_step_id,
    next_step.step_order AS next_step_order,
    next_step.subject AS next_step_subject,
    next_step.html_content AS next_step_html,
    next_step.delay_days AS next_step_delay_days,
    next_step.delay_hours AS next_step_delay_hours,
    NOT EXISTS (
      SELECT 1 FROM public.email_sequence_steps future
      WHERE future.sequence_id = s.id
        AND future.step_order > next_step.step_order
    ) AS is_last_step
  FROM public.email_sequence_enrollments e
  JOIN public.email_sequences s ON s.id = e.sequence_id
  JOIN public.contacts c ON c.id = e.contact_id
  LEFT JOIN LATERAL (
    SELECT st.* FROM public.email_sequence_steps st
    WHERE st.sequence_id = e.sequence_id
      AND st.step_order > e.current_step
      AND COALESCE(st.status, 'active') = 'active'
    ORDER BY st.step_order ASC
    LIMIT 1
  ) next_step ON true
  WHERE e.status = 'active'
    AND e.next_send_at <= now()
    AND s.status = 'active'
    AND c.status = 'active'
    AND next_step.id IS NOT NULL
  ORDER BY e.next_send_at ASC
  LIMIT batch_size;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_sequence_sends(INTEGER) TO authenticated, service_role;
