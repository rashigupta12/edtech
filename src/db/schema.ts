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
  decimal,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// =====================
// Enums
// =====================

export const UserRole = pgEnum("user_role", ["ADMIN", "COLLEGE", "FACULTY", "STUDENT"]);
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
export const Gender = pgEnum("gender", ["MALE", "FEMALE", "OTHER"]);
export const QuestionDifficulty = pgEnum("question_difficulty", [
  "EASY",
  "MEDIUM",
  "HARD",
]);
export const ReportType = pgEnum("report_type", [
  "ENROLLMENT",
  "REVENUE",
  "PROGRESS",
  "PERFORMANCE",
  "ATTENDANCE",
]);
export const FacultyStatus = pgEnum("faculty_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);
export const FacultyRole = pgEnum("faculty_role", [
  "PROFESSOR",
  "ASSOCIATE_PROFESSOR",
  "ASSISTANT_PROFESSOR",
  "LECTURER",
  "VISITING_FACULTY",
  "HOD",
]);
export const AssessmentLevel = pgEnum("assessment_level", [
  "LESSON_QUIZ",
  "MODULE_ASSESSMENT",
  "COURSE_FINAL",
]);
export const AttemptStatus = pgEnum("attempt_status", [
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
]);

// =====================
// User & Auth Tables
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

export const StudentProfilesTable = pgTable(
  "student_profiles",
  {
    id: uuid("id").primaryKey().references(() => UsersTable.id, { onDelete: "cascade" }),
    dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
    gender: Gender("gender"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country").default("India"),
    pinCode: text("pin_code"),
    educationLevel: text("education_level"),
    institution: text("institution"),
    currentSemester: integer("current_semester"),
    specialization: text("specialization"),
    academicRecords: jsonb("academic_records"),
    skills: jsonb("skills"),
    resumeUrl: text("resume_url"),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("student_profiles_education_level_idx").on(table.educationLevel),
    index("student_profiles_institution_idx").on(table.institution),
  ]
);

export const FacultyProfilesTable = pgTable(
  "faculty_profiles",
  {
    id: uuid("id").primaryKey().references(() => UsersTable.id, { onDelete: "cascade" }),
    dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
    gender: Gender("gender"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country").default("India"),
    pinCode: text("pin_code"),
    qualifications: jsonb("qualifications").notNull(),
    areasOfExpertise: jsonb("areas_of_expertise"),
    totalExperience: integer("total_experience"),
    teachingExperience: integer("teaching_experience"),
    publications: jsonb("publications"),
    awards: jsonb("awards"),
    researchInterests: jsonb("research_interests"),
    officeAddress: text("office_address"),
    officeHours: jsonb("office_hours"),
    website: text("website"),
    linkedinUrl: text("linkedin_url"),
    googleScholarUrl: text("google_scholar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("faculty_profiles_expertise_idx").on(table.areasOfExpertise),
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

// =====================
// College & Department Tables
// =====================

export const CollegesTable = pgTable(
  "colleges",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
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
    createdBy: uuid("created_by").references(() => UsersTable.id, { onDelete: "set null" }),
    about: text("about"),
    
    verificationDocument: text("verification_document"),
    additionalDocuments: jsonb("additional_documents"),
    
    status: CollegeStatus("status").default("PENDING").notNull(),
    approvedBy: uuid("approved_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    rejectionReason: text("rejection_reason"),
    
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

export const DepartmentsTable = pgTable(
  "departments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => CollegesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: varchar("code", { length: 10 }),
    description: text("description"),
    headOfDepartment: uuid("head_of_department").references(() => UsersTable.id),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("departments_college_id_idx").on(table.collegeId),
    index("departments_is_active_idx").on(table.isActive),
    uniqueIndex("departments_college_code_unique").on(table.collegeId, table.code),
  ]
);

export const FacultyTable = pgTable(
  "faculty",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => CollegesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => DepartmentsTable.id, {
      onDelete: "set null",
    }),
    employeeId: text("employee_id"),
    facultyRole: FacultyRole("faculty_role").default("LECTURER").notNull(),
    designation: text("designation").notNull(),
    employmentType: text("employment_type").default("FULL_TIME"),
    joiningDate: timestamp("joining_date", { mode: "date" }),
    leavingDate: timestamp("leaving_date", { mode: "date" }),
    status: FacultyStatus("status").default("ACTIVE").notNull(),
    
    canCreateCourses: boolean("can_create_courses").default(false).notNull(),
    canApproveContent: boolean("can_approve_content").default(false).notNull(),
    canManageStudents: boolean("can_manage_students").default(false).notNull(),
    canScheduleSessions: boolean("can_schedule_sessions").default(true).notNull(),
    
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("faculty_college_id_idx").on(table.collegeId),
    index("faculty_user_id_idx").on(table.userId),
    index("faculty_department_id_idx").on(table.departmentId),
    index("faculty_status_idx").on(table.status),
    index("faculty_is_active_idx").on(table.isActive),
    uniqueIndex("faculty_employee_id_key").on(table.employeeId),
    uniqueIndex("faculty_user_college_unique").on(table.userId, table.collegeId),
  ]
);

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
    departmentId: uuid("department_id").references(() => DepartmentsTable.id, {
      onDelete: "set null",
    }),
    
    thumbnailUrl: text("thumbnail_url"),
    previewVideoUrl: text("preview_video_url"),
    
    duration: text("duration"),
    language: text("language").default("English").notNull(),
    level: text("level").default("Beginner").notNull(),
    prerequisites: text("prerequisites"),
    
    status: CourseStatus("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }),
    
    submittedForApprovalAt: timestamp("submitted_for_approval_at", {
      mode: "date",
    }),
    approvedBy: uuid("approved_by").references(() => UsersTable.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    rejectionReason: text("rejection_reason"),
    
    isFeatured: boolean("is_featured").default(false).notNull(),
    maxStudents: integer("max_students"),
    currentEnrollments: integer("current_enrollments").default(0).notNull(),
    
    // Completion Requirements
    hasFinalAssessment: boolean("has_final_assessment").default(false).notNull(),
    finalAssessmentRequired: boolean("final_assessment_required").default(true).notNull(),
    minimumCoursePassingScore: integer("minimum_course_passing_score").default(60).notNull(),
    requireAllModulesComplete: boolean("require_all_modules_complete").default(true).notNull(),
    requireAllAssessmentsPassed: boolean("require_all_assessments_passed").default(true).notNull(),
    
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    
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
    index("courses_department_id_idx").on(table.departmentId),
    index("courses_featured_idx").on(table.isFeatured),
  ]
);

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

// =====================
// Course Faculty Mapping
// =====================

export const CourseFacultyTable = pgTable(
  "course_faculty",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    facultyId: uuid("faculty_id")
      .notNull()
      .references(() => FacultyTable.id, { onDelete: "cascade" }),
    isPrimaryInstructor: boolean("is_primary_instructor").default(false).notNull(),
    teachingRole: text("teaching_role").default("INSTRUCTOR"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("course_faculty_course_id_idx").on(table.courseId),
    index("course_faculty_faculty_id_idx").on(table.facultyId),
    uniqueIndex("course_faculty_unique_idx").on(table.courseId, table.facultyId),
  ]
);

// =====================
// Course Content Structure
// =====================

export const CourseModulesTable = pgTable(
  "course_modules",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    
    hasAssessment: boolean("has_assessment").default(false).notNull(),
    assessmentRequired: boolean("assessment_required").default(true).notNull(),
    minimumPassingScore: integer("minimum_passing_score").default(60).notNull(),
    requireAllLessonsComplete: boolean("require_all_lessons_complete").default(true).notNull(),
    
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
    
    contentType: ContentType("content_type").default("VIDEO").notNull(),
    videoUrl: text("video_url"),
    videoDuration: integer("video_duration"),
    articleContent: text("article_content"),
    
    hasQuiz: boolean("has_quiz").default(false).notNull(),
    quizRequired: boolean("quiz_required").default(false).notNull(),
    
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

export const LessonCompletionRulesTable = pgTable(
  "lesson_completion_rules",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => CourseLessonsTable.id, { onDelete: "cascade" }),
    
    requireVideoWatched: boolean("require_video_watched").default(false).notNull(),
    minVideoWatchPercentage: integer("min_video_watch_percentage").default(90).notNull(),
    requireQuizPassed: boolean("require_quiz_passed").default(false).notNull(),
    requireResourcesViewed: boolean("require_resources_viewed").default(false).notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("lesson_completion_rules_lesson_id_idx").on(table.lessonId),
    uniqueIndex("lesson_completion_rules_lesson_unique").on(table.lessonId),
  ]
);

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
    
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id").references(() => CollegesTable.id, {
      onDelete: "cascade",
    }),
    
    thumbnailUrl: text("thumbnail_url"),
    
    duration: text("duration").notNull(),
    startDate: timestamp("start_date", { mode: "date" }),
    endDate: timestamp("end_date", { mode: "date" }),
    
    status: CourseStatus("status").default("DRAFT").notNull(),
    
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
    
    overallScore: integer("overall_score").default(0),
    finalAssessmentScore: integer("final_assessment_score"),
    averageQuizScore: integer("average_quiz_score"),
    
    certificateEligible: boolean("certificate_eligible").default(false).notNull(),
    certificateIssued: boolean("certificate_issued").default(false).notNull(),
    certificateIssuedAt: timestamp("certificate_issued_at", { mode: "date" }),
    
    completedLessons: integer("completed_lessons").default(0).notNull(),
    totalLessons: integer("total_lessons").default(0).notNull(),
    completedAssessments: integer("completed_assessments").default(0).notNull(),
    totalAssessments: integer("total_assessments").default(0).notNull(),
    
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

// =====================
// Progress Tracking Tables
// =====================

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
    
    lastWatchedPosition: integer("last_watched_position").default(0),
    watchDuration: integer("watch_duration").default(0),
    videoPercentageWatched: integer("video_percentage_watched").default(0),
    
    quizAttempted: boolean("quiz_attempted").default(false).notNull(),
    quizScore: integer("quiz_score"),
    quizPassed: boolean("quiz_passed").default(false).notNull(),
    lastQuizAttemptId: uuid("last_quiz_attempt_id").references(() => AssessmentAttemptsTable.id),
    
    resourcesViewed: jsonb("resources_viewed"),
    
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
    index("lesson_progress_is_completed_idx").on(table.isCompleted),
    uniqueIndex("lesson_progress_unique_idx").on(table.userId, table.lessonId),
  ]
);

