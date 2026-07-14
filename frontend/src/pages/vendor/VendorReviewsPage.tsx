import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, CornerDownRight, Send, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { vendorApi } from '../../lib/api';

export const VendorReviewsPage: React.FC = () => {
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['vendor-reviews'],
    queryFn: async () => {
      const res = await vendorApi.reviews.list({ limit: 100 });
      return res.data as any[];
    },
    staleTime: 60_000,
  });

  const reviews = data || [];

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      vendorApi.reviews.reply(id, reply),
    onSuccess: () => {
      toast.success('Reply posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
      setActiveReplyId(null);
      setReplyText('');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to post reply'),
  });

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  const handlePostReply = (id: string) => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ id, reply: replyText.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Read feedback, view ratings breakdown, and respond to your customers.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="relative z-10 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-medium">
          Failed to load reviews. <button className="underline" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Breakdown card */}
        <div className="bg-white p-6 rounded-[2rem] border shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">Overview Ratings</h3>
          <div className="text-center py-4">
            <span className="text-5xl font-black text-blue-950">{avgRating}</span>
            <div className="flex items-center justify-center gap-1 mt-2 text-amber-400">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="w-5 h-5 fill-current" style={{ opacity: parseFloat(avgRating) >= s ? 1 : 0.3 }} />
              ))}
            </div>
            <span className="text-xs text-gray-400 font-medium block mt-2">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {ratingBreakdown.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-4 font-bold">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-gray-400 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white p-10 rounded-[2rem] border shadow-sm text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">No reviews yet</h3>
              <p className="text-sm text-gray-500 mt-1">Reviews from your buyers will appear here.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-[2rem] border shadow-sm space-y-4 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-blue-950">{review.buyerName || review.userName || 'Anonymous'}</h4>
                    <span className="text-xs text-gray-400 font-semibold">{review.productName || 'Product'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 bg-amber-50 px-2 py-0.5 rounded-lg text-xs font-bold border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-current" /> {review.rating}
                  </div>
                </div>

                <p className="text-sm text-gray-600 font-medium italic">"{review.comment || review.body}"</p>

                {review.vendorReply ? (
                  <div className="bg-gray-50 p-4 rounded-xl border flex gap-2">
                    <CornerDownRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                    <div>
                      <span className="text-xs font-bold text-orange-600 block">Your Response:</span>
                      <p className="text-xs text-gray-600 font-medium mt-1">{review.vendorReply}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {activeReplyId === review.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your response..."
                          className="flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
                          onKeyDown={e => e.key === 'Enter' && handlePostReply(review.id)}
                        />
                        <button
                          onClick={() => handlePostReply(review.id)}
                          disabled={replyMutation.isPending}
                          className="p-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setActiveReplyId(review.id); setReplyText(''); }}
                        className="text-xs font-bold text-orange-600 hover:underline"
                      >
                        Reply to Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
