CREATE TABLE "coupon_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type_code" varchar(2) NOT NULL,
	"type_name" text NOT NULL,
	"description" text,
	"discount_type" "discount_type" NOT NULL,
	"max_discount_limit" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_created_by_users_id_fk";
--> statement-breakpoint
DROP INDEX "coupons_created_by_idx";--> statement-breakpoint
ALTER TABLE "blogs" ALTER COLUMN "is_published" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "blogs" ALTER COLUMN "view_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "current_usage_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "certificate_issued" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "gst_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "discount_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "commission_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "commission_paid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_coupons" ALTER COLUMN "is_used" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "coupon_type_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "created_by_jyotishi_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "jyotishi_code" varchar(10);--> statement-breakpoint
ALTER TABLE "coupon_types" ADD CONSTRAINT "coupon_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_types_type_code_key" ON "coupon_types" USING btree ("type_code");--> statement-breakpoint
CREATE INDEX "coupon_types_is_active_idx" ON "coupon_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "coupon_types_type_name_idx" ON "coupon_types" USING btree ("type_name");--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_coupon_type_id_coupon_types_id_fk" FOREIGN KEY ("coupon_type_id") REFERENCES "public"."coupon_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_jyotishi_id_users_id_fk" FOREIGN KEY ("created_by_jyotishi_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commissions_student_id_idx" ON "commissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "coupons_created_by_jyotishi_idx" ON "coupons" USING btree ("created_by_jyotishi_id");--> statement-breakpoint
CREATE INDEX "coupons_coupon_type_idx" ON "coupons" USING btree ("coupon_type_id");--> statement-breakpoint
CREATE INDEX "coupons_valid_dates_idx" ON "coupons" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "payments_coupon_id_idx" ON "payments" USING btree ("coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_coupons_unique_idx" ON "user_coupons" USING btree ("user_id","coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_jyotishi_code_key" ON "users" USING btree ("jyotishi_code");--> statement-breakpoint
CREATE INDEX "users_jyotishi_code_idx" ON "users" USING btree ("jyotishi_code");--> statement-breakpoint
ALTER TABLE "coupons" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "coupons" DROP COLUMN "created_by";--> statement-breakpoint
DROP TYPE "public"."coupon_type";