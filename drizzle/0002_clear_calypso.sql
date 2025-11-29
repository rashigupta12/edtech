CREATE TYPE "public"."faculty_role" AS ENUM('PROFESSOR', 'ASSOCIATE_PROFESSOR', 'ASSISTANT_PROFESSOR', 'LECTURER', 'VISITING_FACULTY', 'HOD');--> statement-breakpoint
CREATE TYPE "public"."faculty_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."question_difficulty" AS ENUM('EASY', 'MEDIUM', 'HARD');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('ENROLLMENT', 'REVENUE', 'PROGRESS', 'PERFORMANCE', 'ATTENDANCE');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'FACULTY' BEFORE 'STUDENT';--> statement-breakpoint
CREATE TABLE "batch_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"faculty_id" uuid,
	"semester" integer,
	"academic_year" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"roll_number" text,
	"enrollment_date" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"department_id" uuid,
	"name" text NOT NULL,
	"code" varchar(20),
	"academic_year" text NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_faculty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"faculty_id" uuid NOT NULL,
	"is_primary_instructor" boolean DEFAULT false NOT NULL,
	"teaching_role" text DEFAULT 'INSTRUCTOR',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(10),
	"description" text,
	"head_of_department" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discussion_forums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"date_of_birth" timestamp,
	"gender" "gender",
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'India',
	"pin_code" text,
	"qualifications" jsonb NOT NULL,
	"areas_of_expertise" jsonb,
	"total_experience" integer,
	"teaching_experience" integer,
	"publications" jsonb,
	"awards" jsonb,
	"research_interests" jsonb,
	"office_address" text,
	"office_hours" jsonb,
	"website" text,
	"linkedin_url" text,
	"google_scholar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"department_id" uuid,
	"employee_id" text,
	"faculty_role" "faculty_role" DEFAULT 'LECTURER' NOT NULL,
	"designation" text NOT NULL,
	"employment_type" text DEFAULT 'FULL_TIME',
	"joining_date" timestamp,
	"leaving_date" timestamp,
	"status" "faculty_status" DEFAULT 'ACTIVE' NOT NULL,
	"can_create_courses" boolean DEFAULT false NOT NULL,
	"can_approve_content" boolean DEFAULT false NOT NULL,
	"can_manage_students" boolean DEFAULT false NOT NULL,
	"can_schedule_sessions" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forum_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" text,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"department_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"tags" jsonb,
	"is_shared" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "report_type" NOT NULL,
	"description" text,
	"filters" jsonb,
	"data" jsonb,
	"is_scheduled" boolean DEFAULT false NOT NULL,
	"schedule_frequency" text,
	"last_generated_at" timestamp,
	"created_by" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"date_of_birth" timestamp,
	"gender" "gender",
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'India',
	"pin_code" text,
	"education_level" text,
	"institution" text,
	"current_semester" integer,
	"specialization" text,
	"academic_records" jsonb,
	"skills" jsonb,
	"resume_url" text,
	"linkedin_url" text,
	"github_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD COLUMN "question_bank_id" uuid;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD COLUMN "difficulty" "question_difficulty" DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "faculty_id" uuid;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "faculty_id" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "faculty_id" uuid;--> statement-breakpoint
