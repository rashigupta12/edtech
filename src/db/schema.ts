import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  integer,
  boolean,
  decimal,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =====================
// Enums
// =====================

export const UserRole = pgEnum("user_role", ["ADMIN", "USER", "JYOTISHI"]);
export const PaymentStatus = pgEnum("payment_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);
export const PaymentType = pgEnum("payment_type", ["DOMESTIC", "FOREX"]);
export const DiscountType = pgEnum("discount_type", [
  "PERCENTAGE",
  "FIXED_AMOUNT",
]);
export const CourseStatus = pgEnum("course_status", [
  "DRAFT",
  "UPCOMING",
  "REGISTRATION_OPEN",
  "ONGOING",
  "COMPLETED",
  "ARCHIVED",
]);
export const EnrollmentStatus = pgEnum("enrollment_status", [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
]);
export const CommissionStatus = pgEnum("commission_status", [
  "PENDING",
  "PAID",
  "CANCELLED",
]);
export const PayoutStatus = pgEnum("payout_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "REJECTED",
]);

// =====================
// User Tables
// =====================

export const UsersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    password: text("password").notNull(),
    mobile: text("mobile"),
    role: UserRole("role").default("USER").notNull(),
    
    // User specific fields
    gstNumber: text("gst_number"),
    isGstVerified: boolean("is_gst_verified").default(false),
    
    // Jyotishi specific fields
    jyotishiCode: varchar("jyotishi_code", { length: 10 }), // JD001, AS001, BK001
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }), // 10.00 = 10%
    bankAccountNumber: text("bank_account_number"),
    bankIfscCode: text("bank_ifsc_code"),
    bankAccountHolderName: text("bank_account_holder_name"),
    panNumber: text("pan_number"),
    isActive: boolean("is_active").default(true),
    bankName:text("bank_name"),
    bankBranchName:text("bank_branch_name"),
    cancelledChequeImage:text("cancelled_cheque_image"),   
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_email_key").on(table.email),
    uniqueIndex("users_jyotishi_code_key").on(table.jyotishiCode),
    index("users_name_email_mobile_idx").on(
      table.name,
      table.email,
      table.mobile
    ),
    index("users_role_idx").on(table.role),
    index("users_jyotishi_code_idx").on(table.jyotishiCode),
  ]
);

// User Address Table
export const UserAddressTable = pgTable(
  "user_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pinCode: text("pin_code").notNull(),
    country: text("country").default("India").notNull(),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("user_addresses_user_id_idx").on(table.userId)]
);

// =====================
// Authentication Tables
// =====================

export const EmailVerificationTokenTable = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    token: uuid("token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("email_verification_tokens_email_token_key").on(
      table.email,
      table.token
    ),
    uniqueIndex("email_verification_tokens_token_key").on(table.token),
  ]
);

export const PasswordResetTokenTable = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    token: uuid("token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_email_token_key").on(
      table.email,
      table.token
    ),
    uniqueIndex("password_reset_tokens_token_key").on(table.token),
  ]
);

// =====================
// Course Tables
// =====================

export const CoursesTable = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    instructor: text("instructor").default("To be announced").notNull(),
    duration: text("duration").notNull(),
    totalSessions: integer("total_sessions").notNull(),
    priceINR: decimal("price_inr", { precision: 10, scale: 2 }).notNull(),
    priceUSD: decimal("price_usd", { precision: 10, scale: 2 }).notNull(),
    status: CourseStatus("status").default("DRAFT").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    startDate: timestamp("start_date", { mode: "date" }),
    endDate: timestamp("end_date", { mode: "date" }),
    registrationDeadline: timestamp("registration_deadline", { mode: "date" }),
    whyLearnIntro: text("why_learn_intro"),
    whatYouLearn: text("what_you_learn"),
    disclaimer: text("disclaimer"),
    maxStudents: integer("max_students"),
    currentEnrollments: integer("current_enrollments").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    // ✅ FIX: Match the exact database column name (with capital C)
    commissionPercourse: decimal("Commission_per_course", { precision: 10, scale: 2 })
  },
  (table) => [
    uniqueIndex("courses_slug_key").on(table.slug),
    index("courses_status_idx").on(table.status),
  ]
);

// Course Features
export const CourseFeaturesTable = pgTable(
  "course_features",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [index("course_features_course_id_idx").on(table.courseId)]
);

