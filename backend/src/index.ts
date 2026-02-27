import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/auth";
import { formRoutes } from "./routes/forms";
import { submissionRoutes } from "./routes/submissions";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/forms", formRoutes);
app.use("/forms", submissionRoutes);

app.listen(3000, () => {
  console.log(`Server running at http://localhost:3000`);
});
