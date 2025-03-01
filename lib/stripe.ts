import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia', // Use the latest API version
});

export async function createCheckoutSession(customerEmail: string) {
  const priceId = process.env.NEXT_PUBLIC_PRODUCT_PRICE_ID;
  
  if (!priceId) {
    throw new Error('Missing product price ID');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL || 'https://lockin.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://lockin.app'}`,
    customer_email: customerEmail,
    metadata: {
      customerEmail,
    },
  });

  return session;
} 