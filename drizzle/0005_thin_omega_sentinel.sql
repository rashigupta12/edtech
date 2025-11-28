CREATE TABLE "user_course_coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_course_coupons" ADD CONSTRAINT "user_course_coupons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_course_coupons" ADD CONSTRAINT "user_course_coupons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_course_coupons" ADD CONSTRAINT "user_course_coupons_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_course_coupons" ADD CONSTRAINT "user_course_coupons_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_course_coupons_user_course_unique" ON "user_course_coupons" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "user_course_coupons_user_id_idx" ON "user_course_coupons" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_course_coupons_course_id_idx" ON "user_course_coupons" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "user_course_coupons_coupon_id_idx" ON "user_course_coupons" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "user_course_coupons_assigned_by_idx" ON "user_course_coupons" USING btree ("assigned_by");