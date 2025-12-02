CREATE TYPE "public"."assessment_level" AS ENUM('LESSON_QUIZ', 'MODULE_ASSESSMENT', 'COURSE_FINAL');--> statement-breakpoint
CREATE TYPE "public"."attempt_status" AS ENUM('IN_PROGRESS', 'COMPLETED', 'ABANDONED');--> statement-breakpoint
CREATE TABLE "lesson_completion_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"require_video_watched" boolean DEFAULT false NOT NULL,
	"min_video_watch_percentage" integer DEFAULT 90 NOT NULL,
	"require_quiz_passed" boolean DEFAULT false NOT NULL,
	"require_resources_viewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_lessons" RENAME COLUMN "quiz_url" TO "has_quiz";--> statement-breakpoint
ALTER TABLE "assessment_attempts" ALTER COLUMN "score" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ALTER COLUMN "percentage" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ALTER COLUMN "passed" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "status" "attempt_status" DEFAULT 'IN_PROGRESS' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "question_details" jsonb;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "time_spent" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD COLUMN "negative_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "lesson_id" uuid;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "assessment_level" "assessment_level" DEFAULT 'LESSON_QUIZ' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "time_limit" integer;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "show_correct_answers" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "allow_retake" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "randomize_questions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "available_from" timestamp;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "available_until" timestamp;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD COLUMN "quiz_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "course_modules" ADD COLUMN "has_assessment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "course_modules" ADD COLUMN "assessment_required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "course_modules" ADD COLUMN "minimum_passing_score" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "course_modules" ADD COLUMN "require_all_lessons_complete" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "has_final_assessment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "final_assessment_required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "minimum_course_passing_score" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "require_all_modules_complete" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "require_all_assessments_passed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "overall_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "final_assessment_score" integer;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "average_quiz_score" integer;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "completed_lessons" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "total_lessons" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "completed_assessments" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "total_assessments" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "video_percentage_watched" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "quiz_attempted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "quiz_score" integer;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "quiz_passed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "last_quiz_attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "resources_viewed" jsonb;--> statement-breakpoint
ALTER TABLE "lesson_completion_rules" ADD CONSTRAINT "lesson_completion_rules_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_completion_rules_lesson_id_idx" ON "lesson_completion_rules" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_completion_rules_lesson_unique" ON "lesson_completion_rules" USING btree ("lesson_id");--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_last_quiz_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("last_quiz_attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_attempts_status_idx" ON "assessment_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assessment_attempts_passed_idx" ON "assessment_attempts" USING btree ("passed");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_attempts_unique_idx" ON "assessment_attempts" USING btree ("assessment_id","user_id","attempt_number");--> statement-breakpoint
CREATE INDEX "assessments_lesson_id_idx" ON "assessments" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "assessments_assessment_level_idx" ON "assessments" USING btree ("assessment_level");--> statement-breakpoint
CREATE UNIQUE INDEX "assessments_lesson_unique" ON "assessments" USING btree ("lesson_id") WHERE "assessments"."lesson_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "lesson_progress_is_completed_idx" ON "lesson_progress" USING btree ("is_completed");