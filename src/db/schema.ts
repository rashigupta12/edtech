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
  jsonb,
  varchar,
  serial,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =====================
// Enums
// =====================

export const UserRole = pgEnum("user_role", ["ADMIN", "COLLEGE", "STUDENT"]);

export const CourseStatus = pgEnum("course_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const CollegeStatus = pgEnum("college_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
]);

export const EnrollmentStatus = pgEnum("enrollment_status", [
  "ACTIVE",
  "COMPLETED",
  "DROPPED",
]);

export const AssignmentStatus = pgEnum("assignment_status", [
  "PENDING",
  "SUBMITTED",
  "GRADED",
  "LATE",
]);

export const CertificateStatus = pgEnum("certificate_status", [
  "PENDING",
  "APPROVED",
  "ISSUED",
  "REJECTED",
]);

export const SessionStatus = pgEnum("session_status", [
  "SCHEDULED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export const AnnouncementType = pgEnum("announcement_type", [
  "PLATFORM",
  "COLLEGE",
  "COURSE",
]);

export const ContentType = pgEnum("content_type", [
  "VIDEO",
  "DOCUMENT",
  "ARTICLE",
  "QUIZ",
]);

export const QuestionType = pgEnum("question_type", [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
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
    role: UserRole("role").default("STUDENT").notNull(),
    profileImage: text("profile_image"),
    bio: text("bio"),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_email_key").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_email_idx").on(table.email),
  ]
);


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

export const UsersRelations = relations(UsersTable, ({ many, one }) => ({
  college: one(CollegesTable, {
    fields: [UsersTable.id],
    references: [CollegesTable.userId],
  }),
  coursesCreated: many(CoursesTable),
  bootcampsCreated: many(BootcampsTable),
  enrollments: many(EnrollmentsTable),
  bootcampEnrollments: many(BootcampEnrollmentsTable),
  assignments: many(AssignmentSubmissionsTable),
  assessments: many(AssessmentAttemptsTable),
  certificates: many(CertificatesTable),
  sessionsCreated: many(SessionsTable),
  announcements: many(AnnouncementsTable),
}));

// =====================
// College Tables
// =====================

export const CollegesTable = pgTable(
  "colleges",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    collegeName: text("college_name").notNull(),
    collegeCode: varchar("college_code", { length: 10 }).notNull(),
    registrationNumber: text("registration_number"),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").default("India").notNull(),
    pinCode: text("pin_code").notNull(),
    websiteUrl: text("website_url"),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone").notNull(),
    logo: text("logo"),
    banner: text("banner"),
    about: text("about"),
    
    // Verification Documents
    verificationDocument: text("verification_document"),
    additionalDocuments: jsonb("additional_documents"),
    
    status: CollegeStatus("status").default("PENDING").notNull(),
    approvedBy: uuid("approved_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    rejectionReason: text("rejection_reason"),
    
    // Future payment details
    bankAccountNumber: text("bank_account_number"),
    bankName: text("bank_name"),
    accountHolderName: text("account_holder_name"),
    ifscCode: text("ifsc_code"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("colleges_college_code_key").on(table.collegeCode),
    uniqueIndex("colleges_user_id_key").on(table.userId),
    index("colleges_status_idx").on(table.status),
    index("colleges_user_id_idx").on(table.userId),
  ]
);

export const CollegesRelations = relations(CollegesTable, ({ one, many }) => ({
  user: one(UsersTable, {
    fields: [CollegesTable.userId],
    references: [UsersTable.id],
  }),
  courses: many(CoursesTable),
  bootcamps: many(BootcampsTable),
  approvedByUser: one(UsersTable, {
    fields: [CollegesTable.approvedBy],
    references: [UsersTable.id],
  }),
}));

// =====================
// Category Tables
// =====================

export const CategoriesTable = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("categories_slug_key").on(table.slug),
    index("categories_is_active_idx").on(table.isActive),
  ]
);

export const CategoriesRelations = relations(CategoriesTable, ({ many }) => ({
  courses: many(CoursesTable),
}));

// =====================
// Course Tables
// =====================

