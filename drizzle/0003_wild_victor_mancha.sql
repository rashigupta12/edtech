CREATE TYPE "public"."commission_status" AS ENUM('PENDING', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'JYOTISHI';--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jyotishi_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"coupon_id" uuid,
	"commission_rate" numeric(5, 2) NOT NULL,
	"sale_amount" numeric(10, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"status" "commission_status" DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp,
	"payout_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jyotishi_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payout_status" DEFAULT 'PENDING' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processed_by" uuid,
	"payment_method" text,
	"transaction_id" text,
	"transaction_proof" text,
	"bank_details" jsonb,
	"notes" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "jyotishi_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "commission_amount" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "commission_paid" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "commission_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_ifsc_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_account_holder_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pan_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_jyotishi_id_users_id_fk" FOREIGN KEY ("jyotishi_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_jyotishi_id_users_id_fk" FOREIGN KEY ("jyotishi_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commissions_jyotishi_id_idx" ON "commissions" USING btree ("jyotishi_id");--> statement-breakpoint
CREATE INDEX "commissions_payment_id_idx" ON "commissions" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "commissions_status_idx" ON "commissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "commissions_payout_id_idx" ON "commissions" USING btree ("payout_id");--> statement-breakpoint
CREATE INDEX "payouts_jyotishi_id_idx" ON "payouts" USING btree ("jyotishi_id");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payouts_processed_by_idx" ON "payouts" USING btree ("processed_by");--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_jyotishi_id_users_id_fk" FOREIGN KEY ("jyotishi_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupons_created_by_idx" ON "coupons" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "payments_jyotishi_id_idx" ON "payments" USING btree ("jyotishi_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");