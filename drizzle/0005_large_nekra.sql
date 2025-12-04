ALTER TABLE "student_profiles" ADD COLUMN "college_id" uuid;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_profiles_college_id_idx" ON "student_profiles" USING btree ("college_id");