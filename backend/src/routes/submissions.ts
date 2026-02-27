import { Router } from "express";
import sql from "../db";
import { authGuard, AuthRequest } from "../middleware/auth";

export const submissionRoutes = Router();

// Public: submit answers to a published form
submissionRoutes.post("/:id/submit", async (req, res) => {
  const [form] = await sql`
    SELECT id FROM forms WHERE id = ${req.params.id} AND is_published = true
  `;
  if (!form) {
    res.status(404).json({ error: "Form not found or not published" });
    return;
  }

  const latitude = req.body.latitude ?? null;
  const longitude = req.body.longitude ?? null;
  const [submission] = await sql`
    INSERT INTO submissions (form_id, latitude, longitude)
    VALUES (${req.params.id}, ${latitude}, ${longitude})
    RETURNING id, submitted_at
  `;

  for (const answer of req.body.answers) {
    await sql`
      INSERT INTO answers (submission_id, question_id, answer_value)
      VALUES (${submission.id}, ${answer.question_id}, ${answer.answer_value})
    `;
  }

  res.json({ submission_id: submission.id });
});

// Authenticated: view submissions for own form
submissionRoutes.get("/:id/submissions", authGuard, async (req, res) => {
  const { userId } = req as AuthRequest;
  const [form] = await sql`
    SELECT id FROM forms WHERE id = ${req.params.id} AND user_id = ${userId}
  `;
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }

  const submissions = await sql`
    SELECT s.id, s.submitted_at, s.latitude, s.longitude,
      json_agg(
        json_build_object(
          'question_id', a.question_id,
          'question_text', q.question_text,
          'answer_value', a.answer_value
        ) ORDER BY q.order_rank
      ) as answers
    FROM submissions s
    LEFT JOIN answers a ON a.submission_id = s.id
    LEFT JOIN questions q ON q.id = a.question_id
    WHERE s.form_id = ${req.params.id}
    GROUP BY s.id, s.submitted_at, s.latitude, s.longitude
    ORDER BY s.submitted_at ASC
  `;

  res.json(submissions);
});
