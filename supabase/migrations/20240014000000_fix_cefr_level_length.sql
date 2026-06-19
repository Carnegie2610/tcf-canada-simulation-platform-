-- cefr_level values like "C1+", "B2+", "B1+" are 3 chars; VARCHAR(2) was too short
ALTER TABLE public.combination_evaluations
  ALTER COLUMN cefr_level TYPE VARCHAR(4);
