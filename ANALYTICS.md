# Analytics Implementation

This document outlines the analytics implementation for the LockIn website.

## Vercel Analytics

The website uses Vercel Analytics to track user behavior and application performance. This helps us understand how users interact with the site and identify areas for improvement.

### Components Used

1. **Vercel Analytics** - For tracking page views and custom events
2. **Vercel Speed Insights** - For monitoring performance metrics

### Setup

The analytics components are added to the root layout file (`app/layout.tsx`):

```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// In the layout component:
<Analytics />
<SpeedInsights />
```

## Custom Event Tracking

We've implemented custom event tracking to monitor specific user actions. The events are defined in `lib/analytics.ts` and used throughout the application.

### Tracked Events

#### Authentication Events
- `sign_up` - When a user creates a new account
- `sign_in` - When a user signs in
- `sign_out` - When a user signs out

#### Subscription Events
- `view_checkout` - When a user views the checkout page
- `start_checkout` - When a user initiates the checkout process
- `complete_purchase` - When a user completes a purchase

#### App Usage Events
- `download_app` - When a user downloads the app
- `view_dashboard` - When a user views their dashboard

#### Account Management
- `update_email` - When a user updates their email
- `update_password` - When a user updates their password

### Usage Example

```tsx
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

// Track a simple event
trackEvent(AnalyticsEvents.SIGN_IN);

// Track an event with properties
trackEvent(AnalyticsEvents.DOWNLOAD_APP, {
  platform: 'mac',
  userId: user.id
});
```

## Viewing Analytics Data

Analytics data can be viewed in the Vercel dashboard:

1. Go to your Vercel project
2. Navigate to the "Analytics" tab
3. View page views, custom events, and performance metrics

## Privacy Considerations

- User data is anonymized and aggregated
- No personally identifiable information is collected without consent
- Analytics respects user privacy settings and "Do Not Track" preferences 