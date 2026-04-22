import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, {
      apiVersion: '2025-02-24-preview' as any,
    });
  }
  return stripeClient;
}

router.post('/create-subscription', async (req, res) => {
  try {
    const stripe = getStripe();
    const { priceId, customerEmail } = req.body;

    // Create or retrieve a customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customer = customers.data[0];

    if (!customer) {
      customer = await stripe.customers.create({ email: customerEmail });
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const latestInvoice = subscription.latest_invoice as any;
    const paymentIntent = latestInvoice.payment_intent as any;

    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
