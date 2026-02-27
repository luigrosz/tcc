const API_URL = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  console.log(`API ${options.method || "GET"} ${path} → ${res.status}`, text);

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response (${res.status}): ${text}`);
  }

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

// Auth
export interface AuthResponse {
  token: string;
  user: { id: number; email: string };
}

export function register(email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Forms
export interface Form {
  id: number;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  order_rank: number;
}

export interface FormWithQuestions extends Form {
  questions: Question[];
}

export function getForms() {
  return request<Form[]>("/forms");
}

export function getForm(id: number) {
  return request<FormWithQuestions>(`/forms/${id}`);
}

export function createForm(data: {
  title: string;
  description?: string;
}) {
  return request<Form>("/forms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateForm(
  id: number,
  data: {
    title: string;
    description?: string;
    is_published?: boolean;
  }
) {
  return request<Form>(`/forms/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteForm(id: number) {
  return request<{ success: boolean }>(`/forms/${id}`, { method: "DELETE" });
}

// Questions
export interface QuestionInput {
  question_text: string;
  question_type: string;
  options?: string[];
  is_required?: boolean;
}

export function saveQuestions(formId: number, questions: QuestionInput[]) {
  return request<{ questions: Question[] }>(`/forms/${formId}/questions`, {
    method: "PUT",
    body: JSON.stringify({ questions }),
  });
}

// Submissions
export interface AnswerInput {
  question_id: number;
  answer_value: string;
}

export function submitForm(formId: number, answers: AnswerInput[]) {
  return request<{ submission_id: number }>(`/forms/${formId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

export interface SubmissionAnswer {
  question_id: number;
  question_text: string;
  answer_value: string;
}

export interface Submission {
  id: number;
  submitted_at: string;
  latitude: number | null;
  longitude: number | null;
  answers: SubmissionAnswer[];
}

export function getSubmissions(formId: number) {
  return request<Submission[]>(`/forms/${formId}/submissions`);
}