// Course Why Learn Points
export const CourseWhyLearnTable = pgTable(
  "course_why_learn",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [index("course_why_learn_course_id_idx").on(table.courseId)]
);

// Course Content/Curriculum
export const CourseContentTable = pgTable(
  "course_content",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [index("course_content_course_id_idx").on(table.courseId)]
);

// Course Related Topics (Tags)
export const CourseTopicsTable = pgTable(
  "course_topics",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
  },
  (table) => [
    index("course_topics_course_id_idx").on(table.courseId),
    index("course_topics_topic_idx").on(table.topic),
  ]
);
// Add this to your schema
export const CourseSessionsTable = pgTable(
  "course_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    sessionNumber: integer("session_number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    sessionDate: timestamp("session_date", { mode: "date" }).notNull(),
    sessionTime: text("session_time").notNull(), // "14:00" format
    duration: integer("duration").default(60).notNull(), // in minutes
    meetingLink: text("meeting_link"),
    meetingPasscode: text("meeting_passcode"),
    recordingUrl: text("recording_url"), // For later access
    isCompleted: boolean("is_completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("course_sessions_course_id_idx").on(table.courseId),
    index("course_sessions_date_idx").on(table.sessionDate),
    uniqueIndex("course_sessions_course_session_unique").on(table.courseId, table.sessionNumber),
  ]
);
// =====================
// COUPON TYPE SYSTEM (NEW)
// =====================

/**
 * Coupon Types Table
 * Admin creates coupon type templates with 2-digit codes (01-99)
 * Examples: 01=FESTIVE, 10=EARLYBIRD, 25=STUDENT, 99=SPECIAL
 */
export const CouponTypesTable = pgTable(
  "coupon_types",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    typeCode: varchar("type_code", { length: 2 }).notNull(), // 01-99
    typeName: text("type_name").notNull(), // FESTIVE, EARLYBIRD, STUDENT, etc.
    description: text("description"),
    discountType: DiscountType("discount_type").notNull(), // PERCENTAGE or FIXED_AMOUNT
    maxDiscountLimit: decimal("max_discount_limit", { precision: 10, scale: 2 }), // Optional max limit
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("coupon_types_type_code_key").on(table.typeCode),
    index("coupon_types_is_active_idx").on(table.isActive),
    index("coupon_types_type_name_idx").on(table.typeName),
  ]
);

/**
 * Individual Coupons Table
 * Jyotishi creates coupons by selecting a type and adding discount value
 * Code format: COUP[JyotishiCode][TypeCode][DiscountValue]
 * Example: COUPJD00110500 = Jyotishi JD001, Type 10, ₹500 discount
 */
// Update CouponsTable to support both Admin and Jyotishi creators
export const CouponsTable = pgTable(
  "coupons",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    code: text("code").notNull(),
    couponTypeId: uuid("coupon_type_id")
      .notNull()
      .references(() => CouponTypesTable.id, { onDelete: "cascade" }),
    // CHANGE: Make this optional and allow admin users
    createdByJyotishiId: uuid("created_by_jyotishi_id").references(() => UsersTable.id, { onDelete: "cascade" }),
    discountType: DiscountType("discount_type").notNull(),
    discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
    maxUsageCount: integer("max_usage_count"),
    currentUsageCount: integer("current_usage_count").default(0).notNull(),
    validFrom: timestamp("valid_from", { mode: "date" }).notNull(),
    validUntil: timestamp("valid_until", { mode: "date" }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("coupons_code_key").on(table.code),
    index("coupons_code_active_idx").on(table.code, table.isActive),
    index("coupons_created_by_jyotishi_idx").on(table.createdByJyotishiId),
    index("coupons_coupon_type_idx").on(table.couponTypeId),
    index("coupons_valid_dates_idx").on(table.validFrom, table.validUntil),
  ]
);

// Coupon Course Mapping (for specific course restrictions)
export const CouponCoursesTable = pgTable(
  "coupon_courses",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => CouponsTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("coupon_courses_coupon_id_idx").on(table.couponId),
    index("coupon_courses_course_id_idx").on(table.courseId),
    uniqueIndex("coupon_courses_unique_idx").on(table.couponId, table.courseId),
  ]
);

