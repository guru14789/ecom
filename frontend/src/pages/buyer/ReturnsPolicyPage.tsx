import React from 'react';

export const ReturnsPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto selection:bg-orange-100">
      <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-12">
        Returns & Replacements
      </h1>
      
      <div className="space-y-12 text-gray-600 font-light leading-relaxed text-lg">
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Guarantee</h2>
          <p>
            We want you to be completely satisfied with your grocery order. If an item arrives damaged, spoiled, or incorrect, 
            we will happily issue a refund or replacement within 24 hours of delivery.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Request a Return</h2>
          <p>
            1. Go to "Your Orders" in your profile.<br/>
            2. Select the order containing the issue.<br/>
            3. Click "Report an Issue" next to the specific item.<br/>
            4. Provide a brief description and optionally upload a photo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Non-Returnable Items</h2>
          <p>
            For health and safety reasons, we cannot accept physical returns of perishable goods once they have been delivered. 
            However, refunds will still be issued for compromised perishable items.
          </p>
        </section>
      </div>
    </div>
  );
};
