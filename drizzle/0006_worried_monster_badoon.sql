CREATE TABLE "course_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"session_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"session_date" timestamp NOT NULL,
	"session_time" text NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"meeting_link" text,
	"meeting_passcode" text,
	"recording_url" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "created_by_jyotishi_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_sessions_course_id_idx" ON "course_sessions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_sessions_date_idx" ON "course_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE UNIQUE INDEX "course_sessions_course_session_unique" ON "course_sessions" USING btree ("course_id","session_number");