export const CoursesTable = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    
    categoryId: uuid("category_id")
      .notNull()
      .references(() => CategoriesTable.id, { onDelete: "cascade" }),
    
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id").references(() => CollegesTable.id, {
      onDelete: "cascade",
    }),
    
    thumbnailUrl: text("thumbnail_url"),
    previewVideoUrl: text("preview_video_url"),
    
    // Course Details
    duration: text("duration"),
    language: text("language").default("English").notNull(),
    level: text("level").default("Beginner").notNull(),
    prerequisites: text("prerequisites"),
    
    // Course Status
    status: CourseStatus("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }),
    
    // Approval workflow
    submittedForApprovalAt: timestamp("submitted_for_approval_at", {
      mode: "date",
    }),
    approvedBy: uuid("approved_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    rejectionReason: text("rejection_reason"),
    
    // Course Settings
    isFeatured: boolean("is_featured").default(false).notNull(),
    maxStudents: integer("max_students"),
    currentEnrollments: integer("current_enrollments").default(0).notNull(),
    
    // SEO
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    
    // Future pricing fields
    isFree: boolean("is_free").default(true).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }),
    discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("courses_slug_key").on(table.slug),
    index("courses_status_idx").on(table.status),
    index("courses_category_idx").on(table.categoryId),
    index("courses_created_by_idx").on(table.createdBy),
    index("courses_college_id_idx").on(table.collegeId),
    index("courses_featured_idx").on(table.isFeatured),
  ]
);

export const CoursesRelations = relations(CoursesTable, ({ one, many }) => ({
  category: one(CategoriesTable, {
    fields: [CoursesTable.categoryId],
    references: [CategoriesTable.id],
  }),
  createdByUser: one(UsersTable, {
    fields: [CoursesTable.createdBy],
    references: [UsersTable.id],
  }),
  college: one(CollegesTable, {
    fields: [CoursesTable.collegeId],
    references: [CollegesTable.id],
  }),
  approvedByUser: one(UsersTable, {
    fields: [CoursesTable.approvedBy],
    references: [UsersTable.id],
  }),
  learningOutcomes: many(CourseLearningOutcomesTable),
  requirements: many(CourseRequirementsTable),
  modules: many(CourseModulesTable),
  enrollments: many(EnrollmentsTable),
  assignments: many(AssignmentsTable),
  assessments: many(AssessmentsTable),
  sessions: many(SessionsTable),
  bootcampCourses: many(BootcampCoursesTable),
  certificates: many(CertificatesTable),
}));

// Course Learning Outcomes
export const CourseLearningOutcomesTable = pgTable(
  "course_learning_outcomes",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    outcome: text("outcome").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("course_learning_outcomes_course_id_idx").on(table.courseId)]
);

export const CourseLearningOutcomesRelations = relations(CourseLearningOutcomesTable, ({ one }) => ({
  course: one(CoursesTable, {
    fields: [CourseLearningOutcomesTable.courseId],
    references: [CoursesTable.id],
  }),
}));

// Course Requirements/Prerequisites
export const CourseRequirementsTable = pgTable(
  "course_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    requirement: text("requirement").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("course_requirements_course_id_idx").on(table.courseId)]
);

export const CourseRequirementsRelations = relations(CourseRequirementsTable, ({ one }) => ({
  course: one(CoursesTable, {
    fields: [CourseRequirementsTable.courseId],
    references: [CoursesTable.id],
  }),
}));

// =====================
// Course Content Structure
// =====================

// Modules/Sections
export const CourseModulesTable = pgTable(
  "course_modules",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("course_modules_course_id_idx").on(table.courseId),
    index("course_modules_sort_order_idx").on(table.courseId, table.sortOrder),
  ]
);

export const CourseModulesRelations = relations(CourseModulesTable, ({ one, many }) => ({
  course: one(CoursesTable, {
    fields: [CourseModulesTable.courseId],
    references: [CoursesTable.id],
  }),
  lessons: many(CourseLessonsTable),
  assignments: many(AssignmentsTable),
  assessments: many(AssessmentsTable),
}));