// =====================
// Batch Management Tables
// =====================

export const BatchesTable = pgTable(
  "batches",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => CollegesTable.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => DepartmentsTable.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    code: varchar("code", { length: 20 }),
    academicYear: text("academic_year").notNull(),
    startDate: timestamp("start_date", { mode: "date" }),
    endDate: timestamp("end_date", { mode: "date" }),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("batches_college_id_idx").on(table.collegeId),
    index("batches_department_id_idx").on(table.departmentId),
    index("batches_academic_year_idx").on(table.academicYear),
    uniqueIndex("batches_college_code_unique").on(table.collegeId, table.code),
  ]
);

export const BatchEnrollmentsTable = pgTable(
  "batch_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => BatchesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    rollNumber: text("roll_number"),
    enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("batch_enrollments_batch_id_idx").on(table.batchId),
    index("batch_enrollments_user_id_idx").on(table.userId),
    uniqueIndex("batch_enrollments_unique_idx").on(table.batchId, table.userId),
    uniqueIndex("batch_enrollments_roll_number_unique").on(table.batchId, table.rollNumber),
  ]
);

export const BatchCoursesTable = pgTable(
  "batch_courses",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => BatchesTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    facultyId: uuid("faculty_id").references(() => FacultyTable.id),
    semester: integer("semester"),
    academicYear: text("academic_year"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("batch_courses_batch_id_idx").on(table.batchId),
    index("batch_courses_course_id_idx").on(table.courseId),
    uniqueIndex("batch_courses_unique_idx").on(table.batchId, table.courseId),
  ]
);

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
    facultyId: uuid("faculty_id").references(() => FacultyTable.id, {
      onDelete: "set null",
    }),
    
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
    index("sessions_faculty_id_idx").on(table.facultyId),
  ]
);

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
    facultyId: uuid("faculty_id").references(() => FacultyTable.id, {
      onDelete: "set null",
    }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("assignments_course_id_idx").on(table.courseId),
    index("assignments_module_id_idx").on(table.moduleId),
    index("assignments_faculty_id_idx").on(table.facultyId),
  ]
);

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
    lessonId: uuid("lesson_id").references(() => CourseLessonsTable.id, {
      onDelete: "cascade",
    }),
    
    assessmentLevel: AssessmentLevel("assessment_level").default("LESSON_QUIZ").notNull(),
    
    title: text("title").notNull(),
    description: text("description"),
    
    duration: integer("duration"),
    passingScore: integer("passing_score").default(60).notNull(),
    maxAttempts: integer("max_attempts"),
    timeLimit: integer("time_limit"),
    
    isRequired: boolean("is_required").default(false).notNull(),
    showCorrectAnswers: boolean("show_correct_answers").default(false).notNull(),
    allowRetake: boolean("allow_retake").default(true).notNull(),
    randomizeQuestions: boolean("randomize_questions").default(false).notNull(),
    
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    facultyId: uuid("faculty_id").references(() => FacultyTable.id, {
      onDelete: "set null",
    }),
    
    availableFrom: timestamp("available_from", { mode: "date" }),
    availableUntil: timestamp("available_until", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("assessments_course_id_idx").on(table.courseId),
    index("assessments_module_id_idx").on(table.moduleId),
    index("assessments_lesson_id_idx").on(table.lessonId),
    index("assessments_assessment_level_idx").on(table.assessmentLevel),
    index("assessments_faculty_id_idx").on(table.facultyId),
    uniqueIndex("assessments_lesson_unique").on(table.lessonId).where(
      sql`${table.lessonId} IS NOT NULL`
    ),
  ]
);

