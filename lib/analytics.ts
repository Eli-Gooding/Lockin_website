import { track } from '@vercel/analytics';

// Predefined events for consistent tracking
export const AnalyticsEvents = {
  // Authentication events
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  
  // Subscription events
  VIEW_CHECKOUT: 'view_checkout',
  START_CHECKOUT: 'start_checkout',
  COMPLETE_PURCHASE: 'complete_purchase',
  
  // App usage events
  DOWNLOAD_APP: 'download_app',
  APP_DOWNLOAD: 'app_download',
  VIEW_DASHBOARD: 'view_dashboard',
  
  // Account management
  UPDATE_EMAIL: 'update_email',
  UPDATE_PASSWORD: 'update_password',
};

/**
 * Track custom events with Vercel Analytics
 * @param eventName The name of the event to track
 * @param properties Optional properties to include with the event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, properties);
  }
  
  // Track with Vercel Analytics in production
  track(eventName, properties);
} 