// User-Specific Coupons (for targeted user discounts)
export const UserCouponsTable = pgTable(
  "user_coupons",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => CouponsTable.id, { onDelete: "cascade" }),
    isUsed: boolean("is_used").default(false).notNull(),
    usedAt: timestamp("used_at", { mode: "date" }),
  },
  (table) => [
    index("user_coupons_user_id_idx").on(table.userId),
    index("user_coupons_coupon_id_idx").on(table.couponId),
    uniqueIndex("user_coupons_unique_idx").on(table.userId, table.couponId),
  ]
);

// =====================
// Enrollment & Payment Tables
// =====================

export const EnrollmentsTable = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    status: EnrollmentStatus("status").default("ACTIVE").notNull(),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    certificateIssued: boolean("certificate_issued").default(false).notNull(),
    certificateIssuedAt: timestamp("certificate_issued_at", { mode: "date" }),
    certificateUrl: text("certificate_url"),
    certificateData: jsonb("certificate_data"), // ADD THIS LINE - stores certificate metadata
  },
  (table) => [
    index("enrollments_user_id_idx").on(table.userId),
    index("enrollments_course_id_idx").on(table.courseId),
    uniqueIndex("enrollments_user_course_unique_idx").on(
      table.userId,
      table.courseId
    ),
  ]
);

export const PaymentsTable = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id").references(() => EnrollmentsTable.id, {
      onDelete: "set null",
    }),
    invoiceNumber: text("invoice_number").notNull(), // FT2526G00001 or FT2526F00001
    paymentType: PaymentType("payment_type").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).default("0").notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
    finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
    couponId: uuid("coupon_id").references(() => CouponsTable.id, {
      onDelete: "set null",
    }),
    // Commission tracking
    jyotishiId: uuid("jyotishi_id").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).default("0").notNull(),
    commissionPaid: boolean("commission_paid").default(false).notNull(),
    
    // Razorpay details
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpaySignature: text("razorpay_signature"),
    status: PaymentStatus("status").default("PENDING").notNull(),
    paymentMethod: text("payment_method"),
    
    // Installment support
    instalmentPlan: integer("instalment_plan"),
    instalmentNumber: integer("instalment_number").default(1),
    
    billingAddress: jsonb("billing_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("payments_invoice_number_key").on(table.invoiceNumber),
    index("payments_user_id_idx").on(table.userId),
    index("payments_enrollment_id_idx").on(table.enrollmentId),
    index("payments_status_idx").on(table.status),
    index("payments_jyotishi_id_idx").on(table.jyotishiId),
    index("payments_coupon_id_idx").on(table.couponId),
  ]
);

// =====================
// Commission Tables
// =====================

/**
 * Commission Records
 * Tracks commission for each sale made using Jyotishi's coupon
 */
export const CommissionsTable = pgTable(
  "commissions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    jyotishiId: uuid("jyotishi_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => PaymentsTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "set null" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "set null" }),
    couponId: uuid("coupon_id").references(() => CouponsTable.id, {
      onDelete: "set null",
    }),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // Snapshot of rate at sale time
    saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }).notNull(),
    commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
    status: CommissionStatus("status").default("PENDING").notNull(),
    paidAt: timestamp("paid_at", { mode: "date" }),
    payoutId: uuid("payout_id").references(() => PayoutsTable.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("commissions_jyotishi_id_idx").on(table.jyotishiId),
    index("commissions_payment_id_idx").on(table.paymentId),
    index("commissions_status_idx").on(table.status),
    index("commissions_payout_id_idx").on(table.payoutId),
    index("commissions_student_id_idx").on(table.studentId),
  ]
);

/**
 * Payout Requests
 * Jyotishi requests payout of accumulated commissions
 */