export const AssessmentQuestionsTable = pgTable(
  "assessment_questions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => AssessmentsTable.id, { onDelete: "cascade" }),
    questionBankId: uuid("question_bank_id").references(() => QuestionBanksTable.id, {
      onDelete: "set null",
    }),
    
    questionText: text("question_text").notNull(),
    questionType: QuestionType("question_type").default("MULTIPLE_CHOICE").notNull(),
    difficulty: QuestionDifficulty("difficulty").default("MEDIUM").notNull(),
    
    options: jsonb("options"),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation"),
    
    points: integer("points").default(1).notNull(),
    negativePoints: integer("negative_points").default(0).notNull(),
    
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("assessment_questions_assessment_id_idx").on(table.assessmentId),
    index("assessment_questions_question_bank_id_idx").on(table.questionBankId),
    index("assessment_questions_difficulty_idx").on(table.difficulty),
    index("assessment_questions_sort_order_idx").on(
      table.assessmentId,
      table.sortOrder
    ),
  ]
);

export const QuestionBanksTable = pgTable(
  "question_banks",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => CollegesTable.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => DepartmentsTable.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    tags: jsonb("tags"),
    isShared: boolean("is_shared").default(false).notNull(),
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
    index("question_banks_college_id_idx").on(table.collegeId),
    index("question_banks_department_id_idx").on(table.departmentId),
    index("question_banks_is_shared_idx").on(table.isShared),
    uniqueIndex("question_banks_name_college_unique").on(table.collegeId, table.name),
  ]
);

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
    status: AttemptStatus("status").default("IN_PROGRESS").notNull(),
    
    answers: jsonb("answers"),
    questionDetails: jsonb("question_details"),
    
    score: integer("score").default(0).notNull(),
    totalPoints: integer("total_points").notNull(),
    percentage: integer("percentage").default(0).notNull(),
    
    passed: boolean("passed").default(false).notNull(),
    
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    
    timeSpent: integer("time_spent").default(0),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("assessment_attempts_assessment_id_idx").on(table.assessmentId),
    index("assessment_attempts_user_id_idx").on(table.userId),
    index("assessment_attempts_enrollment_id_idx").on(table.enrollmentId),
    index("assessment_attempts_status_idx").on(table.status),
    index("assessment_attempts_passed_idx").on(table.passed),
    uniqueIndex("assessment_attempts_unique_idx").on(
      table.assessmentId,
      table.userId,
      table.attemptNumber
    ),
  ]
);

