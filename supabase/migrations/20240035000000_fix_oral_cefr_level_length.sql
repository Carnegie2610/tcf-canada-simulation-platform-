-- Same fix as 20240014000000, which widened combination_evaluations.cefr_level:
-- values like "C1+", "B2+" and "B1+" are 3 characters, but oral_evaluations was
-- created later (20240023000000) and copied the original VARCHAR(2).
--
-- Any oral submission scoring 16-18, 12-14 or 7-10 therefore failed on insert
-- *after* transcription and scoring had already run, stranding the submission at
-- pipeline_status = 'processing'.

ALTER TABLE public.oral_evaluations
  ALTER COLUMN cefr_level TYPE VARCHAR(4);