export const PayoutsTable = pgTable(
  "payouts",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    jyotishiId: uuid("jyotishi_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: PayoutStatus("status").default("PENDING").notNull(),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at", { mode: "date" }),
    processedBy: uuid("processed_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    // Payment details
    paymentMethod: text("payment_method"), // Bank Transfer, UPI, etc.
    transactionId: text("transaction_id"),
    transactionProof: text("transaction_proof"), // URL to proof document
    bankDetails: jsonb("bank_details"),
    notes: text("notes"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("payouts_jyotishi_id_idx").on(table.jyotishiId),
    index("payouts_status_idx").on(table.status),
    index("payouts_processed_by_idx").on(table.processedBy),
  ]
);

// =====================
// Blog Tables
// =====================

export const BlogsTable = pgTable(
  "blogs",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    authorId: uuid("author_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    publishedAt: timestamp("published_at", { mode: "date" }),
    isPublished: boolean("is_published").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("blogs_slug_key").on(table.slug),
    index("blogs_author_id_idx").on(table.authorId),
    index("blogs_published_idx").on(table.isPublished, table.publishedAt),
  ]
);

export const BlogTagsTable = pgTable(
  "blog_tags",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    blogId: uuid("blog_id")
      .notNull()
      .references(() => BlogsTable.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [
    index("blog_tags_blog_id_idx").on(table.blogId),
    index("blog_tags_tag_idx").on(table.tag),
  ]
);

// =====================
// Website Content Management
// =====================

export const WebsiteContentTable = pgTable(
  "website_content",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    key: text("key").notNull(),
    section: text("section").notNull(),
    content: jsonb("content").notNull(),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("website_content_key_section_key").on(table.key, table.section),
    index("website_content_section_idx").on(table.section),
  ]
);

// =====================
// Certificate Requests
// =====================

export const CertificateRequestsTable = pgTable(
  "certificate_requests",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => EnrollmentsTable.id, { onDelete: "cascade" }),
    status: text("status").default("PENDING").notNull(), // PENDING, APPROVED, REJECTED
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at", { mode: "date" }),
    processedBy: uuid("processed_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
  },
  (table) => [
    index("certificate_requests_user_id_idx").on(table.userId),
    index("certificate_requests_enrollment_id_idx").on(table.enrollmentId),
    index("certificate_requests_status_idx").on(table.status),
  ]
);


export const UserCourseCouponsTable = pgTable(
  "user_course_coupons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "cascade" })
      .notNull(),
    courseId: uuid("course_id")
      .references(() => CoursesTable.id, { onDelete: "cascade" })
      .notNull(),
    couponId: uuid("coupon_id")
      .references(() => CouponsTable.id, { onDelete: "cascade" })
      .notNull(),
    assignedBy: uuid("assigned_by")
      .references(() => UsersTable.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    // Ensure one active coupon per user per course
    uniqueIndex("user_course_coupons_user_course_unique").on(table.userId, table.courseId),
    index("user_course_coupons_user_id_idx").on(table.userId),
    index("user_course_coupons_course_id_idx").on(table.courseId),
    index("user_course_coupons_coupon_id_idx").on(table.couponId),
    index("user_course_coupons_assigned_by_idx").on(table.assignedBy),
  ]
);
// =====================
// Relations
// =====================

export const usersRelations = relations(UsersTable, ({ many }) => ({
  addresses: many(UserAddressTable),
  enrollments: many(EnrollmentsTable),
  payments: many(PaymentsTable),
  blogs: many(BlogsTable),
  userCoupons: many(UserCouponsTable),
  createdCouponTypes: many(CouponTypesTable),
  createdCoupons: many(CouponsTable),
  commissions: many(CommissionsTable),
  payouts: many(PayoutsTable),
}));

export const couponTypesRelations = relations(CouponTypesTable, ({ one, many }) => ({
  creator: one(UsersTable, {
    fields: [CouponTypesTable.createdBy],
    references: [UsersTable.id],
  }),
  coupons: many(CouponsTable),
}));

export const couponsRelations = relations(CouponsTable, ({ one, many }) => ({
  couponType: one(CouponTypesTable, {
    fields: [CouponsTable.couponTypeId],
    references: [CouponTypesTable.id],
  }),
  creatorJyotishi: one(UsersTable, {
    fields: [CouponsTable.createdByJyotishiId],
    references: [UsersTable.id],
  }),
  couponCourses: many(CouponCoursesTable),
  userCoupons: many(UserCouponsTable),
  payments: many(PaymentsTable),
  commissions: many(CommissionsTable),
}));

// Update courses relations
export const coursesRelations = relations(CoursesTable, ({ many }) => ({
  features: many(CourseFeaturesTable),
  whyLearnPoints: many(CourseWhyLearnTable),
  content: many(CourseContentTable),
  topics: many(CourseTopicsTable),
  enrollments: many(EnrollmentsTable),
  couponCourses: many(CouponCoursesTable),
  commissions: many(CommissionsTable),
  sessions: many(CourseSessionsTable), // Add this
}));

// Add sessions relations
export const courseSessionsRelations = relations(CourseSessionsTable, ({ one }) => ({
  course: one(CoursesTable, {
    fields: [CourseSessionsTable.courseId],
    references: [CoursesTable.id],
  }),
}));