// =====================
// Discussion & Forum Tables
// =====================

export const DiscussionForumsTable = pgTable(
  "discussion_forums",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => CoursesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    isLocked: boolean("is_locked").default(false).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
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
    index("discussion_forums_course_id_idx").on(table.courseId),
    index("discussion_forums_is_locked_idx").on(table.isLocked),
    index("discussion_forums_is_pinned_idx").on(table.isPinned),
  ]
);

export const ForumPostsTable = pgTable(
  "forum_posts",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    forumId: uuid("forum_id")
      .notNull()
      .references(() => DiscussionForumsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    title: text("title"),
    content: text("content").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("forum_posts_forum_id_idx").on(table.forumId),
    index("forum_posts_user_id_idx").on(table.userId),
    index("forum_posts_parent_id_idx").on(table.parentId),
    index("forum_posts_is_pinned_idx").on(table.isPinned),
  ]
);

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
    
    verificationCode: text("verification_code").notNull(),
    
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
    
    targetAudience: jsonb("target_audience"),
    
    isScheduled: boolean("is_scheduled").default(false).notNull(),
    scheduledAt: timestamp("scheduled_at", { mode: "date" }),
    
    isPublished: boolean("is_published").default(false).notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }),
    
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    
    collegeId: uuid("college_id").references(() => CollegesTable.id, {
      onDelete: "cascade",
    }),
    courseId: uuid("course_id").references(() => CoursesTable.id, {
      onDelete: "cascade",
    }),
    batchId: uuid("batch_id").references(() => BatchesTable.id, {
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
    index("announcements_batch_id_idx").on(table.batchId),
    index("announcements_published_idx").on(table.isPublished),
  ]
);

