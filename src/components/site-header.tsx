"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  UserPlus,
} from "lucide-react";
import { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useTransition, useRef, useEffect } from "react";
import useSWR from "swr";
import { FuturetekLogo } from "./FutureTekLogo";

type Course = {
  id: string;
  title: string;
  slug: string;
  status?: string;
};

// Fixed fetcher to handle your API response structure
const fetcher = (url: string) =>
  fetch(url, { next: { revalidate: 300 } })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    })
    .then((data) => {
      console.log("API Response:", data); // Debug log
      
      // Handle your API structure: { success: true, data: [...] }
      if (data.success && Array.isArray(data.data)) {
        // Filter only PUBLISHED courses for the dropdown
        return data.data.filter((course: Course) => course.status === "PUBLISHED");
      }
      
      // Fallback for other formats
      if (Array.isArray(data)) return data;
      if (data?.courses && Array.isArray(data.courses)) return data.courses;
      
      return [];
    })
    .catch((err) => {
      console.error("Courses fetch error:", err);
      return [];
    });

function NavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={`transition-colors hover:text-blue-600 ${className}`}
    >
      {children}
    </Link>
  );
}

function CoursesDropdown({ courses, loading }: { courses: Course[]; loading: boolean }) {
  const [open, setOpen] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setOpen((prev) => !prev);
      return;
    }

    // Desktop: single click = open dropdown, double click = go to /courses
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      window.location.href = "/courses";
    } else {
      e.preventDefault();
      clickTimeoutRef.current = setTimeout(() => {
        setOpen((prev) => !prev);
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={() => !isMobile && setOpen(true)}
      onMouseLeave={() => !isMobile && setOpen(false)}
    >
      <button
        className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        onClick={handleClick}
      >
        Courses
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-2 z-50 w-64">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="px-4 py-3 text-sm text-slate-500">Loading courses...</div>
            ) : courses.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">No courses available</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {courses.map((course) => (
                  <NavLink
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="block px-4 py-3 hover:bg-blue-50 text-sm text-slate-700 hover:text-blue-700 transition-colors"
                  >
                    {course.title}
                  </NavLink>
                ))}
              </div>
            )}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
              <NavLink href="/courses" className="text-xs font-medium text-blue-600 hover:text-blue-800">
                View all courses →
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  session,
  handleLogout,
  courses,
}: {
  session: Session | null;
  handleLogout: () => void;
  courses: Course[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const menuItems = [
    { href: "/about", label: "About", icon: Info },
    { href: "/career", label: "Career", icon: Briefcase },
    { href: "/blogs", label: "Blogs", icon: BookOpen },
    { href: "/contact", label: "Contact Us", icon: Mail },
  ];

  const handleCoursesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setIsOpen(false);
      window.location.href = "/courses";
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        setCoursesOpen((prev) => !prev);
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        <div className="p-6 border-b">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <FuturetekLogo width={180} height={60} />
          </Link>
        </div>

        {session && (
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <p className="text-sm text-slate-600">Welcome back,</p>
            <p className="font-semibold text-blue-900 truncate">{session.user?.name}</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {session && (
              <>
                <Button asChild variant="ghost" className="w-full justify-start gap-3" onClick={() => setIsOpen(false)}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" /> Dashboard
                  </Link>
                </Button>
                <Separator />
              </>
            )}

            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={handleCoursesClick}
            >
              <span className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" /> Courses
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${coursesOpen ? "rotate-180" : ""}`} />
            </Button>

            {coursesOpen && (
              <div className="pl-8 space-y-1 border-l-2 border-blue-200">
                {courses.length === 0 ? (
                  <p className="text-sm text-slate-500 py-2">No published courses</p>
                ) : (
                  courses.map((course) => (
                    <Button
                      key={course.id}
                      asChild
                      variant="ghost"
                      className="w-full justify-start text-sm py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href={`/courses/${course.slug}`}>{course.title}</Link>
                    </Button>
                  ))
                )}
              </div>
            )}

            {menuItems.map(({ href, label, icon: Icon }) => (
              <Button
                key={href}
                asChild
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => setIsOpen(false)}
              >
                <Link href={href}>
                  <Icon className="h-5 w-5" /> {label}
                </Link>
              </Button>
            ))}
          </div>
        </nav>

        <div className="border-t p-4 space-y-2">
          {session ? (
            <Button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              variant="outline"
              className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" /> Logout
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="w-full justify-start gap-3" onClick={() => setIsOpen(false)}>
                <Link href="/auth/login">
                  <LogIn className="h-5 w-5" /> Login
                </Link>
              </Button>
              <Button asChild className="w-full justify-start gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white" onClick={() => setIsOpen(false)}>
                <Link href="/auth/register">
                  <UserPlus className="h-5 w-5" /> Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader() {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  // Fetch courses with corrected response handling
  const { data: courses = [], isLoading } = useSWR<Course[]>(
    "/api/courses",
    fetcher,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      fallbackData: [],
    }
  );

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/" });
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Sidebar session={session ?? null} handleLogout={handleLogout} courses={courses} />
          <Link href="/" className="flex items-center">
            <FuturetekLogo width={180} height={54} />
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <CoursesDropdown courses={courses} loading={isLoading} />
          <NavLink href="/about">About</NavLink>
          <NavLink href="/career">Career</NavLink>
          <NavLink href="/blogs">Blogs</NavLink>
          <NavLink href="/contact">Contact Us</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden md:block text-sm text-slate-700">Hi, {session.user?.name}</span>
              <Button asChild variant="ghost" className="hidden md:flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                onClick={handleLogout}
                disabled={isPending}
                variant="outline"
                className="hidden md:flex border-red-200 text-red-600 hover:bg-red-50"
              >
                {isPending ? "Logging out..." : "Logout"}
              </Button>

              {/* Mobile icons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="md:hidden">
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dashboard</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className="md:hidden text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Logout</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden md:flex">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="hidden md:flex bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <Link href="/auth/register">Sign Up</Link>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="md:hidden">
                    <Link href="/auth/login">
                      <LogIn className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Login</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" className="md:hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <Link href="/auth/register">
                      <UserPlus className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sign Up</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </header>
  );
}