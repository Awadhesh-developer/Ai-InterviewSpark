-- Migration: Add missing fields and connections for complete functionality
-- This migration adds all missing database fields identified in the analysis

-- ============================================================================
-- USER PREFERENCES AND SETTINGS
-- ============================================================================

-- Add notification preferences to users table
ALTER TABLE "users" ADD COLUMN "notification_preferences" jsonb DEFAULT '{
  "email": {
    "sessionReminders": true,
    "feedbackReady": true,
    "peerRequests": true,
    "expertMessages": true,
    "weeklyReports": true
  },
  "push": {
    "sessionReminders": true,
    "feedbackReady": true,
    "peerRequests": true,
    "expertMessages": true
  },
  "sms": {
    "sessionReminders": false,
    "urgentOnly": true
  }
}'::jsonb;

-- Add user settings
ALTER TABLE "users" ADD COLUMN "user_settings" jsonb DEFAULT '{
  "theme": "light",
  "timezone": "UTC",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12h",
  "language": "en",
  "notifications": {
    "email": true,
    "push": true,
    "sms": false
  },
  "privacy": {
    "profileVisibility": "public",
    "showEmail": false,
    "showPhone": false
  },
  "interview": {
    "defaultDifficulty": "intermediate",
    "defaultDuration": 30,
    "autoSave": true,
    "showHints": true
  }
}'::jsonb;

-- Add phone number for SMS notifications
ALTER TABLE "users" ADD COLUMN "phone_number" text;

-- Add user status and activity tracking
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));
ALTER TABLE "users" ADD COLUMN "last_activity_at" timestamp;
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;
ALTER TABLE "users" ADD COLUMN "password_reset_token" text;
ALTER TABLE "users" ADD COLUMN "password_reset_expires_at" timestamp;

-- ============================================================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE "push_subscriptions" (
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

-- Create indexes for push subscriptions
CREATE INDEX "idx_push_subscriptions_user_id" ON "push_subscriptions"("user_id");
CREATE INDEX "idx_push_subscriptions_endpoint" ON "push_subscriptions"("endpoint");
CREATE INDEX "idx_push_subscriptions_active" ON "push_subscriptions"("is_active");

-- ============================================================================
-- SESSION STATE MANAGEMENT
-- ============================================================================

-- Add session state tracking
ALTER TABLE "interview_sessions" ADD COLUMN "current_question_id" uuid REFERENCES "questions"("id");
ALTER TABLE "interview_sessions" ADD COLUMN "session_state" jsonb DEFAULT '{
  "currentStep": "waiting",
  "questionIndex": 0,
  "totalQuestions": 0,
  "timeRemaining": 0,
  "isPaused": false,
  "pausedAt": null,
  "resumedAt": null
}'::jsonb;

-- Add real-time session data
ALTER TABLE "interview_sessions" ADD COLUMN "real_time_data" jsonb DEFAULT '{
  "emotionData": [],
  "voiceAnalysis": [],
  "facialAnalysis": [],
  "performanceMetrics": {},
  "liveFeedback": []
}'::jsonb;

-- ============================================================================
-- WEBSOCKET CONNECTION MANAGEMENT
-- ============================================================================

