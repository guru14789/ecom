import { api } from './client';
import { ReviewsResponse, ReviewItem } from '../types';

export async function getProductReviews(productId: string, page = 1, sort = 'recent'): Promise<ReviewsResponse> {
  const response = await api.get(`/reviews/product/${productId}`, { params: { page, sort } });
  return response.data;
}

export async function createReview(data: {
  productId: string; orderId: string; rating: number; title?: string; body: string; images?: Array<{ url: string }>;
}): Promise<{ data: ReviewItem }> {
  const response = await api.post('/reviews', data);
  return response.data;
}

export async function markReviewHelpful(reviewId: string): Promise<{ helpfulCount: number }> {
  const response = await api.post(`/reviews/${reviewId}/helpful`);
  return response.data;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}