// =====================
// Analytics & Reporting Tables
// =====================

export const ReportsTable = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    type: ReportType("type").notNull(),
    description: text("description"),
    filters: jsonb("filters"),
    data: jsonb("data"),
    isScheduled: boolean("is_scheduled").default(false).notNull(),
    scheduleFrequency: text("schedule_frequency"),
    lastGeneratedAt: timestamp("last_generated_at", { mode: "date" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("reports_type_idx").on(table.type),
    index("reports_created_by_idx").on(table.createdBy),
    index("reports_is_scheduled_idx").on(table.isScheduled),
    index("reports_is_active_idx").on(table.isActive),
  ]
);

// =====================
// CMS & Content Tables
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
// Payment Tables (Future)
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
    
    paymentGateway: text("payment_gateway"),
    paymentId: text("payment_id"),
    orderId: text("order_id"),
    
    status: text("status").notNull(),
    
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

// =====================
// ALL RELATIONS (Grouped at the end)
// =====================

// User Relations
export const UsersRelations = relations(UsersTable, ({ many, one }) => ({
  college: one(CollegesTable, {
    fields: [UsersTable.id],
    references: [CollegesTable.userId],
  }),
  studentProfile: one(StudentProfilesTable, {
    fields: [UsersTable.id],
    references: [StudentProfilesTable.id],
  }),
  facultyProfile: one(FacultyProfilesTable, {
    fields: [UsersTable.id],
    references: [FacultyProfilesTable.id],
  }),
  facultyMemberships: many(FacultyTable),
  coursesCreated: many(CoursesTable),
  bootcampsCreated: many(BootcampsTable),
  enrollments: many(EnrollmentsTable),
  bootcampEnrollments: many(BootcampEnrollmentsTable),
  assignments: many(AssignmentSubmissionsTable),
  assessments: many(AssessmentAttemptsTable),
  certificates: many(CertificatesTable),
  sessionsCreated: many(SessionsTable),
  announcements: many(AnnouncementsTable),
  forumPosts: many(ForumPostsTable),
  batchEnrollments: many(BatchEnrollmentsTable),
  activityLogs: many(ActivityLogsTable),
  notifications: many(NotificationsTable),
  createdReports: many(ReportsTable),
  gradedAssignments: many(AssignmentSubmissionsTable, {
    relationName: "graded_assignments"
  }),
}));

export const StudentProfilesRelations = relations(StudentProfilesTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [StudentProfilesTable.id],
    references: [UsersTable.id],
  }),
}));

export const FacultyProfilesRelations = relations(FacultyProfilesTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [FacultyProfilesTable.id],
    references: [UsersTable.id],
  }),
}));

// College Relations
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
  departments: many(DepartmentsTable),
  faculty: many(FacultyTable),
  batches: many(BatchesTable),
  questionBanks: many(QuestionBanksTable),
  payouts: many(PayoutsTable),
}));