// Lessons/Videos
export const CourseLessonsTable = pgTable(
  "course_lessons",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => CourseModulesTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    
    title: text("title").notNull(),
    description: text("description"),
    
    // Content
    contentType: ContentType("content_type").default("VIDEO").notNull(),
    videoUrl: text("video_url"),
    videoDuration: integer("video_duration"),
    articleContent: text("article_content"),
    
    // Downloadable Resources
    resources: jsonb("resources"),
    
    sortOrder: integer("sort_order").default(0).notNull(),
    isFree: boolean("is_free").default(false).notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("course_lessons_module_id_idx").on(table.moduleId),
    index("course_lessons_course_id_idx").on(table.courseId),
    index("course_lessons_sort_order_idx").on(table.moduleId, table.sortOrder),
  ]
);

export const CourseLessonsRelations = relations(CourseLessonsTable, ({ one, many }) => ({
  module: one(CourseModulesTable, {
    fields: [CourseLessonsTable.moduleId],
    references: [CourseModulesTable.id],
  }),
  course: one(CoursesTable, {
    fields: [CourseLessonsTable.courseId],
    references: [CoursesTable.id],
  }),
  progress: many(LessonProgressTable),
}));

// =====================
// Bootcamp Tables
// =====================

export const BootcampsTable = pgTable(
  "bootcamps",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    
    // Bootcamp Owner
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id").references(() => CollegesTable.id, {
      onDelete: "cascade",
    }),
    
    thumbnailUrl: text("thumbnail_url"),
    
    // Bootcamp Details
    duration: text("duration").notNull(),
    startDate: timestamp("start_date", { mode: "date" }),
    endDate: timestamp("end_date", { mode: "date" }),
    
    status: CourseStatus("status").default("DRAFT").notNull(),
    
    // Approval workflow
    submittedForApprovalAt: timestamp("submitted_for_approval_at", {
      mode: "date",
    }),
    approvedBy: uuid("approved_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    rejectionReason: text("rejection_reason"),
    
    maxStudents: integer("max_students"),
    currentEnrollments: integer("current_enrollments").default(0).notNull(),
    
    // Future pricing
    isFree: boolean("is_free").default(true).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }),
    discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("bootcamps_slug_key").on(table.slug),
    index("bootcamps_status_idx").on(table.status),
    index("bootcamps_created_by_idx").on(table.createdBy),
    index("bootcamps_college_id_idx").on(table.collegeId),
  ]
);

export const BootcampsRelations = relations(BootcampsTable, ({ one, many }) => ({
  createdByUser: one(UsersTable, {
    fields: [BootcampsTable.createdBy],
    references: [UsersTable.id],
  }),
  college: one(CollegesTable, {
    fields: [BootcampsTable.collegeId],
    references: [CollegesTable.id],
  }),
  approvedByUser: one(UsersTable, {
    fields: [BootcampsTable.approvedBy],
    references: [UsersTable.id],
  }),
  bootcampCourses: many(BootcampCoursesTable),
  enrollments: many(BootcampEnrollmentsTable),
}));

// Bootcamp - Course Mapping
export const BootcampCoursesTable = pgTable(
  "bootcamp_courses",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    bootcampId: uuid("bootcamp_id")
      .notNull()
      .references(() => BootcampsTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    index("bootcamp_courses_bootcamp_id_idx").on(table.bootcampId),
    index("bootcamp_courses_course_id_idx").on(table.courseId),
    uniqueIndex("bootcamp_courses_unique_idx").on(
      table.bootcampId,
      table.courseId
    ),
  ]
);

export const BootcampCoursesRelations = relations(BootcampCoursesTable, ({ one }) => ({
  bootcamp: one(BootcampsTable, {
    fields: [BootcampCoursesTable.bootcampId],
    references: [BootcampsTable.id],
  }),
  course: one(CoursesTable, {
    fields: [BootcampCoursesTable.courseId],
    references: [CoursesTable.id],
  }),
}));

// =====================
// Enrollment Tables
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
    progress: integer("progress").default(0).notNull(),
    
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    startedAt: timestamp("started_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),
    lastAccessedAt: timestamp("last_accessed_at", { mode: "date" }),
    
    // Certificate
    certificateEligible: boolean("certificate_eligible").default(false).notNull(),
    certificateIssued: boolean("certificate_issued").default(false).notNull(),
    certificateIssuedAt: timestamp("certificate_issued_at", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("enrollments_user_id_idx").on(table.userId),
    index("enrollments_course_id_idx").on(table.courseId),
    index("enrollments_status_idx").on(table.status),
    uniqueIndex("enrollments_user_course_unique_idx").on(
      table.userId,
      table.courseId
    ),
  ]
);

