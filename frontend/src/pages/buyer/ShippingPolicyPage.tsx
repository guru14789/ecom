import React from 'react';

export const ShippingPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto selection:bg-orange-100">
      <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-12">
        Shipping Rates & Policies
      </h1>
      
      <div className="space-y-12 text-gray-600 font-light leading-relaxed text-lg">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Standard Delivery</h2>
          <p>
            At shopyng, we pride ourselves on fast, hyper-local delivery. Standard delivery is typically completed within 15-30 minutes of order confirmation. 
            Delivery fees are dynamically calculated based on the distance between your selected store and your delivery address.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Free Delivery Thresholds</h2>
          <p>
            Many of our partner vendors offer free delivery for orders exceeding a certain amount (typically ₹500). 
            Look for the "Free Delivery" badge on the vendor's store page to see their specific threshold.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Areas</h2>
          <p>
            We currently operate in select neighborhoods to ensure we can maintain our promise of ultra-fast delivery. 
            If a store appears in your search results, it means they deliver to your saved address.
          </p>
        </section>
      </div>
    </div>
  );
};
