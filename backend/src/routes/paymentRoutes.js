import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Stripe from 'stripe';
import { pool } from '../db.js';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// CREATE CHECKOUT SESSION
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { plan } = req.body; // 'lite' or 'pro'
    const priceInCents = plan === 'pro' ? 199 : 99; // $1.99 or $0.99

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `ProjectFlow AI ${plan === 'pro' ? 'Pro' : 'Lite'}` },
            unit_amount: priceInCents,
            recurring: { interval: 'month' }, 
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
      client_reference_id: req.user.userId.toString(),
      metadata: { plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});



router.post('/verify', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      await pool.query(
        'UPDATE users SET is_premium = true, plan_type = $1 WHERE id = $2',  //$1 is plan, $2 is userId for sql injection safety
        [session.metadata.plan || 'pro', req.user.userId]
      );
      res.json({ success: true }); 
    } else {
      res.status(400).json({ error: 'Not paid' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// WEBHOOK — PAYMENT SUCCESS
router.post(
  '/webhook',  //webhook is endpoint stripe calls to notify about events like payment success
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature']; //stripe http header for verification that this request is from stripe

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); //construct event verifies request, security gate
    } catch (err) {
      console.error('Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id; 
      const plan = session.metadata.plan;

      await pool.query(
        'UPDATE users SET is_premium = true, plan_type = $1 WHERE id = $2',
        [plan, userId]
      );
      console.log(`Premium activated for user ${userId} — ${plan} plan`);
    }

    res.json({ received: true });
  }
);

export default router;