export const EnrollmentsRelations = relations(EnrollmentsTable, ({ one, many }) => ({
  user: one(UsersTable, {
    fields: [EnrollmentsTable.userId],
    references: [UsersTable.id],
  }),
  course: one(CoursesTable, {
    fields: [EnrollmentsTable.courseId],
    references: [CoursesTable.id],
  }),
  lessonProgress: many(LessonProgressTable),
  assignments: many(AssignmentSubmissionsTable),
  assessments: many(AssessmentAttemptsTable),
  certificate: one(CertificatesTable),
}));

// Bootcamp Enrollments
export const BootcampEnrollmentsTable = pgTable(
  "bootcamp_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    bootcampId: uuid("bootcamp_id")
      .notNull()
      .references(() => BootcampsTable.id, { onDelete: "cascade" }),
    
    status: EnrollmentStatus("status").default("ACTIVE").notNull(),
    progress: integer("progress").default(0).notNull(),
    
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("bootcamp_enrollments_user_id_idx").on(table.userId),
    index("bootcamp_enrollments_bootcamp_id_idx").on(table.bootcampId),
    uniqueIndex("bootcamp_enrollments_user_bootcamp_unique_idx").on(
      table.userId,
      table.bootcampId
    ),
  ]
);

export const BootcampEnrollmentsRelations = relations(BootcampEnrollmentsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [BootcampEnrollmentsTable.userId],
    references: [UsersTable.id],
  }),
  bootcamp: one(BootcampsTable, {
    fields: [BootcampEnrollmentsTable.bootcampId],
    references: [BootcampsTable.id],
  }),
}));

// Lesson Progress Tracking
export const LessonProgressTable = pgTable(
  "lesson_progress",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => CourseLessonsTable.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => EnrollmentsTable.id, { onDelete: "cascade" }),
    
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    
    // Video progress
    lastWatchedPosition: integer("last_watched_position").default(0),
    watchDuration: integer("watch_duration").default(0),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("lesson_progress_user_id_idx").on(table.userId),
    index("lesson_progress_lesson_id_idx").on(table.lessonId),
    index("lesson_progress_enrollment_id_idx").on(table.enrollmentId),
    uniqueIndex("lesson_progress_unique_idx").on(table.userId, table.lessonId),
  ]
);

export const LessonProgressRelations = relations(LessonProgressTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [LessonProgressTable.userId],
    references: [UsersTable.id],
  }),
  lesson: one(CourseLessonsTable, {
    fields: [LessonProgressTable.lessonId],
    references: [CourseLessonsTable.id],
  }),
  enrollment: one(EnrollmentsTable, {
    fields: [LessonProgressTable.enrollmentId],
    references: [EnrollmentsTable.id],
  }),
}));

// =====================
// Live Session Tables
// =====================

export const SessionsTable = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    
    title: text("title").notNull(),
    description: text("description"),
    
    sessionDate: timestamp("session_date", { mode: "date" }).notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    duration: integer("duration").notNull(),
    
    meetingLink: text("meeting_link"),
    meetingPassword: text("meeting_password"),
    meetingPlatform: text("meeting_platform"),
    
    recordingUrl: text("recording_url"),
    
    status: SessionStatus("status").default("SCHEDULED").notNull(),
    
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
    index("sessions_course_id_idx").on(table.courseId),
    index("sessions_date_idx").on(table.sessionDate),
    index("sessions_status_idx").on(table.status),
  ]
);

export const SessionsRelations = relations(SessionsTable, ({ one, many }) => ({
  course: one(CoursesTable, {
    fields: [SessionsTable.courseId],
    references: [CoursesTable.id],
  }),
  createdByUser: one(UsersTable, {
    fields: [SessionsTable.createdBy],
    references: [UsersTable.id],
  }),
  attendance: many(SessionAttendanceTable),
}));