CREATE TABLE "websocket_connections" (
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

-- Create indexes for websocket connections
CREATE INDEX "idx_websocket_connections_user_id" ON "websocket_connections"("user_id");
CREATE INDEX "idx_websocket_connections_session_id" ON "websocket_connections"("session_id");
CREATE INDEX "idx_websocket_connections_active" ON "websocket_connections"("is_active");
CREATE INDEX "idx_websocket_connections_connection_id" ON "websocket_connections"("connection_id");

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

CREATE TABLE "performance_metrics_data" (
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

-- Create indexes for performance metrics
CREATE INDEX "idx_performance_metrics_session_id" ON "performance_metrics_data"("session_id");
CREATE INDEX "idx_performance_metrics_user_id" ON "performance_metrics_data"("user_id");
CREATE INDEX "idx_performance_metrics_type" ON "performance_metrics_data"("metric_type");
CREATE INDEX "idx_performance_metrics_recorded_at" ON "performance_metrics_data"("recorded_at");

-- ============================================================================
-- CACHE MANAGEMENT
-- ============================================================================

CREATE TABLE "cache_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cache_key" text NOT NULL UNIQUE,
  "cache_value" jsonb NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "hit_count" integer DEFAULT 0 NOT NULL,
  "last_accessed_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for cache entries
CREATE INDEX "idx_cache_entries_key" ON "cache_entries"("cache_key");
CREATE INDEX "idx_cache_entries_expires_at" ON "cache_entries"("expires_at");
CREATE INDEX "idx_cache_entries_last_accessed" ON "cache_entries"("last_accessed_at");

-- ============================================================================
-- USER ACTIVITY TRACKING
-- ============================================================================

CREATE TABLE "user_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "activity_type" text NOT NULL,
  "activity_description" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for user activities
CREATE INDEX "idx_user_activities_user_id" ON "user_activities"("user_id");
CREATE INDEX "idx_user_activities_type" ON "user_activities"("activity_type");
CREATE INDEX "idx_user_activities_created_at" ON "user_activities"("created_at");

-- ============================================================================
-- ENHANCED FEEDBACK SYSTEM
-- ============================================================================

-- Add more detailed feedback fields
ALTER TABLE "feedback" ADD COLUMN "confidence_score" numeric(3,2);
ALTER TABLE "feedback" ADD COLUMN "improvement_suggestions" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "feedback" ADD COLUMN "strengths_identified" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "feedback" ADD COLUMN "weaknesses_identified" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "feedback" ADD COLUMN "ai_model_used" text;
ALTER TABLE "feedback" ADD COLUMN "processing_time_ms" integer;

-- ============================================================================
-- ENHANCED QUESTIONS SYSTEM
-- ============================================================================

-- Add more question metadata
ALTER TABLE "questions" ADD COLUMN "question_variants" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "questions" ADD COLUMN "difficulty_factors" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "questions" ADD COLUMN "scoring_criteria" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "questions" ADD COLUMN "usage_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "questions" ADD COLUMN "success_rate" numeric(5,2);
ALTER TABLE "questions" ADD COLUMN "average_time_spent" integer;

-- ============================================================================
-- ENHANCED ANSWERS SYSTEM
-- ============================================================================

-- Add more answer tracking
ALTER TABLE "answers" ADD COLUMN "answer_quality_score" numeric(3,2);
ALTER TABLE "answers" ADD COLUMN "confidence_level" numeric(3,2);
ALTER TABLE "answers" ADD COLUMN "revision_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "answers" ADD COLUMN "is_draft" boolean DEFAULT false NOT NULL;
ALTER TABLE "answers" ADD COLUMN "submitted_at" timestamp;
ALTER TABLE "answers" ADD COLUMN "last_modified_at" timestamp DEFAULT now() NOT NULL;

-- ============================================================================
-- ENHANCED RESUME SYSTEM
-- ============================================================================

-- Add more resume analysis fields
ALTER TABLE "resumes" ADD COLUMN "analysis_version" text DEFAULT '1.0';
ALTER TABLE "resumes" ADD COLUMN "analysis_metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "resumes" ADD COLUMN "optimization_suggestions" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "resumes" ADD COLUMN "compatibility_score" numeric(5,2);
ALTER TABLE "resumes" ADD COLUMN "last_analyzed_at" timestamp;
ALTER TABLE "resumes" ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;

-- ============================================================================
-- ENHANCED EXPERT SYSTEM
-- ============================================================================

-- Add more expert profile fields
ALTER TABLE "expert_profiles" ADD COLUMN "bio" text;
ALTER TABLE "expert_profiles" ADD COLUMN "profile_picture" text;
ALTER TABLE "expert_profiles" ADD COLUMN "languages" text[] DEFAULT '{}';
ALTER TABLE "expert_profiles" ADD COLUMN "timezone" text;
ALTER TABLE "expert_profiles" ADD COLUMN "response_time_hours" integer DEFAULT 24;
ALTER TABLE "expert_profiles" ADD COLUMN "cancellation_policy" text;
ALTER TABLE "expert_profiles" ADD COLUMN "refund_policy" text;

-- ============================================================================
-- ENHANCED NOTIFICATION SYSTEM
-- ============================================================================

-- Add more notification fields
ALTER TABLE "notifications" ADD COLUMN "priority" text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE "notifications" ADD COLUMN "delivery_status" text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'));
ALTER TABLE "notifications" ADD COLUMN "delivery_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "notifications" ADD COLUMN "delivered_at" timestamp;
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;
ALTER TABLE "notifications" ADD COLUMN "expires_at" timestamp;

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

CREATE TABLE "system_configurations" (
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

-- Create indexes for system configurations
CREATE INDEX "idx_system_configurations_key" ON "system_configurations"("config_key");
CREATE INDEX "idx_system_configurations_type" ON "system_configurations"("config_type");
CREATE INDEX "idx_system_configurations_active" ON "system_configurations"("is_active");

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE "audit_logs" (
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

-- Create indexes for audit logs
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs"("resource_type", "resource_id");
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints for new tables
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "websocket_connections" ADD CONSTRAINT "websocket_connections_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "websocket_connections" ADD CONSTRAINT "websocket_connections_session_id_fk" 
  FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE;

ALTER TABLE "performance_metrics_data" ADD CONSTRAINT "performance_metrics_session_id_fk" 
  FOREIGN KEY ("session_id") REFERENCES "interview_sessions"("id") ON DELETE CASCADE;

ALTER TABLE "performance_metrics_data" ADD CONSTRAINT "performance_metrics_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "system_configurations" ADD CONSTRAINT "system_configurations_updated_by_fk" 
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;

-- ============================================================================
-- UPDATE EXISTING CONSTRAINTS
-- ============================================================================

-- Update users table constraints
ALTER TABLE "users" ADD CONSTRAINT "users_status_check" 
  CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));

-- Update interview_sessions table constraints
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_current_question_fk" 
  FOREIGN KEY ("current_question_id") REFERENCES "questions"("id") ON DELETE SET NULL;

-- ============================================================================
-- CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON "push_subscriptions" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websocket_connections_updated_at BEFORE UPDATE ON "websocket_connections" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_entries_updated_at BEFORE UPDATE ON "cache_entries" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configurations_updated_at BEFORE UPDATE ON "system_configurations" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT DEFAULT SYSTEM CONFIGURATIONS
-- ============================================================================

INSERT INTO "system_configurations" ("config_key", "config_value", "config_type", "description") VALUES
('app_version', '"1.0.0"', 'string', 'Current application version'),
('maintenance_mode', 'false', 'boolean', 'Maintenance mode status'),
('max_file_size_mb', '100', 'number', 'Maximum file upload size in MB'),
('session_timeout_minutes', '30', 'number', 'Session timeout in minutes'),
('notification_retry_attempts', '3', 'number', 'Number of notification retry attempts'),
('cache_ttl_seconds', '3600', 'number', 'Default cache TTL in seconds'),
('rate_limit_requests_per_minute', '100', 'number', 'Rate limit for API requests'),
('ai_provider_default', '"openai"', 'string', 'Default AI provider'),
('email_templates_version', '"1.0"', 'string', 'Email templates version'),
('feature_flags', '{"new_ui": false, "beta_features": false, "advanced_analytics": true}', 'object', 'Feature flags configuration');

-- ============================================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active user sessions view
CREATE VIEW "active_user_sessions" AS
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  s.id as session_id,
  s.title,
  s.status,
  s.started_at,
  s.current_question_id,
  wc.connection_id,
  wc.connected_at
FROM "users" u
JOIN "interview_sessions" s ON u.id = s.user_id
LEFT JOIN "websocket_connections" wc ON s.id = wc.session_id AND wc.is_active = true
WHERE s.status = 'in_progress';

-- User activity summary view
CREATE VIEW "user_activity_summary" AS
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT a.id) as total_answers,
  COUNT(DISTINCT f.id) as total_feedback,
  MAX(ua.created_at) as last_activity,
  COUNT(DISTINCT CASE WHEN ua.activity_type = 'login' THEN ua.id END) as login_count
FROM "users" u
LEFT JOIN "interview_sessions" s ON u.id = s.user_id
LEFT JOIN "answers" a ON s.id = a.session_id
LEFT JOIN "feedback" f ON a.id = f.answer_id
LEFT JOIN "user_activities" ua ON u.id = ua.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- Performance metrics summary view
CREATE VIEW "performance_metrics_summary" AS
SELECT 
  s.id as session_id,
  s.user_id,
  s.title,
  s.difficulty,
  pm.overall_score,
  pm.session_duration,
  pm.questions_answered,
  COUNT(DISTINCT a.id) as total_answers,
  AVG(f.score) as average_feedback_score,
  MAX(pmd.recorded_at) as last_metric_update
FROM "interview_sessions" s
LEFT JOIN "performance_metrics" pm ON s.id = pm.session_id
LEFT JOIN "answers" a ON s.id = a.session_id
LEFT JOIN "feedback" f ON a.id = f.answer_id
LEFT JOIN "performance_metrics_data" pmd ON s.id = pmd.session_id
GROUP BY s.id, s.user_id, s.title, s.difficulty, pm.overall_score, pm.session_duration, pm.questions_answered;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX "idx_users_status_activity" ON "users"("status", "last_activity_at");
CREATE INDEX "idx_sessions_user_status" ON "interview_sessions"("user_id", "status");
CREATE INDEX "idx_questions_session_type" ON "questions"("session_id", "type");
CREATE INDEX "idx_answers_session_user" ON "answers"("session_id", "user_id");
CREATE INDEX "idx_feedback_answer_category" ON "feedback"("answer_id", "category");
CREATE INDEX "idx_notifications_user_read" ON "notifications"("user_id", "is_read");
CREATE INDEX "idx_activities_user_type" ON "user_activities"("user_id", "activity_type");

-- Partial indexes for active records
CREATE INDEX "idx_active_websocket_connections" ON "websocket_connections"("user_id", "session_id") 
  WHERE "is_active" = true;

CREATE INDEX "idx_active_push_subscriptions" ON "push_subscriptions"("user_id") 
  WHERE "is_active" = true;

CREATE INDEX "idx_unexpired_cache_entries" ON "cache_entries"("cache_key") 
  WHERE "expires_at" > now();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for the application user
-- (Adjust the username as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO interviewspark_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO interviewspark_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO interviewspark_user;
