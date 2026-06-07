
Skill: AI Evaluation Pipeline

Context

Use this skill when configuring prompts, dealing with OpenAI or Claude SDK pipelines, and handling diagnostic validations.

Guidelines

Strict Schema Verification: Enforce Zod schemas for both client payload validations and structured AI output parsers.

Structured Outputs: Use Structured Outputs (Strict JSON) inside the API payload directly.

Budget Protections: Enforce strict character bounds (max 8,000 characters) before passing user scripts to language models.

Code Patterns

Zod Parser Schema

import { z } from 'zod';

export const DiagnosticReportSchema = z.object({
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  globalScore: z.number().min(0).max(100),
  criteriaMetrics: z.object({
    grammarScore: z.number().min(0).max(20),
    lexicalScore: z.number().min(0).max(20),
    coherenceScore: z.number().min(0).max(20),
  })
});


