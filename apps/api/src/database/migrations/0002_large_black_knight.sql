CREATE TABLE "company_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"culture" text[] DEFAULT '{}',
	"values" text[] DEFAULT '{}',
	"recent_news" text[] DEFAULT '{}',
	"interview_style" text NOT NULL,
	"common_questions" text[] DEFAULT '{}',
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"provider_email" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"provider_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_trends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"industry" text NOT NULL,
	"topic" text NOT NULL,
	"frequency" integer NOT NULL,
	"growth" numeric(5, 2),
	"related_skills" text[] DEFAULT '{}',
	"timeframe" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sample_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"structure" text NOT NULL,
	"key_points" text[] DEFAULT '{}',
	"estimated_duration" integer,
	"difficulty" text NOT NULL,
	"industry" text NOT NULL,
	"role" text NOT NULL,
	"tips" text[] DEFAULT '{}',
	"common_mistakes" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "source" text DEFAULT 'ai-generated';--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "freshness_score" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "relevance_score" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "company_specific" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "industry_trends" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "llm_provider" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "star_framework" jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "follow_up_questions" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "tips" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "oauth_providers" ADD CONSTRAINT "oauth_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_answers" ADD CONSTRAINT "sample_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_company_insights_company_name" ON "company_insights" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "idx_company_insights_interview_style" ON "company_insights" USING btree ("interview_style");--> statement-breakpoint
CREATE INDEX "idx_company_insights_last_updated" ON "company_insights" USING btree ("last_updated");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_provider" ON "oauth_providers" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_provider_account" ON "oauth_providers" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX "idx_question_trends_industry" ON "question_trends" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_question_trends_topic" ON "question_trends" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "idx_question_trends_timeframe" ON "question_trends" USING btree ("timeframe");--> statement-breakpoint
CREATE INDEX "idx_question_trends_frequency" ON "question_trends" USING btree ("frequency");--> statement-breakpoint
CREATE INDEX "idx_question_trends_last_updated" ON "question_trends" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "idx_question_trends_industry_timeframe" ON "question_trends" USING btree ("industry","timeframe");--> statement-breakpoint
CREATE INDEX "idx_question_trends_topic_frequency" ON "question_trends" USING btree ("topic","frequency");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_question_trends_unique" ON "question_trends" USING btree ("industry","topic","timeframe");--> statement-breakpoint
CREATE INDEX "idx_sample_answers_question_id" ON "sample_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_sample_answers_industry" ON "sample_answers" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_sample_answers_role" ON "sample_answers" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_sample_answers_difficulty" ON "sample_answers" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_sample_answers_structure" ON "sample_answers" USING btree ("structure");--> statement-breakpoint
CREATE INDEX "idx_sample_answers_industry_role" ON "sample_answers" USING btree ("industry","role");--> statement-breakpoint
CREATE INDEX "idx_sample_answers_difficulty_structure" ON "sample_answers" USING btree ("difficulty","structure");--> statement-breakpoint
CREATE INDEX "idx_questions_session_id" ON "questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_questions_type" ON "questions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_questions_difficulty" ON "questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_questions_source" ON "questions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_questions_company_specific" ON "questions" USING btree ("company_specific");--> statement-breakpoint
CREATE INDEX "idx_questions_llm_provider" ON "questions" USING btree ("llm_provider");--> statement-breakpoint
CREATE INDEX "idx_questions_created_at" ON "questions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_questions_updated_at" ON "questions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_questions_session_type" ON "questions" USING btree ("session_id","type");--> statement-breakpoint
CREATE INDEX "idx_questions_type_difficulty" ON "questions" USING btree ("type","difficulty");--> statement-breakpoint
CREATE INDEX "idx_questions_session_order" ON "questions" USING btree ("session_id","order");--> statement-breakpoint
CREATE INDEX "idx_questions_fresh" ON "questions" USING btree ("freshness_score") WHERE "questions"."freshness_score" > 0.7;--> statement-breakpoint
CREATE INDEX "idx_questions_relevant" ON "questions" USING btree ("relevance_score") WHERE "questions"."relevance_score" > 0.7;