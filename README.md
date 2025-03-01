# LockIn Website

A landing page, authentication system, and payment portal for the LockIn productivity app.

## Features

- Modern, responsive landing page
- User authentication with Supabase
- Stripe integration for payments
- User dashboard for managing account and downloads
- Success page after payment
- **Task Management**: Create, organize, and prioritize your tasks
- **Focus Timer**: Stay productive with customizable focus sessions
- **Cross-Platform**: macOS support now, Windows coming soon
- **Subscription Model**: $2/month for full access

## User Flow

1. User visits the landing page
2. User clicks "Download Now" and is directed to the auth page
3. User signs up or signs in
4. New users are directed to the checkout page
5. After payment, users can access their dashboard to download the app
6. Returning users with active subscriptions go directly to their dashboard

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Stripe account
- Supabase account

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Stripe API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Product
NEXT_PUBLIC_PRODUCT_PRICE_ID=price_your_product_price_id
NEXT_PUBLIC_URL=http://localhost:3000
```

### Supabase Setup

1. Create a new Supabase project
2. Enable Email Auth in Authentication settings
3. Run the migration script in `supabase/migrations/20250301_initial_schema.sql` to set up the database schema

### Stripe Setup

1. Create a product in Stripe Dashboard
2. Create a price for the product
3. Copy the price ID to `NEXT_PUBLIC_PRODUCT_PRICE_ID` in your `.env.local` file
4. Set up a webhook in Stripe Dashboard pointing to `https://your-domain.com/api/webhook`
5. Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in your `.env.local` file

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Development

The main components of the application are:

- `app/page.tsx` - Main landing page
- `app/auth/page.tsx` - Authentication page (sign in/sign up)
- `app/dashboard/page.tsx` - User dashboard
- `app/checkout/page.tsx` - Checkout page
- `app/success/page.tsx` - Success page after payment
- `components/auth/sign-in-form.tsx` - Sign in form component
- `components/auth/sign-up-form.tsx` - Sign up form component
- `app/api/create-checkout-session/route.ts` - API route for creating Stripe checkout sessions
- `app/api/webhook/route.ts` - Webhook handler for Stripe events
- `app/api/user/route.ts` - API route for getting user data
- `app/api/download/route.ts` - API route for handling downloads
- `lib/stripe.ts` - Stripe client and helper functions
- `lib/supabase.ts` - Supabase client and helper functions

## Database Schema

### profiles
- `id` - UUID (primary key, references auth.users)
- `email` - TEXT (unique, not null)
- `username` - TEXT (unique)
- `has_active_subscription` - BOOLEAN
- `stripe_customer_id` - TEXT
- `last_login_at` - TIMESTAMPTZ
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

### subscriptions
- `id` - UUID (primary key)
- `user_id` - UUID (references profiles)
- `stripe_subscription_id` - TEXT
- `stripe_price_id` - TEXT
- `status` - TEXT
- `current_period_start` - TIMESTAMPTZ
- `current_period_end` - TIMESTAMPTZ
- `cancel_at_period_end` - BOOLEAN
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

### purchases
- `id` - UUID (primary key)
- `user_id` - UUID (references profiles)
- `stripe_checkout_id` - TEXT
- `stripe_payment_intent_id` - TEXT
- `stripe_price_id` - TEXT
- `amount` - INTEGER
- `currency` - TEXT
- `status` - TEXT
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

## App Distribution

### macOS App

The macOS app is available for download to users with an active subscription. The app is stored in a private Supabase storage bucket and is accessible only to authenticated users with an active subscription.

To upload a new version of the app:

1. Build the macOS app
2. Upload the DMG file to the `app-downloads` bucket in Supabase storage
3. Name the file `LockIn-mac.dmg`

### Windows App (Coming Soon)

Windows support is planned for a future release.

## Database Migrations

The project uses Supabase migrations to manage the database schema. To create a new migration:

1. Make your changes to the database schema
2. Run `npx supabase db diff -f your_migration_name` to generate a migration file
3. Apply the migration with `npx supabase db push`

## License

All rights reserved. This code is proprietary and confidential. 