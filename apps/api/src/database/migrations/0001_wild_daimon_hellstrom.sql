ALTER TABLE "interview_sessions" ALTER COLUMN "topics" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "interview_sessions" ALTER COLUMN "topics" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "expected_keywords" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;