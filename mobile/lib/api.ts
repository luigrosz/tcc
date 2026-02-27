import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

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

export function getPublishedForms() {
  return request<Form[]>("/forms/published");
}

export function getPublicForm(id: number) {
  return request<FormWithQuestions>(`/forms/${id}/public`);
}

// Submissions
export interface AnswerInput {
  question_id: number;
  answer_value: string;
}

export function submitForm(
  formId: number,
  answers: AnswerInput[],
  location?: { latitude: number; longitude: number }
) {
  return request<{ submission_id: number }>(`/forms/${formId}/submit`, {
    method: "POST",
    body: JSON.stringify({
      answers,
      latitude: location?.latitude,
      longitude: location?.longitude,
    }),
  });
}
