-- 077_seq_welcome_family : sequence Welcome Family (SEQ_PA_FAMILY).
--
-- Decouvert par le scenario E2E 08-stripe-family-subscription : aucune
-- sequence ne trigge sur le tag "family" → les nouveaux membres sont
-- taggues mais ne recoivent aucun mail de bienvenue.
--
-- Squelette en 3 etapes (J+0, J+2, J+7) que Tiffany rewrite + active.
-- Status = draft tant que les mails ne sont pas finalises.
--
-- Trigger : tag "family" (pose par le webhook Stripe quand un membre
-- s'abonne au plan Family Fondateur ou Standard).
--
-- Idempotent : INSERT ... WHERE NOT EXISTS pour eviter doublon si rejoue.

DO $$
DECLARE
  v_seq_id UUID;
BEGIN
  -- Cree la sequence si pas deja la
  IF NOT EXISTS (SELECT 1 FROM public.email_sequences WHERE name = 'Welcome Family (SEQ_PA_FAMILY)') THEN
    INSERT INTO public.email_sequences (name, trigger_type, trigger_value, trigger_event, status, steps)
    VALUES (
      'Welcome Family (SEQ_PA_FAMILY)',
      'tag_added',
      'family',
      'tag_added',
      'draft',
      '[]'::jsonb
    )
    RETURNING id INTO v_seq_id;

    -- Step 1 : J+0 - Bienvenue + acces communaute
    INSERT INTO public.email_sequence_steps
      (sequence_id, step_order, delay_days, delay_hours, subject, html_content, status)
    VALUES (
      v_seq_id,
      1,
      0,
      0,
      'Bienvenue dans ES Family, {{prenom}} 🎉',
      '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>Salut {{prenom}},</p>
<p>Bienvenue dans ES Family. T''es maintenant fondateur·rice (ou abonné·e), et je suis ravie de t''avoir.</p>
<p><strong>Voici comment ça marche concrètement :</strong></p>
<ul>
  <li>Tu reçois 1 live mensuel avec moi et mes invités experts (en visio + replay)</li>
  <li>1 ebook mensuel sur un sujet patrimonial brûlant</li>
  <li>Des analyses flash dès qu''une opportunité market sort</li>
  <li>L''accès à la communauté Skool [TODO_LIEN] où tu peux interagir avec les autres membres</li>
</ul>
<p><strong>Prochaine étape pour toi :</strong> [TODO_CTA - lien vers /family/bienvenue ou portail].</p>
<p>À très vite,<br><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;">PS : si tu as une question, réponds-moi à ce mail, je le lis. <a href="{{unsubscribe_url}}">Se désinscrire</a>.</p>
</div>',
      'draft'
    );

    -- Step 2 : J+2 - Premiere ressource utile (valeur)
    INSERT INTO public.email_sequence_steps
      (sequence_id, step_order, delay_days, delay_hours, subject, html_content, status)
    VALUES (
      v_seq_id,
      2,
      2,
      0,
      '{{prenom}}, ta première ressource Family',
      '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>Salut {{prenom}},</p>
<p>[TODO_HOOK - Tiffany : ouvrir avec une accroche : observation, anecdote du moment, contexte marché.]</p>
<p>[TODO_VALEUR - Tiffany : delivre une vraie pepite (un outil, une analyse, une checklist) que les non-Family ne voient pas. C''est le mail qui prouve que l''abonnement vaut le coup.]</p>
<p>[TODO_CTA - Tiffany : invite à consommer la ressource, à laisser un commentaire dans Skool ou à répondre à ce mail.]</p>
<p>À demain pour la suite,<br><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;"><a href="{{unsubscribe_url}}">Se désinscrire</a>.</p>
</div>',
      'draft'
    );

    -- Step 3 : J+7 - Bilan premiere semaine + invitation interaction
    INSERT INTO public.email_sequence_steps
      (sequence_id, step_order, delay_days, delay_hours, subject, html_content, status)
    VALUES (
      v_seq_id,
      3,
      7,
      0,
      'Alors {{prenom}}, ta première semaine Family ?',
      '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #1a3833; line-height: 1.6;">
<p>Salut {{prenom}},</p>
<p>[TODO_BILAN - Tiffany : revenir sur ce qu''il s''est passé dans Family la première semaine (live, ebook, fil Skool). Donne à voir.]</p>
<p>[TODO_QUESTION - Tiffany : pose une vraie question qui invite à répondre. Ex : "Sur quoi tu veux que je creuse en priorité ce mois-ci ?"]</p>
<p>[TODO_LIEN - Tiffany : pointer vers une ressource ou un live à venir.]</p>
<p>À toi,<br><strong>Emeline</strong></p>
<p style="font-size: 13px; color: #666;"><a href="{{unsubscribe_url}}">Se désinscrire</a>.</p>
</div>',
      'draft'
    );

    RAISE NOTICE 'Welcome Family (SEQ_PA_FAMILY) cree avec 3 steps en draft (id %)', v_seq_id;
  ELSE
    RAISE NOTICE 'Welcome Family (SEQ_PA_FAMILY) existe deja, skip.';
  END IF;
END $$;