export const DepartmentsRelations = relations(DepartmentsTable, ({ one, many }) => ({
  college: one(CollegesTable, {
    fields: [DepartmentsTable.collegeId],
    references: [CollegesTable.id],
  }),
  headOfDepartment: one(UsersTable, {
    fields: [DepartmentsTable.headOfDepartment],
    references: [UsersTable.id],
  }),
  faculty: many(FacultyTable),
  courses: many(CoursesTable),
}));

export const FacultyRelations = relations(FacultyTable, ({ one, many }) => ({
  college: one(CollegesTable, {
    fields: [FacultyTable.collegeId],
    references: [CollegesTable.id],
  }),
  user: one(UsersTable, {
    fields: [FacultyTable.userId],
    references: [UsersTable.id],
  }),
  department: one(DepartmentsTable, {
    fields: [FacultyTable.departmentId],
    references: [DepartmentsTable.id],
  }),
  courseAssignments: many(CourseFacultyTable),
  createdSessions: many(SessionsTable),
  gradedAssignments: many(AssignmentSubmissionsTable),
}));

// Category Relations
export const CategoriesRelations = relations(CategoriesTable, ({ many }) => ({
  courses: many(CoursesTable),
}));

// Course Relations
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
  department: one(DepartmentsTable, {
    fields: [CoursesTable.departmentId],
    references: [DepartmentsTable.id],
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
  facultyAssignments: many(CourseFacultyTable),
  discussionForums: many(DiscussionForumsTable),
}));

export const CourseLearningOutcomesRelations = relations(CourseLearningOutcomesTable, ({ one }) => ({
  course: one(CoursesTable, {
    fields: [CourseLearningOutcomesTable.courseId],
    references: [CoursesTable.id],
  }),
}));

export const CourseRequirementsRelations = relations(CourseRequirementsTable, ({ one }) => ({
  course: one(CoursesTable, {
    fields: [CourseRequirementsTable.courseId],
    references: [CoursesTable.id],
  }),
}));

export const CourseFacultyRelations = relations(CourseFacultyTable, ({ one }) => ({
  course: one(CoursesTable, {
    fields: [CourseFacultyTable.courseId],
    references: [CoursesTable.id],
  }),
  faculty: one(FacultyTable, {
    fields: [CourseFacultyTable.facultyId],
    references: [FacultyTable.id],
  }),
}));

// Course Content Relations
export const CourseModulesRelations = relations(CourseModulesTable, ({ one, many }) => ({
  course: one(CoursesTable, {
    fields: [CourseModulesTable.courseId],
    references: [CoursesTable.id],
  }),
  lessons: many(CourseLessonsTable),
  assignments: many(AssignmentsTable),
  assessments: many(AssessmentsTable),
}));

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
  quiz: one(AssessmentsTable, {
    fields: [CourseLessonsTable.id],
    references: [AssessmentsTable.lessonId],
  }),
  completionRules: one(LessonCompletionRulesTable, {
    fields: [CourseLessonsTable.id],
    references: [LessonCompletionRulesTable.lessonId],
  }),
}));

export const LessonCompletionRulesRelations = relations(LessonCompletionRulesTable, ({ one }) => ({
  lesson: one(CourseLessonsTable, {
    fields: [LessonCompletionRulesTable.lessonId],
    references: [CourseLessonsTable.id],
  }),
}));

// Bootcamp Relations
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

// Enrollment Relations
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
  assessmentAttempts: many(AssessmentAttemptsTable),
  certificate: one(CertificatesTable),
}));

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
  lastQuizAttempt: one(AssessmentAttemptsTable, {
    fields: [LessonProgressTable.lastQuizAttemptId],
    references: [AssessmentAttemptsTable.id],
  }),
}));

// Batch Relations
export const BatchesRelations = relations(BatchesTable, ({ one, many }) => ({
  college: one(CollegesTable, {
    fields: [BatchesTable.collegeId],
    references: [CollegesTable.id],
  }),
  department: one(DepartmentsTable, {
    fields: [BatchesTable.departmentId],
    references: [DepartmentsTable.id],
  }),
  enrollments: many(BatchEnrollmentsTable),
  courses: many(BatchCoursesTable),
}));

export const BatchEnrollmentsRelations = relations(BatchEnrollmentsTable, ({ one }) => ({
  batch: one(BatchesTable, {
    fields: [BatchEnrollmentsTable.batchId],
    references: [BatchesTable.id],
  }),
  user: one(UsersTable, {
    fields: [BatchEnrollmentsTable.userId],
    references: [UsersTable.id],
  }),
}));

