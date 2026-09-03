import { Router, Request, Response } from 'express';

const router = Router();

/**
 * RevenueCat Webhook Handler
 * 
 * Receives server notifications from RevenueCat when subscription
 * events occur (purchase, renewal, cancellation, etc.).
 * 
 * Configure this URL in the RevenueCat dashboard:
 *   https://extreamix.com/api/webhooks/revenuecat
 * 
 * For local testing, use: ngrok http 3000
 * 
 * RevenueCat sends events with the following structure:
 * - event.type: TRANSFER, INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.
 * - event.app_user_id: The user ID
 * - event.product_id: The product that was purchased
 * - event.entitlement_ids: Array of entitlement IDs granted
 */

// In-memory store for entitlement updates (for demo/single-instance)
// In production, use a database (Supabase, Firestore, etc.)
const entitlementCache = new Map<string, string[]>();

// RevenueCat webhook authorization header: "Bearer <your_webhook_authorization_key>"
const RC_WEBHOOK_AUTH = process.env.REVENUECAT_WEBHOOK_AUTH || '';

function verifyWebhookAuth(req: Request): boolean {
  if (!RC_WEBHOOK_AUTH) {
    console.error('[RC Webhook] No REVENUECAT_WEBHOOK_AUTH set - failing verification securely');
    return false;
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader) return false;
  return authHeader === `Bearer ${RC_WEBHOOK_AUTH}`;
}

router.post('/revenuecat', async (req: Request, res: Response) => {
  // Verify authorization
  if (!verifyWebhookAuth(req)) {
    console.warn('[RC Webhook] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let event = req.body;
    if (Buffer.isBuffer(req.body)) {
      event = JSON.parse(req.body.toString('utf8'));
    }

    // RevenueCat v2 webhooks send events in an array under "events"
    // RevenueCat v1 sends a single event object
    const events = event.events || [event];

    for (const evt of events) {
      const userId = evt.app_user_id || evt.event?.app_user_id;
      const eventType = evt.type || evt.event?.type;

      console.log(`[RC Webhook] Event: ${eventType} for user: ${userId}`);

      switch (eventType) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'UNCANCELLATION':
        case 'RESUBSCRIPTION':
        case 'TRANSFER': {
          // User gained entitlements - update cache
          const entitlements = evt.entitlement_ids || evt.event?.entitlement_ids || [];
          if (userId && entitlements.length > 0) {
            entitlementCache.set(userId, entitlements);
            console.log(`[RC Webhook] User ${userId} granted entitlements: ${entitlements.join(', ')}`);
          }
          break;
        }

        case 'CANCELLATION':
        case 'EXPIRATION':
        case 'BILLING_RETRY_DISABLED': {
          // User lost entitlements
          if (userId) {
            entitlementCache.set(userId, []);
            console.log(`[RC Webhook] User ${userId} entitlements revoked`);
          }
          break;
        }

        case 'SUBSCRIPTION_PAUSED': {
          console.log(`[RC Webhook] User ${userId} subscription paused`);
          break;
        }

        case 'PRODUCT_CHANGE': {
          console.log(`[RC Webhook] User ${userId} changed product`);
          break;
        }

        default:
          console.log(`[RC Webhook] Unhandled event type: ${eventType}`);
      }
    }

    // RevenueCat expects a 200 OK to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[RC Webhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for the frontend to check server-cached entitlements
// (supplementary to the RC SDK client-side check)
router.get('/entitlements/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const entitlements = entitlementCache.get(userId) || [];
  res.json({ userId, entitlements });
});

export default router;