export const enrollmentsRelations = relations(
  EnrollmentsTable,
  ({ one, many }) => ({
    user: one(UsersTable, {
      fields: [EnrollmentsTable.userId],
      references: [UsersTable.id],
    }),
    course: one(CoursesTable, {
      fields: [EnrollmentsTable.courseId],
      references: [CoursesTable.id],
    }),
    payments: many(PaymentsTable),
    certificateRequests: many(CertificateRequestsTable),
  })
);

export const paymentsRelations = relations(PaymentsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [PaymentsTable.userId],
    references: [UsersTable.id],
  }),
  enrollment: one(EnrollmentsTable, {
    fields: [PaymentsTable.enrollmentId],
    references: [EnrollmentsTable.id],
  }),
  coupon: one(CouponsTable, {
    fields: [PaymentsTable.couponId],
    references: [CouponsTable.id],
  }),
  jyotishi: one(UsersTable, {
    fields: [PaymentsTable.jyotishiId],
    references: [UsersTable.id],
  }),
}));

export const commissionsRelations = relations(CommissionsTable, ({ one }) => ({
  jyotishi: one(UsersTable, {
    fields: [CommissionsTable.jyotishiId],
    references: [UsersTable.id],
  }),
  payment: one(PaymentsTable, {
    fields: [CommissionsTable.paymentId],
    references: [PaymentsTable.id],
  }),
  course: one(CoursesTable, {
    fields: [CommissionsTable.courseId],
    references: [CoursesTable.id],
  }),
  student: one(UsersTable, {
    fields: [CommissionsTable.studentId],
    references: [UsersTable.id],
  }),
  coupon: one(CouponsTable, {
    fields: [CommissionsTable.couponId],
    references: [CouponsTable.id],
  }),
  payout: one(PayoutsTable, {
    fields: [CommissionsTable.payoutId],
    references: [PayoutsTable.id],
  }),
}));

export const payoutsRelations = relations(PayoutsTable, ({ one, many }) => ({
  jyotishi: one(UsersTable, {
    fields: [PayoutsTable.jyotishiId],
    references: [UsersTable.id],
  }),
  processedBy: one(UsersTable, {
    fields: [PayoutsTable.processedBy],
    references: [UsersTable.id],
  }),
  commissions: many(CommissionsTable),
}));

export const blogsRelations = relations(BlogsTable, ({ one, many }) => ({
  author: one(UsersTable, {
    fields: [BlogsTable.authorId],
    references: [UsersTable.id],
  }),
  tags: many(BlogTagsTable),
}));

// Add relations
export const userCourseCouponsRelations = relations(UserCourseCouponsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [UserCourseCouponsTable.userId],
    references: [UsersTable.id],
  }),
  course: one(CoursesTable, {
    fields: [UserCourseCouponsTable.courseId],
    references: [CoursesTable.id],
  }),
  coupon: one(CouponsTable, {
    fields: [UserCourseCouponsTable.couponId],
    references: [CouponsTable.id],
  }),
  assignedByUser: one(UsersTable, {
    fields: [UserCourseCouponsTable.assignedBy],
    references: [UsersTable.id],
  }),
}));

// =====================
// Type Exports for TypeScript
// =====================

export type User = typeof UsersTable.$inferSelect;
export type NewUser = typeof UsersTable.$inferInsert;

export type CouponType = typeof CouponTypesTable.$inferSelect;
export type NewCouponType = typeof CouponTypesTable.$inferInsert;

export type Coupon = typeof CouponsTable.$inferSelect;
export type NewCoupon = typeof CouponsTable.$inferInsert;

export type Course = typeof CoursesTable.$inferSelect;
export type NewCourse = typeof CoursesTable.$inferInsert;

export type Enrollment = typeof EnrollmentsTable.$inferSelect;
export type NewEnrollment = typeof EnrollmentsTable.$inferInsert;

export type Payment = typeof PaymentsTable.$inferSelect;
export type NewPayment = typeof PaymentsTable.$inferInsert;

export type Commission = typeof CommissionsTable.$inferSelect;
export type NewCommission = typeof CommissionsTable.$inferInsert;

export type Payout = typeof PayoutsTable.$inferSelect;
export type NewPayout = typeof PayoutsTable.$inferInsert;

export type Blog = typeof BlogsTable.$inferSelect;
export type NewBlog = typeof BlogsTable.$inferInsert;