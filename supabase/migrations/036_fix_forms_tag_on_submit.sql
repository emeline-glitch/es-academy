-- Fix critique : les 3 forms publies (masterclass, quiz, simulateur) avaient
-- tag_on_submit=NULL. A chaque opt-in, le contact recevait juste form_signup
-- et form:<slug> mais PAS le lm:<slug> qui declenche les sequences SEQ_MC,
-- SEQ_QZ_*, SEQ_SIM via auto-enroll.
--
-- Sans ce fix : aucun lead opt-in ne declenche les nurture sequences.
-- Bug bloquant pour le lancement mi-mai.

UPDATE public.forms
SET tag_on_submit = 'lm:masterclass'
WHERE slug = 'masterclass' AND tag_on_submit IS NULL;

UPDATE public.forms
SET tag_on_submit = 'lm:quiz-investissement'
WHERE slug = 'quiz-investisseur' AND tag_on_submit IS NULL;

UPDATE public.forms
SET tag_on_submit = 'lm:simulateur-rentabilite'
WHERE slug = 'simulateur-rentabilite' AND tag_on_submit IS NULL;
