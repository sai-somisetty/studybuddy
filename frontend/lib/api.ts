import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const endpoints = {
  ask:           (q: string) => api.get(`/ask?question=${encodeURIComponent(q)}`),
  quiz:          (chapter: string) => api.get(`/quiz/generate?chapter=${chapter}`),
  answer:        (data: any) => api.post(`/quiz/answer`, data),
  register:      (data: any) => api.post(`/student/register`, data),
  testDb:        () => api.get(`/test-db`),
};