// Session Attendance
export const SessionAttendanceTable = pgTable(
  "session_attendance",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => SessionsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    
    attended: boolean("attended").default(false).notNull(),
    joinedAt: timestamp("joined_at", { mode: "date" }),
    leftAt: timestamp("left_at", { mode: "date" }),
    duration: integer("duration"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("session_attendance_session_id_idx").on(table.sessionId),
    index("session_attendance_user_id_idx").on(table.userId),
    uniqueIndex("session_attendance_unique_idx").on(
      table.sessionId,
      table.userId
    ),
  ]
);

export const SessionAttendanceRelations = relations(SessionAttendanceTable, ({ one }) => ({
  session: one(SessionsTable, {
    fields: [SessionAttendanceTable.sessionId],
    references: [SessionsTable.id],
  }),
  user: one(UsersTable, {
    fields: [SessionAttendanceTable.userId],
    references: [UsersTable.id],
  }),
}));

// =====================
// Assignment Tables
// =====================

export const AssignmentsTable = pgTable(
  "assignments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id").references(() => CourseModulesTable.id, {
      onDelete: "cascade",
    }),
    
    title: text("title").notNull(),
    description: text("description").notNull(),
    instructions: text("instructions"),
    
    attachments: jsonb("attachments"),
    
    dueDate: timestamp("due_date", { mode: "date" }),
    maxScore: integer("max_score").default(100).notNull(),
    
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
    index("assignments_course_id_idx").on(table.courseId),
    index("assignments_module_id_idx").on(table.moduleId),
  ]
);

export const AssignmentsRelations = relations(AssignmentsTable, ({ one, many }) => ({
  course: one(CoursesTable, {
    fields: [AssignmentsTable.courseId],
    references: [CoursesTable.id],
  }),
  module: one(CourseModulesTable, {
    fields: [AssignmentsTable.moduleId],
    references: [CourseModulesTable.id],
  }),
  createdByUser: one(UsersTable, {
    fields: [AssignmentsTable.createdBy],
    references: [UsersTable.id],
  }),
  submissions: many(AssignmentSubmissionsTable),
}));

// Assignment Submissions
export const AssignmentSubmissionsTable = pgTable(
  "assignment_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => AssignmentsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => EnrollmentsTable.id, { onDelete: "cascade" }),
    
    content: text("content"),
    attachments: jsonb("attachments"),
    
    status: AssignmentStatus("status").default("PENDING").notNull(),
    
    submittedAt: timestamp("submitted_at", { mode: "date" }),
    
    // Grading
    score: integer("score"),
    maxScore: integer("max_score"),
    feedback: text("feedback"),
    gradedBy: uuid("graded_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    gradedAt: timestamp("graded_at", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("assignment_submissions_assignment_id_idx").on(table.assignmentId),
    index("assignment_submissions_user_id_idx").on(table.userId),
    index("assignment_submissions_enrollment_id_idx").on(table.enrollmentId),
    index("assignment_submissions_status_idx").on(table.status),
    uniqueIndex("assignment_submissions_unique_idx").on(
      table.assignmentId,
      table.userId
    ),
  ]
);

export const AssignmentSubmissionsRelations = relations(AssignmentSubmissionsTable, ({ one }) => ({
  assignment: one(AssignmentsTable, {
    fields: [AssignmentSubmissionsTable.assignmentId],
    references: [AssignmentsTable.id],
  }),
  user: one(UsersTable, {
    fields: [AssignmentSubmissionsTable.userId],
    references: [UsersTable.id],
  }),
  enrollment: one(EnrollmentsTable, {
    fields: [AssignmentSubmissionsTable.enrollmentId],
    references: [EnrollmentsTable.id],
  }),
  gradedByUser: one(UsersTable, {
    fields: [AssignmentSubmissionsTable.gradedBy],
    references: [UsersTable.id],
  }),
}));

// =====================
// Assessment/Quiz Tables
// =====================

export const AssessmentsTable = pgTable(
  "assessments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id").references(() => CourseModulesTable.id, {
      onDelete: "cascade",
    }),
    
    title: text("title").notNull(),
    description: text("description"),
    
    duration: integer("duration"),
    passingScore: integer("passing_score").default(60).notNull(),
    maxAttempts: integer("max_attempts"),
    
    isRequired: boolean("is_required").default(false).notNull(),
    
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
    index("assessments_course_id_idx").on(table.courseId),
    index("assessments_module_id_idx").on(table.moduleId),
  ]
);

