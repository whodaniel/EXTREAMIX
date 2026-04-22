import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export const UpgradeTerminal = ({ tierName, price }: { tierName: string, price: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEngage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/registry?upgrade=success`,
      },
    });
    if (error) setIsProcessing(false);
  };

  return (
    <div className="border border-cyan-500 bg-black p-6">
      <h3 className="text-cyan-400 font-mono mb-4 text-xs">AUTHORIZING: [{tierName}] TIER - ${price}/MO</h3>
      <form onSubmit={handleEngage}>
        <PaymentElement />
        <button 
          disabled={!stripe || isProcessing} 
          className="mt-6 w-full bg-cyan-900/50 hover:bg-cyan-700 text-cyan-100 font-mono py-3 border border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'NEGOTIATING HANDSHAKE...' : '[CONFIRM & ENGAGE]'}
        </button>
      </form>
    </div>
  );
};
