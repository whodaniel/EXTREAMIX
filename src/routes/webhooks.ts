import { Router, Request, Response } from 'express';
import Stripe from 'stripe';

const router = Router();

let stripeClient: Stripe | null = null;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

// NOTE: This route expects raw body for signature verification
router.post('/stripe', async (req: Request, res: Response) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing stripe-signature or STRIPE_WEBHOOK_SECRET');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;
      const customerEmail = invoice.customer_email;
      
      console.log(`Payment succeeded for subscription ${subscriptionId} (User: ${customerEmail})`);
      
      // TODO: Update user clearance tiers in your database
      // Example: await db.users.update({ where: { email: customerEmail }, data: { tier: 'STUDIO' } });
      
      break;
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`Subscription deleted: ${subscription.id}`);
      // TODO: Revert user to free tier
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