// Session Relations
export const SessionsRelations = relations(SessionsTable, ({ one, many }) => ({
  course: one(CoursesTable, {
    fields: [SessionsTable.courseId],
    references: [CoursesTable.id],
  }),
  createdByUser: one(UsersTable, {
    fields: [SessionsTable.createdBy],
    references: [UsersTable.id],
  }),
  faculty: one(FacultyTable, {
    fields: [SessionsTable.facultyId],
    references: [FacultyTable.id],
  }),
  attendance: many(SessionAttendanceTable),
}));

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

// Assignment Relations
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
  faculty: one(FacultyTable, {
    fields: [AssignmentsTable.facultyId],
    references: [FacultyTable.id],
  }),
  submissions: many(AssignmentSubmissionsTable),
}));

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

// Assessment Relations
export const AssessmentsRelations = relations(AssessmentsTable, ({ one, many }) => ({
  course: one(CoursesTable, {
    fields: [AssessmentsTable.courseId],
    references: [CoursesTable.id],
  }),
  module: one(CourseModulesTable, {
    fields: [AssessmentsTable.moduleId],
    references: [CourseModulesTable.id],
  }),
  lesson: one(CourseLessonsTable, {
    fields: [AssessmentsTable.lessonId],
    references: [CourseLessonsTable.id],
  }),
  createdByUser: one(UsersTable, {
    fields: [AssessmentsTable.createdBy],
    references: [UsersTable.id],
  }),
  faculty: one(FacultyTable, {
    fields: [AssessmentsTable.facultyId],
    references: [FacultyTable.id],
  }),
  questions: many(AssessmentQuestionsTable),
  attempts: many(AssessmentAttemptsTable),
}));

export const AssessmentQuestionsRelations = relations(AssessmentQuestionsTable, ({ one }) => ({
  assessment: one(AssessmentsTable, {
    fields: [AssessmentQuestionsTable.assessmentId],
    references: [AssessmentsTable.id],
  }),
  questionBank: one(QuestionBanksTable, {
    fields: [AssessmentQuestionsTable.questionBankId],
    references: [QuestionBanksTable.id],
  }),
}));

export const QuestionBanksRelations = relations(QuestionBanksTable, ({ one, many }) => ({
  college: one(CollegesTable, {
    fields: [QuestionBanksTable.collegeId],
    references: [CollegesTable.id],
  }),
  department: one(DepartmentsTable, {
    fields: [QuestionBanksTable.departmentId],
    references: [DepartmentsTable.id],
  }),
  createdByUser: one(UsersTable, {
    fields: [QuestionBanksTable.createdBy],
    references: [UsersTable.id],
  }),
  questions: many(AssessmentQuestionsTable),
}));

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

// Discussion Relations
export const DiscussionForumsRelations = relations(DiscussionForumsTable, ({ one, many }) => ({
  course: one(CoursesTable, {
    fields: [DiscussionForumsTable.courseId],
    references: [CoursesTable.id],
  }),
  createdByUser: one(UsersTable, {
    fields: [DiscussionForumsTable.createdBy],
    references: [UsersTable.id],
  }),
  posts: many(ForumPostsTable),
}));

export const ForumPostsRelations = relations(ForumPostsTable, ({ one, many }) => ({
  forum: one(DiscussionForumsTable, {
    fields: [ForumPostsTable.forumId],
    references: [DiscussionForumsTable.id],
  }),
  user: one(UsersTable, {
    fields: [ForumPostsTable.userId],
    references: [UsersTable.id],
  }),
  parent: one(ForumPostsTable, {
    fields: [ForumPostsTable.parentId],
    references: [ForumPostsTable.id],
  }),
  replies: many(ForumPostsTable, {
    relationName: "post_replies"
  }),
}));

// Certificate Relations
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

// Announcement Relations
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
  batch: one(BatchesTable, {
    fields: [AnnouncementsTable.batchId],
    references: [BatchesTable.id],
  }),
}));

// Report Relations
export const ReportsRelations = relations(ReportsTable, ({ one }) => ({
  createdByUser: one(UsersTable, {
    fields: [ReportsTable.createdBy],
    references: [UsersTable.id],
  }),
}));