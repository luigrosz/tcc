import { Router } from "express";
import sql from "../db";
import { authGuard, AuthRequest } from "../middleware/auth";

export const formRoutes = Router();

// Public: list all published forms
formRoutes.get("/published", async (_req, res) => {
  const forms = await sql`
    SELECT id, title, description, is_published, created_at
    FROM forms WHERE is_published = true
    ORDER BY created_at DESC
  `;
  res.json(forms);
});

// Public: get a published form with its questions
formRoutes.get("/:id/public", async (req, res) => {
  const [form] = await sql`
    SELECT id, title, description
    FROM forms WHERE id = ${req.params.id} AND is_published = true
  `;
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }

  const questions = await sql`
    SELECT id, question_text, question_type, options, is_required, order_rank
    FROM questions WHERE form_id = ${req.params.id}
    ORDER BY order_rank
  `;

  res.json({ ...form, questions });
});

// All routes below require authentication
formRoutes.get("/", authGuard, async (req, res) => {
  const { userId } = req as AuthRequest;
  const forms = await sql`
    SELECT id, title, description, is_published, created_at
    FROM forms WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  res.json(forms);
});

formRoutes.post("/", authGuard, async (req, res) => {
  const { userId } = req as AuthRequest;
  const { title, description } = req.body;

  if (!title || typeof title !== "string" || title.length < 1) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const [form] = await sql`
    INSERT INTO forms (user_id, title, description)
    VALUES (${userId}, ${title}, ${description ?? null})
    RETURNING id, title, description, is_published, created_at
  `;
  res.json(form);
});

formRoutes.get("/:id", authGuard, async (req, res) => {
  const { userId } = req as AuthRequest;
  const [form] = await sql`
    SELECT id, title, description, is_published, created_at
    FROM forms WHERE id = ${req.params.id} AND user_id = ${userId}
  `;
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }

  const questions = await sql`
    SELECT id, question_text, question_type, options, is_required, order_rank
    FROM questions WHERE form_id = ${req.params.id}
    ORDER BY order_rank
  `;

  res.json({ ...form, questions });
});

formRoutes.put("/:id", authGuard, async (req, res) => {
  const { userId } = req as AuthRequest;
  const { title, description, is_published } = req.body;

  if (!title || typeof title !== "string" || title.length < 1) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const [form] = await sql`
    UPDATE forms
    SET title = ${title},
        description = ${description ?? null},
        is_published = ${is_published ?? false}
    WHERE id = ${req.params.id} AND user_id = ${userId}
    RETURNING id, title, description, is_published, created_at
  `;
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  res.json(form);
});

formRoutes.delete("/:id", authGuard, async (req, res) => {
  const { userId } = req as AuthRequest;
  const [form] = await sql`
    DELETE FROM forms WHERE id = ${req.params.id} AND user_id = ${userId}
    RETURNING id
  `;
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  res.json({ success: true });
});

formRoutes.put("/:id/questions", authGuard, async (req, res) => {
  const { userId } = req as AuthRequest;
  const { questions } = req.body;

  // Verify ownership
  const [form] = await sql`
    SELECT id FROM forms WHERE id = ${req.params.id} AND user_id = ${userId}
  `;
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }

  // Replace all questions in a transaction
  await sql.begin(async (tx) => {
    await tx`DELETE FROM questions WHERE form_id = ${req.params.id}`;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const options = q.options ? sql.json(q.options) : null;
      const isRequired = q.is_required === true;
      await tx`
        INSERT INTO questions (form_id, question_text, question_type, options, is_required, order_rank)
        VALUES (${req.params.id}, ${q.question_text}, ${q.question_type}, ${options}, ${isRequired}, ${i})
      `;
    }
  });

  const updatedQuestions = await sql`
    SELECT id, question_text, question_type, options, is_required, order_rank
    FROM questions WHERE form_id = ${req.params.id}
    ORDER BY order_rank
  `;

  res.json({ questions: updatedQuestions });
});
