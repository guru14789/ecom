import { api } from './client';
import { Question } from '../types';

export async function getProductQuestions(productId: string, page = 1): Promise<{ data: Question[]; pagination: any }> {
  const response = await api.get(`/questions/product/${productId}`, { params: { page } });
  return response.data;
}

export async function createQuestion(productId: string, body: string): Promise<{ data: Question }> {
  const response = await api.post('/questions', { productId, body });
  return response.data;
}

export async function createAnswer(questionId: string, body: string): Promise<{ data: Question }> {
  const response = await api.post(`/questions/${questionId}/answers`, { body });
  return response.data;
}

export async function markAnswerHelpful(questionId: string, answerId: string): Promise<{ helpfulCount: number }> {
  const response = await api.post(`/questions/${questionId}/answers/${answerId}/helpful`);
  return response.data;
}
