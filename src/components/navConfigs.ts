

import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  List,
  MessageCircle,
  MessageSquare,
  Package,
  Plus,
  Settings,
  Tag,
  TrendingUp,
  Users,
  Video,
  Wallet
} from "lucide-react";
export const navConfigs = {
  // =====================
  // ADMIN NAVIGATION
  // =====================
  admin: [
    { title: "Dashboard", href: "/dashboard/admin", icon: Home },

    // Faculty Management
    {
      title: "Faculty Management",
      icon: Users,
      children: [
        {
          title: "All Faculty",
          href: "/dashboard/admin/faculty",
          icon: List,
        },
        // {
        //   title: "Add Platform Faculty",
        //   href: "/dashboard/admin/faculty/create",
        //   icon: Plus,
        // },
        // {
        //   title: "Faculty Performance",
        //   href: "/dashboard/admin/faculty/performance",
        //   icon: TrendingUp,
        // },
      ],
    },

    // College Management
    {
      title: "College Management",
      icon: Building2,
      children: [
        {
          title: "All Colleges",
          href: "/dashboard/admin/colleges",
          icon: List,
        },
        {
          title: "College Approvals",
          href: "/dashboard/admin/colleges/approvals",
          icon: ClipboardList,
        },
        {
          title: "College Analytics",
          href: "/dashboard/admin/colleges/analytics",
          icon: TrendingUp,
        },
      ],
    },

    // Course Management
    {
      title: "Course Management",
      icon: BookOpen,
      children: [
        {
          title: "All Courses",
          href: "/dashboard/admin/courses",
          icon: List,
        },
        {
          title: "Create Platform Course",
          href: "/dashboard/admin/courses/create",
          icon: Plus,
        },
        {
          title: "Course Approvals",
          href: "/dashboard/admin/courses/approvals",
          icon: ClipboardList,
        },
        {
          title: "Course Analytics",
          href: "/dashboard/admin/courses/analytics",
          icon: TrendingUp,
        },
      ],
    },

    // Bootcamp Management
    {
      title: "Bootcamp Management",
      icon: GraduationCap,
      children: [
        {
          title: "All Bootcamps",
          href: "/dashboard/admin/bootcamps",
          icon: List,
        },
        {
          title: "Create Bootcamp",
          href: "/dashboard/admin/bootcamps/create",
          icon: Plus,
        },
        {
          title: "Bootcamp Enrollments",
          href: "/dashboard/admin/bootcamps/enrollments",
          icon: Users,
        },
      ],
    },

    // Student Management
    {
      title: "Student Management",
      icon: GraduationCap,
      children: [
        {
          title: "All Students",
          href: "/dashboard/admin/students",
          icon: List,
        },
        {
          title: "Enrollment Trends",
          href: "/dashboard/admin/students/enrollments",
          icon: TrendingUp,
        },
        {
          title: "Student Activity",
          href: "/dashboard/admin/students/activity",
          icon: MessageSquare,
        },
      ],
    },

    // Department Management
    {
      title: "Department Management",
      href: "/dashboard/admin/departments",
      icon: Briefcase,
    },

    // Categories
    {
      title: "Categories",
      href: "/dashboard/admin/categories",
      icon: Tag,
    },

    // Discussion Forums
    // {
    //   title: "Discussion Forums",
    //   href: "/dashboard/admin/forums",
    //   icon: MessageCircle,
    // },

    // Announcements
    // {
    //   title: "Announcements",
    //   icon: MessageSquare,
    //   children: [
    //     {
    //       title: "All Announcements",
    //       href: "/dashboard/admin/announcements",
    //       icon: List,
    //     },
    //     {
    //       title: "Create Announcement",
    //       href: "/dashboard/admin/announcements/create",
    //       icon: Plus,
    //     },
    //   ],
    // },

    // Reports
    // {
    //   title: "Reports",
    //   icon: FileText,
    //   children: [
    //     {
    //       title: "Enrollment Reports",
    //       href: "/dashboard/admin/reports/enrollments",
    //       icon: Users,
    //     },
    //     {
    //       title: "Revenue Reports",
    //       href: "/dashboard/admin/reports/revenue",
    //       icon: CreditCard,
    //     },
    //     {
    //       title: "Performance Reports",
    //       href: "/dashboard/admin/reports/performance",
    //       icon: TrendingUp,
    //     },
    //     {
    //       title: "College Reports",
    //       href: "/dashboard/admin/reports/colleges",
    //       icon: Building2,
    //     },
    //   ],
    // },

    // CMS Pages
    {
      title: "CMS Pages",
      href: "/dashboard/admin/cms",
      icon: LayoutDashboard,
    },

    // Testimonials
    {
      title: "Testimonials",
      href: "/dashboard/admin/testimonials",
      icon: Award,
    },

    // Settings
    // {
    //   title: "Settings",
    //   href: "/dashboard/admin/settings",
    //   icon: Settings,
    // },
  ] as const,

  // =====================
  // COLLEGE NAVIGATION
  // =====================
  college: [
    { title: "Dashboard", href: "/dashboard/college", icon: Home },

    // Profile
    {
      title: "College Profile",
      href: "/dashboard/college/profile",
      icon: Building2,
    },

    // Faculty Management
    {
      title: "Faculty Management",
      icon: Users,
      children: [
        {
          title: "Faculty List",
          href: "/dashboard/college/faculty",
          icon: List,
        },
        {
          title: "Add Faculty",
          href: "/dashboard/college/faculty/add",
          icon: Plus,
        },
        {
          title: "Faculty Permissions",
          href: "/dashboard/college/faculty/permissions",
          icon: Settings,
        },
        {
          title: "Faculty Assignments",
          href: "/dashboard/college/faculty/assignments",
          icon: ClipboardList,
        },
      ],
    },

    // Department Management
    {
      title: "Departments",
      icon: Briefcase,
      children: [
        {
          title: "All Departments",
          href: "/dashboard/college/departments",
          icon: List,
        },
        {
          title: "HOD Assignments",
          href: "/dashboard/college/departments/hod",
          icon: Users,
        },
      ],
    },

    // Course Management
    {
      title: "Course Management",
      icon: BookOpen,
      children: [
        {
          title: "College Courses",
          href: "/dashboard/college/courses",
          icon: List,
        },
        {
          title: "Create Course",
          href: "/dashboard/college/courses/create",
          icon: Plus,
        },
        {
          title: "Course Editor",
          href: "/dashboard/college/courses/editor",
          icon: FileText,
        },
        {
          title: "Course Approvals",
          href: "/dashboard/college/courses/approvals",
          icon: ClipboardList,
        },
      ],
    },

    // Student Enrollment Management
    {
      title: "Student Enrollments",
      icon: GraduationCap,
      children: [
        {
          title: "All Enrollments",
          href: "/dashboard/college/enrollments",
          icon: List,
        },
        {
          title: "Student Progress",
          href: "/dashboard/college/enrollments/progress",
          icon: TrendingUp,
        },
        {
          title: "Batch Enrollments",
          href: "/dashboard/college/enrollments/batches",
          icon: Users,
        },
      ],
    },

    // Batch Management
    {
      title: "Batch Management",
      icon: Calendar,
      children: [
        {
          title: "All Batches",
          href: "/dashboard/college/batches",
          icon: List,
        },
        {
          title: "Create Batch",
          href: "/dashboard/college/batches/create",
          icon: Plus,
        },
        {
          title: "Batch Enrollments",
          href: "/dashboard/college/batches/enrollments",
          icon: Users,
        },
        {
          title: "Batch Courses",
          href: "/dashboard/college/batches/courses",
          icon: BookOpen,
        },
        {
          title: "Batch Performance",
          href: "/dashboard/college/batches/performance",
          icon: TrendingUp,
        },
      ],
    },

    // Reports
    {
      title: "Reports",
      icon: FileText,
      children: [
        {
          title: "Enrollment Reports",
          href: "/dashboard/college/reports/enrollments",
          icon: Users,
        },
        {
          title: "Course Performance",
          href: "/dashboard/college/reports/courses",
          icon: BookOpen,
        },
        {
          title: "Revenue Reports",
          href: "/dashboard/college/reports/revenue",
          icon: CreditCard,
        },
        {
          title: "Student Performance",
          href: "/dashboard/college/reports/students",
          icon: TrendingUp,
        },
      ],
    },

    // Announcements
    {
      title: "Announcements",
      icon: MessageSquare,
      children: [
        {
          title: "All Announcements",
          href: "/dashboard/college/announcements",
          icon: List,
        },
        {
          title: "Create Announcement",
          href: "/dashboard/college/announcements/create",
          icon: Plus,
        },
      ],
    },

    // Settings
    {
      title: "Settings",
      href: "/dashboard/college/settings",
      icon: Settings,
    },
  ] as const,

  // =====================
  // FACULTY NAVIGATION
  // =====================
  faculty: [
    { title: "Dashboard", href: "/dashboard/faculty", icon: Home },

    // My Courses
    {
      title: "My Courses",
      icon: BookOpen,
      children: [
        {
          title: "All Courses",
          href: "/dashboard/faculty/courses",
          icon: List,
        },
        {
          title: "Create Course",
          href: "/dashboard/faculty/courses/create",
          icon: Plus,
        },
        {
          title: "Edit Course",
          href: "/dashboard/faculty/courses/edit",
          icon: FileText,
        },
      ],
    },

    // Content Management
    {
      title: "Content Management",
      icon: Package,
      children: [
        {
          title: "Modules",
          href: "/dashboard/faculty/content/modules",
          icon: List,
        },
        {
          title: "Lessons",
          href: "/dashboard/faculty/content/lessons",
          icon: BookOpen,
        },
        {
          title: "Resources",
          href: "/dashboard/faculty/content/resources",
          icon: FileText,
        },
      ],
    },

    // Assessment Management
    {
      title: "Assessments",
      icon: ClipboardList,
      children: [
        {
          title: "Create Assessment",
          href: "/dashboard/faculty/assessments/create",
          icon: Plus,
        },
        {
          title: "Question Banks",
          href: "/dashboard/faculty/assessments/question-banks",
          icon: List,
        },
        {
          title: "Assessment Results",
          href: "/dashboard/faculty/assessments/results",
          icon: TrendingUp,
        },
        {
          title: "Manual Grading",
          href: "/dashboard/faculty/assessments/grading",
          icon: FileText,
        },
      ],
    },

    // Assignment Management
    {
      title: "Assignments",
      icon: FileText,
      children: [
        {
          title: "Create Assignment",
          href: "/dashboard/faculty/assignments/create",
          icon: Plus,
        },
        {
          title: "View Submissions",
          href: "/dashboard/faculty/assignments/submissions",
          icon: List,
        },
        {
          title: "Grade Submissions",
          href: "/dashboard/faculty/assignments/grading",
          icon: ClipboardList,
        },
      ],
    },

    // Live Sessions
    {
      title: "Live Sessions",
      icon: Video,
      children: [
        {
          title: "Schedule Session",
          href: "/dashboard/faculty/sessions/schedule",
          icon: Plus,
        },
        {
          title: "My Sessions",
          href: "/dashboard/faculty/sessions",
          icon: List,
        },
        {
          title: "Attendance",
          href: "/dashboard/faculty/sessions/attendance",
          icon: Users,
        },
        {
          title: "Recordings",
          href: "/dashboard/faculty/sessions/recordings",
          icon: Video,
        },
      ],
    },

    // Student Management
    {
      title: "Student Management",
      icon: Users,
      children: [
        {
          title: "Student Progress",
          href: "/dashboard/faculty/students/progress",
          icon: TrendingUp,
        },
        {
          title: "Gradebook",
          href: "/dashboard/faculty/students/gradebook",
          icon: ClipboardList,
        },
        {
          title: "Individual Analysis",
          href: "/dashboard/faculty/students/analysis",
          icon: FileText,
        },
      ],
    },

    // Communication
    {
      title: "Communication",
      icon: MessageCircle,
      children: [
        {
          title: "Announcements",
          href: "/dashboard/faculty/announcements",
          icon: MessageSquare,
        },
        {
          title: "Discussion Forums",
          href: "/dashboard/faculty/forums",
          icon: MessageCircle,
        },
      ],
    },

    // Profile
    {
      title: "Profile",
      href: "/dashboard/faculty/profile",
      icon: Users,
    },
  ] as const,

  // =====================
  // STUDENT NAVIGATION
  // =====================
  student: [
    { title: "Dashboard", href: "/dashboard/student", icon: Home },

    // Course Catalog
    {
      title: "Course Catalog",
      icon: BookOpen,
      children: [
        {
          title: "Browse Courses",
          href: "/dashboard/student/catalog",
          icon: List,
        },
        {
          title: "Categories",
          href: "/dashboard/student/catalog/categories",
          icon: Tag,
        },
        {
          title: "Wishlist",
          href: "/dashboard/student/catalog/wishlist",
          icon: Award,
        },
      ],
    },

    // My Learning
    {
      title: "My Learning",
      icon: GraduationCap,
      children: [
        {
          title: "Enrolled Courses",
          href: "/dashboard/student/courses",
          icon: List,
        },
        {
          title: "Continue Learning",
          href: "/dashboard/student/courses/continue",
          icon: BookOpen,
        },
        {
          title: "Completed Courses",
          href: "/dashboard/student/courses/completed",
          icon: Award,
        },
      ],
    },

    // Assessments
    {
      title: "Assessments",
      icon: ClipboardList,
      children: [
        {
          title: "Pending Assessments",
          href: "/dashboard/student/assessments/pending",
          icon: List,
        },
        {
          title: "Assessment History",
          href: "/dashboard/student/assessments/history",
          icon: FileText,
        },
      ],
    },

    // Assignments
    {
      title: "Assignments",
      icon: FileText,
      children: [
        {
          title: "Pending Assignments",
          href: "/dashboard/student/assignments/pending",
          icon: List,
        },
        {
          title: "Submitted Assignments",
          href: "/dashboard/student/assignments/submitted",
          icon: ClipboardList,
        },
      ],
    },

    // Live Sessions
    {
      title: "Live Sessions",
      icon: Video,
      children: [
        {
          title: "Upcoming Sessions",
          href: "/dashboard/student/sessions/upcoming",
          icon: Calendar,
        },
        {
          title: "Recordings",
          href: "/dashboard/student/sessions/recordings",
          icon: Video,
        },
      ],
    },

    // Progress & Achievements
    {
      title: "Progress & Achievements",
      icon: TrendingUp,
      children: [
        {
          title: "My Progress",
          href: "/dashboard/student/progress",
          icon: TrendingUp,
        },
        {
          title: "Certificates",
          href: "/dashboard/student/certificates",
          icon: Award,
        },
        {
          title: "Learning Analytics",
          href: "/dashboard/student/analytics",
          icon: FileText,
        },
      ],
    },

    // Community
    {
      title: "Community",
      icon: MessageCircle,
      children: [
        {
          title: "Discussion Forums",
          href: "/dashboard/student/forums",
          icon: MessageCircle,
        },
        {
          title: "My Posts",
          href: "/dashboard/student/forums/my-posts",
          icon: MessageSquare,
        },
      ],
    },

    // Profile
    {
      title: "Profile",
      icon: Users,
      children: [
        {
          title: "Personal Info",
          href: "/dashboard/student/profile",
          icon: Users,
        },
        {
          title: "Academic Details",
          href: "/dashboard/student/profile/academic",
          icon: GraduationCap,
        },
        {
          title: "Settings",
          href: "/dashboard/student/profile/settings",
          icon: Settings,
        },
      ],
    },

    // Payments (if applicable)
    {
      title: "Payments",
      href: "/dashboard/student/payments",
      icon: Wallet,
    },
  ] as const,
};