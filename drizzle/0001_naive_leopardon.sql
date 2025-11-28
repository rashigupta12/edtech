ALTER TABLE "colleges" DROP CONSTRAINT "colleges_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "colleges" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "colleges" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;