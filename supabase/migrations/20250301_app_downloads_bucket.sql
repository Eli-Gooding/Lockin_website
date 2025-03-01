-- Create a storage bucket for app downloads
-- This bucket will be private (not public) to ensure only authenticated users with active subscriptions can download the app

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Create the app-downloads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('app-downloads', 'app-downloads', false, false, 1073741824, '{application/x-apple-diskimage,application/octet-stream,application/x-msdownload}')
ON CONFLICT (id) DO NOTHING;

-- Create a policy to allow only authenticated users with active subscriptions to download files
CREATE POLICY "Downloads require active subscription" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'app-downloads' AND 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND has_active_subscription = true
        )
    );

-- Create a policy to allow service role to manage files in the bucket
CREATE POLICY "Service role can manage app downloads" ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'app-downloads');

-- Create a trigger to update the has_active_subscription field in profiles when a subscription is created or updated
CREATE OR REPLACE FUNCTION public.handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the profile's subscription status
    UPDATE public.profiles
    SET has_active_subscription = (NEW.status = 'active')
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'subscription_change_trigger'
    ) THEN
        CREATE TRIGGER subscription_change_trigger
        AFTER INSERT OR UPDATE ON public.subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_subscription_change();
    END IF;
END
$$; 