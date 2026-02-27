import { Router } from "express";
import sql from "../db";
import { signToken } from "../middleware/auth";

export const authRoutes = Router();

authRoutes.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await Bun.password.hash(password);
  const [user] = await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${passwordHash})
    RETURNING id, email
  `;

  const token = signToken({ userId: user.id });
  res.json({ token, user: { id: user.id, email: user.email } });
});

authRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await sql`
    SELECT id, email, password_hash FROM users WHERE email = ${email}
  `;
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await Bun.password.verify(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id });
  res.json({ token, user: { id: user.id, email: user.email } });
});
