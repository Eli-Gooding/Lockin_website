import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') || '';

  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing Stripe webhook secret');
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Get customer email from metadata
      const customerEmail = session.metadata?.customerEmail || session.customer_email;
      
      if (!customerEmail) {
        console.error('No customer email found in session');
        return NextResponse.json(
          { error: 'No customer email found' },
          { status: 400 }
        );
      }

      try {
        // Find user by email
        const { data: userProfiles, error: userError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', customerEmail);

        if (userError || !userProfiles || userProfiles.length === 0) {
          throw new Error(`User not found for email: ${customerEmail}`);
        }

        const userId = userProfiles[0].id;
        const stripeCustomerId = session.customer;
        const subscriptionId = session.subscription;

        // Update user's subscription status and Stripe customer ID
        await supabase
          .from('profiles')
          .update({
            has_active_subscription: true,
            stripe_customer_id: stripeCustomerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        // If this is a subscription, record it in the subscriptions table
        if (session.mode === 'subscription' && subscriptionId) {
          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: subscription.items.data[0]?.price.id,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        } else {
          // Record the one-time purchase
          await supabase
            .from('purchases')
            .insert({
              user_id: userId,
              stripe_checkout_id: session.id,
              stripe_payment_intent_id: session.payment_intent,
              stripe_price_id: session.line_items?.data[0]?.price?.id || process.env.NEXT_PUBLIC_PRODUCT_PRICE_ID,
              amount: session.amount_total,
              currency: session.currency,
              status: 'completed',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        }

        console.log(`Payment successful for ${customerEmail}`);
      } catch (error: any) {
        console.error(`Error processing payment: ${error.message}`);
        return NextResponse.json(
          { error: `Error processing payment: ${error.message}` },
          { status: 500 }
        );
      }
      break;
      
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      const subscriptionStatus = subscription.status;
      const subscriptionId = subscription.id;
      
      try {
        // Find the subscription in our database
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
          
        if (subError || !subscriptionData) {
          throw new Error(`Subscription not found: ${subscriptionId}`);
        }
        
        // Update the subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: subscriptionStatus,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        // Update the user's active subscription status
        const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
        await supabase
          .from('profiles')
          .update({
            has_active_subscription: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscriptionData.user_id);
          
        console.log(`Subscription ${subscriptionId} updated to ${subscriptionStatus}`);
      } catch (error: any) {
        console.error(`Error updating subscription: ${error.message}`);
        return NextResponse.json(
          { error: `Error updating subscription: ${error.message}` },
          { status: 500 }
        );
      }
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 