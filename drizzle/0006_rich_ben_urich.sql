ALTER TABLE "faculty" ALTER COLUMN "college_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "enrollment_number" varchar(50);