export const AssessmentsRelations = relations(AssessmentsTable, ({ one, many }) => ({
  course: one(CoursesTable, {
    fields: [AssessmentsTable.courseId],
    references: [CoursesTable.id],
  }),
  module: one(CourseModulesTable, {
    fields: [AssessmentsTable.moduleId],
    references: [CourseModulesTable.id],
  }),
  createdByUser: one(UsersTable, {
    fields: [AssessmentsTable.createdBy],
    references: [UsersTable.id],
  }),
  questions: many(AssessmentQuestionsTable),
  attempts: many(AssessmentAttemptsTable),
}));

// Assessment Questions
export const AssessmentQuestionsTable = pgTable(
  "assessment_questions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => AssessmentsTable.id, { onDelete: "cascade" }),
    
    questionText: text("question_text").notNull(),
    questionType: QuestionType("question_type").default("MULTIPLE_CHOICE").notNull(),
    
    options: jsonb("options"),
    correctAnswer: text("correct_answer").notNull(),
    
    points: integer("points").default(1).notNull(),
    explanation: text("explanation"),
    
    sortOrder: integer("sort_order").default(0).notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("assessment_questions_assessment_id_idx").on(table.assessmentId),
    index("assessment_questions_sort_order_idx").on(
      table.assessmentId,
      table.sortOrder
    ),
  ]
);

export const AssessmentQuestionsRelations = relations(AssessmentQuestionsTable, ({ one }) => ({
  assessment: one(AssessmentsTable, {
    fields: [AssessmentQuestionsTable.assessmentId],
    references: [AssessmentsTable.id],
  }),
}));

// Assessment Attempts
export const AssessmentAttemptsTable = pgTable(
  "assessment_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => AssessmentsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => EnrollmentsTable.id, { onDelete: "cascade" }),
    
    attemptNumber: integer("attempt_number").default(1).notNull(),
    
    answers: jsonb("answers"),
    
    score: integer("score").notNull(),
    totalPoints: integer("total_points").notNull(),
    percentage: integer("percentage").notNull(),
    
    passed: boolean("passed").notNull(),
    
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("assessment_attempts_assessment_id_idx").on(table.assessmentId),
    index("assessment_attempts_user_id_idx").on(table.userId),
    index("assessment_attempts_enrollment_id_idx").on(table.enrollmentId),
  ]
);

export const AssessmentAttemptsRelations = relations(AssessmentAttemptsTable, ({ one }) => ({
  assessment: one(AssessmentsTable, {
    fields: [AssessmentAttemptsTable.assessmentId],
    references: [AssessmentsTable.id],
  }),
  user: one(UsersTable, {
    fields: [AssessmentAttemptsTable.userId],
    references: [UsersTable.id],
  }),
  enrollment: one(EnrollmentsTable, {
    fields: [AssessmentAttemptsTable.enrollmentId],
    references: [EnrollmentsTable.id],
  }),
}));

// =====================
// Certificate Tables
// =====================

export const CertificatesTable = pgTable(
  "certificates",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => EnrollmentsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    
    certificateNumber: text("certificate_number").notNull(),
    certificateUrl: text("certificate_url"),
    
    studentName: text("student_name").notNull(),
    courseName: text("course_name").notNull(),
    collegeName: text("college_name"),
    
    completionDate: timestamp("completion_date", { mode: "date" }).notNull(),
    issuedDate: timestamp("issued_date", { mode: "date" }).defaultNow().notNull(),
    
    status: CertificateStatus("status").default("PENDING").notNull(),
    
    // Verification
    verificationCode: text("verification_code").notNull(),
    
    // Approval workflow
    approvedBy: uuid("approved_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("certificates_certificate_number_key").on(table.certificateNumber),
    uniqueIndex("certificates_verification_code_key").on(table.verificationCode),
    uniqueIndex("certificates_enrollment_id_key").on(table.enrollmentId),
    index("certificates_user_id_idx").on(table.userId),
    index("certificates_course_id_idx").on(table.courseId),
  ]
);

