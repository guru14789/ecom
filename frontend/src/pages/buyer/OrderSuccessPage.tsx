import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams();

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-6">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>
      
      <h1 className="text-3xl font-extrabold text-gray-900">Order Placed!</h1>
      <p className="text-gray-600">
        Your order <strong>#{orderId}</strong> has been successfully placed and is being prepared. It will be delivered in ~10 minutes.
      </p>
      
      <div className="bg-white border rounded-2xl p-6 shadow-sm mt-8 space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Track your delivery</h3>
        <p className="text-sm text-gray-500">Live map tracking is available for this order.</p>
        <Link 
          to={`/orders/${orderId}`} 
          className="w-full bg-primary text-white rounded-xl py-3 font-bold block text-center hover:bg-primary/90 transition-colors"
        >
          Track Order
        </Link>
        <Link 
          to="/" 
          className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl py-3 font-bold block text-center hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};