ALTER TABLE "batch_courses" ADD CONSTRAINT "batch_courses_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_courses" ADD CONSTRAINT "batch_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_courses" ADD CONSTRAINT "batch_courses_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_enrollments" ADD CONSTRAINT "batch_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_faculty" ADD CONSTRAINT "course_faculty_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_faculty" ADD CONSTRAINT "course_faculty_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_of_department_users_id_fk" FOREIGN KEY ("head_of_department") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_forums" ADD CONSTRAINT "discussion_forums_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discussion_forums" ADD CONSTRAINT "discussion_forums_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_forum_id_discussion_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."discussion_forums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_courses_batch_id_idx" ON "batch_courses" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "batch_courses_course_id_idx" ON "batch_courses" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "batch_courses_unique_idx" ON "batch_courses" USING btree ("batch_id","course_id");--> statement-breakpoint
CREATE INDEX "batch_enrollments_batch_id_idx" ON "batch_enrollments" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "batch_enrollments_user_id_idx" ON "batch_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "batch_enrollments_unique_idx" ON "batch_enrollments" USING btree ("batch_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "batch_enrollments_roll_number_unique" ON "batch_enrollments" USING btree ("batch_id","roll_number");--> statement-breakpoint
CREATE INDEX "batches_college_id_idx" ON "batches" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "batches_department_id_idx" ON "batches" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "batches_academic_year_idx" ON "batches" USING btree ("academic_year");--> statement-breakpoint
CREATE UNIQUE INDEX "batches_college_code_unique" ON "batches" USING btree ("college_id","code");--> statement-breakpoint
CREATE INDEX "course_faculty_course_id_idx" ON "course_faculty" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_faculty_faculty_id_idx" ON "course_faculty" USING btree ("faculty_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_faculty_unique_idx" ON "course_faculty" USING btree ("course_id","faculty_id");--> statement-breakpoint
CREATE INDEX "departments_college_id_idx" ON "departments" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "departments_is_active_idx" ON "departments" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_college_code_unique" ON "departments" USING btree ("college_id","code");--> statement-breakpoint
CREATE INDEX "discussion_forums_course_id_idx" ON "discussion_forums" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "discussion_forums_is_locked_idx" ON "discussion_forums" USING btree ("is_locked");--> statement-breakpoint
CREATE INDEX "discussion_forums_is_pinned_idx" ON "discussion_forums" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "faculty_profiles_expertise_idx" ON "faculty_profiles" USING btree ("areas_of_expertise");--> statement-breakpoint
CREATE INDEX "faculty_college_id_idx" ON "faculty" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "faculty_user_id_idx" ON "faculty" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "faculty_department_id_idx" ON "faculty" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "faculty_status_idx" ON "faculty" USING btree ("status");--> statement-breakpoint
CREATE INDEX "faculty_is_active_idx" ON "faculty" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "faculty_employee_id_key" ON "faculty" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "faculty_user_college_unique" ON "faculty" USING btree ("user_id","college_id");--> statement-breakpoint
CREATE INDEX "forum_posts_forum_id_idx" ON "forum_posts" USING btree ("forum_id");--> statement-breakpoint
CREATE INDEX "forum_posts_user_id_idx" ON "forum_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "forum_posts_parent_id_idx" ON "forum_posts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "forum_posts_is_pinned_idx" ON "forum_posts" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "question_banks_college_id_idx" ON "question_banks" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "question_banks_department_id_idx" ON "question_banks" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "question_banks_is_shared_idx" ON "question_banks" USING btree ("is_shared");--> statement-breakpoint
CREATE UNIQUE INDEX "question_banks_name_college_unique" ON "question_banks" USING btree ("college_id","name");--> statement-breakpoint
CREATE INDEX "reports_type_idx" ON "reports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "reports_created_by_idx" ON "reports" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "reports_is_scheduled_idx" ON "reports" USING btree ("is_scheduled");--> statement-breakpoint
CREATE INDEX "reports_is_active_idx" ON "reports" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "student_profiles_education_level_idx" ON "student_profiles" USING btree ("education_level");--> statement-breakpoint
CREATE INDEX "student_profiles_institution_idx" ON "student_profiles" USING btree ("institution");--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_question_bank_id_question_banks_id_fk" FOREIGN KEY ("question_bank_id") REFERENCES "public"."question_banks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_batch_id_idx" ON "announcements" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "assessment_questions_question_bank_id_idx" ON "assessment_questions" USING btree ("question_bank_id");--> statement-breakpoint
CREATE INDEX "assessment_questions_difficulty_idx" ON "assessment_questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "assessments_faculty_id_idx" ON "assessments" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "assignments_faculty_id_idx" ON "assignments" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "courses_department_id_idx" ON "courses" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "sessions_faculty_id_idx" ON "sessions" USING btree ("faculty_id");