export const CertificatesRelations = relations(CertificatesTable, ({ one }) => ({
  enrollment: one(EnrollmentsTable, {
    fields: [CertificatesTable.enrollmentId],
    references: [EnrollmentsTable.id],
  }),
  user: one(UsersTable, {
    fields: [CertificatesTable.userId],
    references: [UsersTable.id],
  }),
  course: one(CoursesTable, {
    fields: [CertificatesTable.courseId],
    references: [CoursesTable.id],
  }),
  approvedByUser: one(UsersTable, {
    fields: [CertificatesTable.approvedBy],
    references: [UsersTable.id],
  }),
}));

// =====================
// Announcement Tables
// =====================

export const AnnouncementsTable = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    
    type: AnnouncementType("type").default("PLATFORM").notNull(),
    
    // Target audience
    targetAudience: jsonb("target_audience"), // {roles: [], colleges: [], courses: []}
    
    // Scheduling
    isScheduled: boolean("is_scheduled").default(false).notNull(),
    scheduledAt: timestamp("scheduled_at", { mode: "date" }),
    
    // Status
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }),
    
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    
    // For college/course specific announcements
    collegeId: uuid("college_id").references(() => CollegesTable.id, {
      onDelete: "cascade",
    }),
    courseId: uuid("course_id").references(() => CoursesTable.id, {
      onDelete: "cascade",
    }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("announcements_type_idx").on(table.type),
    index("announcements_college_id_idx").on(table.collegeId),
    index("announcements_course_id_idx").on(table.courseId),
    index("announcements_published_idx").on(table.isPublished),
  ]
);

export const AnnouncementsRelations = relations(AnnouncementsTable, ({ one }) => ({
  createdByUser: one(UsersTable, {
    fields: [AnnouncementsTable.createdBy],
    references: [UsersTable.id],
  }),
  college: one(CollegesTable, {
    fields: [AnnouncementsTable.collegeId],
    references: [CollegesTable.id],
  }),
  course: one(CoursesTable, {
    fields: [AnnouncementsTable.courseId],
    references: [CoursesTable.id],
  }),
}));

// =====================
// CMS & Static Content Tables
// =====================

export const CMSPagesTable = pgTable(
  "cms_pages",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
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
    uniqueIndex("cms_pages_slug_key").on(table.slug),
    index("cms_pages_is_active_idx").on(table.isActive),
  ]
);

export const TestimonialsTable = pgTable(
  "testimonials",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    studentName: text("student_name").notNull(),
    studentImage: text("student_image"),
    collegeName: text("college_name"),
    courseName: text("course_name"),
    rating: integer("rating").notNull(),
    testimonial: text("testimonial").notNull(),
    isApproved: boolean("is_approved").default(false).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("testimonials_is_approved_idx").on(table.isApproved),
    index("testimonials_is_featured_idx").on(table.isFeatured),
  ]
);

// =====================
// System Tables
// =====================

export const ActivityLogsTable = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_logs_user_id_idx").on(table.userId),
    index("activity_logs_action_idx").on(table.action),
    index("activity_logs_created_at_idx").on(table.createdAt),
  ]
);

export const NotificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    actionUrl: text("action_url"),
    relatedId: text("related_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
  ]
);

// =====================
// Future Payment Tables (Phase 2)
// =====================

export const PaymentsTable = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id").references(() => CoursesTable.id, {
      onDelete: "set null",
    }),
    bootcampId: uuid("bootcamp_id").references(() => BootcampsTable.id, {
      onDelete: "set null",
    }),
    
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").default("INR").notNull(),
    
    // Payment gateway details
    paymentGateway: text("payment_gateway"),
    paymentId: text("payment_id"),
    orderId: text("order_id"),
    
    status: text("status").notNull(), // pending, completed, failed, refunded
    
    // Commission details
    platformCommission: decimal("platform_commission", { precision: 10, scale: 2 }),
    collegeEarnings: decimal("college_earnings", { precision: 10, scale: 2 }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("payments_user_id_idx").on(table.userId),
    index("payments_status_idx").on(table.status),
    index("payments_payment_id_idx").on(table.paymentId),
  ]
);

export const PayoutsTable = pgTable(
  "payouts",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => CollegesTable.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: text("status").default("PENDING").notNull(),
    payoutDate: timestamp("payout_date", { mode: "date" }),
    transactionId: text("transaction_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("payouts_college_id_idx").on(table.collegeId),
    index("payouts_status_idx").on(table.status),
  ]
);
