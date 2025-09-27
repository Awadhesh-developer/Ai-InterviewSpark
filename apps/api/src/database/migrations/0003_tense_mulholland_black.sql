CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cache_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"cache_value" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"hit_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cache_entries_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "performance_metrics_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"user_id" uuid,
	"metric_type" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" numeric(10, 4) NOT NULL,
	"metric_unit" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" text NOT NULL,
	"config_value" jsonb NOT NULL,
	"config_type" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_configurations_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "user_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"activity_description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "websocket_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"connection_id" text NOT NULL,
	"socket_id" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"disconnected_at" timestamp,
	"last_ping_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD COLUMN "current_question_id" uuid;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD COLUMN "session_state" jsonb DEFAULT '{"currentStep":"waiting","questionIndex":0,"totalQuestions":0,"timeRemaining":0,"isPaused":false,"pausedAt":null,"resumedAt":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD COLUMN "real_time_data" jsonb DEFAULT '{"emotionData":[],"voiceAnalysis":[],"facialAnalysis":[],"performanceMetrics":{},"liveFeedback":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "priority" text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "delivery_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "delivery_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_activity_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_preferences" jsonb DEFAULT '{"email":{"sessionReminders":true,"feedbackReady":true,"peerRequests":true,"expertMessages":true,"weeklyReports":true},"push":{"sessionReminders":true,"feedbackReady":true,"peerRequests":true,"expertMessages":true},"sms":{"sessionReminders":false,"urgentOnly":true}}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_settings" jsonb DEFAULT '{"theme":"light","timezone":"UTC","dateFormat":"MM/DD/YYYY","timeFormat":"12h","language":"en","notifications":{"email":true,"push":true,"sms":false},"privacy":{"profileVisibility":"public","showEmail":false,"showPhone":false},"interview":{"defaultDifficulty":"intermediate","defaultDuration":30,"autoSave":true,"showHints":true}}'::jsonb;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics_data" ADD CONSTRAINT "performance_metrics_data_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics_data" ADD CONSTRAINT "performance_metrics_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_configurations" ADD CONSTRAINT "system_configurations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websocket_connections" ADD CONSTRAINT "websocket_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websocket_connections" ADD CONSTRAINT "websocket_connections_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_resource" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_cache_entries_key" ON "cache_entries" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "idx_cache_entries_expires_at" ON "cache_entries" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_cache_entries_last_accessed" ON "cache_entries" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_session_id" ON "performance_metrics_data" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_user_id" ON "performance_metrics_data" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_type" ON "performance_metrics_data" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_recorded_at" ON "performance_metrics_data" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_user_id" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_active" ON "push_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_system_configurations_key" ON "system_configurations" USING btree ("config_key");--> statement-breakpoint
CREATE INDEX "idx_system_configurations_type" ON "system_configurations" USING btree ("config_type");--> statement-breakpoint
CREATE INDEX "idx_system_configurations_active" ON "system_configurations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_activities_user_id" ON "user_activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_activities_type" ON "user_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_user_activities_created_at" ON "user_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_websocket_connections_user_id" ON "websocket_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_websocket_connections_session_id" ON "websocket_connections" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_websocket_connections_active" ON "websocket_connections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_websocket_connections_connection_id" ON "websocket_connections" USING btree ("connection_id");--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_current_question_id_questions_id_fk" FOREIGN KEY ("current_question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;