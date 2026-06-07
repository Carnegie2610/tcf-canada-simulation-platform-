-- Speeds up lookups on student history dashboards
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);

-- Fast mapping of evaluation reports to submission IDs
CREATE INDEX idx_evaluations_submission_id ON public.evaluations(submission_id);

-- Compound index to enforce rapid checks on student submission existence
CREATE UNIQUE INDEX idx_student_exam_unique ON public.submissions(user_id, exam_id);
