-- Essential migration to create missing tables

-- Add missing columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_activity_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notification_preferences" jsonb DEFAULT '{}';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "user_settings" jsonb DEFAULT '{}';

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "endpoint" text NOT NULL,
  "p256dh_key" text NOT NULL,
  "auth_key" text NOT NULL,
  "user_agent" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp
);

-- Create websocket_connections table
CREATE TABLE IF NOT EXISTS "websocket_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "session_id" uuid REFERENCES "interview_sessions"("id") ON DELETE CASCADE,
  "connection_id" text NOT NULL,
  "socket_id" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "connected_at" timestamp DEFAULT now() NOT NULL,
  "disconnected_at" timestamp,
  "last_ping_at" timestamp DEFAULT now() NOT NULL
);

-- Create performance_metrics_data table
CREATE TABLE IF NOT EXISTS "performance_metrics_data" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid REFERENCES "interview_sessions"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
  "metric_type" text NOT NULL,
  "metric_name" text NOT NULL,
  "metric_value" numeric NOT NULL,
  "metric_unit" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "recorded_at" timestamp DEFAULT now() NOT NULL
);

-- Create cache_entries table
CREATE TABLE IF NOT EXISTS "cache_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cache_key" text NOT NULL UNIQUE,
  "cache_value" jsonb NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "hit_count" integer DEFAULT 0 NOT NULL,
  "last_accessed_at" timestamp DEFAULT now() NOT NULL
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS "user_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "activity_type" text NOT NULL,
  "activity_description" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create system_configurations table
CREATE TABLE IF NOT EXISTS "system_configurations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "config_key" text NOT NULL UNIQUE,
  "config_value" jsonb NOT NULL,
  "config_type" text NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "updated_by" uuid REFERENCES "users"("id")
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" uuid,
  "old_values" jsonb,
  "new_values" jsonb,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
