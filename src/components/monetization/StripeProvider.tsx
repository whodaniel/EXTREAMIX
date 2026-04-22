import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';

// Using Vite environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const extreamixTheme = {
  theme: 'night' as const,
  variables: {
    fontFamily: '"Courier New", Courier, monospace',
    colorBackground: '#0a0a0a',
    colorText: '#e0e0e0',
    colorPrimary: '#00e5ff',
    borderRadius: '0px',
  },
};

export const StripeOverlay = ({ clientSecret, children }: { clientSecret: string, children: React.ReactNode }) => (
  <Elements stripe={stripePromise} options={{ clientSecret, appearance: extreamixTheme }}>
    {children}
  </Elements>
);
