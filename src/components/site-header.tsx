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

  ChevronDown,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  UserPlus,
  Leaf,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useTransition, useRef, useEffect } from "react";
import useSWR from "swr";

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
      className={`transition-colors hover:text-emerald-700 ${className}`}
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
        className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-emerald-800 transition-colors"
        onClick={handleClick}
      >
        <BookOpen className="h-4 w-4 mr-1" />
        Courses
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-2 z-50 w-64">
          <div className="bg-white border border-emerald-100 rounded-xl shadow-xl overflow-hidden">
            
            
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-400" />
                No courses available
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {courses.map((course) => (
                  <NavLink
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="block px-4 py-3 hover:bg-emerald-50 text-sm text-gray-700 hover:text-emerald-800 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      {course.title}
                    </div>
                  </NavLink>
                ))}
              </div>
            )}
            <div className="border-t border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3">
              <NavLink href="/courses" className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Explore all courses →
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
    // { href: "/career", label: "Career", icon: Briefcase },
    // { href: "/blogs", label: "Blogs", icon: BookOpen },
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
        <Button variant="ghost" size="icon" className="md:hidden hover:bg-emerald-50 hover:text-emerald-700">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0 flex flex-col border-emerald-100">
        <div className="p-8 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-800 bg-clip-text text-transparent">
                EduTech
              </div>
              <div className="text-xs text-emerald-600 font-medium">Learn & Grow</div>
            </div>
          </Link>
        </div>

        {session && (
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
            <p className="text-sm text-emerald-700">Welcome back,</p>
            <p className="font-semibold text-emerald-900 truncate">{session.user?.name}</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {session && (
              <>
                <Button 
                  asChild 
                  variant="ghost" 
                  className="w-full justify-start gap-3 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700" 
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" /> Dashboard
                  </Link>
                </Button>
                <Separator className="bg-emerald-100" />
              </>
            )}

            <Button
              variant="ghost"
              className="w-full justify-between hover:bg-emerald-50 hover:text-emerald-700 text-gray-700"
              onClick={handleCoursesClick}
            >
              <span className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" /> Courses
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${coursesOpen ? "rotate-180" : ""}`} />
            </Button>

            {coursesOpen && (
              <div className="pl-8 space-y-1 border-l-2 border-emerald-200 ml-3 my-2">
                {courses.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2 flex items-center gap-2">
                    <Leaf className="h-3 w-3" />
                    No published courses
                  </p>
                ) : (
                  courses.map((course) => (
                    <Button
                      key={course.id}
                      asChild
                      variant="ghost"
                      className="w-full justify-start text-sm py-2 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link href={`/courses/${course.slug}`}>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                          {course.title}
                        </div>
                      </Link>
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
                className="w-full justify-start gap-3 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <Link href={href}>
                  <Icon className="h-5 w-5" /> {label}
                </Link>
              </Button>
            ))}
          </div>
        </nav>

        <div className="border-t border-emerald-100 p-4 space-y-2 bg-gradient-to-r from-emerald-50/30 to-green-50/30">
          {session ? (
            <Button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              variant="outline"
              className="w-full justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="h-5 w-5" /> Logout
            </Button>
          ) : (
            <>
              <Button 
                asChild 
                variant="outline" 
                className="w-full justify-start gap-3 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-gray-700 border-gray-200" 
                onClick={() => setIsOpen(false)}
              >
                <Link href="/auth/login">
                  <LogIn className="h-5 w-5" /> Login
                </Link>
              </Button>
              <Button 
                asChild 
                className="w-full justify-start gap-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-md hover:shadow-lg" 
                onClick={() => setIsOpen(false)}
              >
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
    <header className="sticky top-0 z-50 bg-white border-b border-emerald-100 shadow-sm p-2">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Sidebar session={session ?? null} handleLogout={handleLogout} courses={courses} />
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-sm">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-800 bg-clip-text text-transparent">
                EduTech
              </h1>
              <div className="text-xs text-emerald-600 font-medium -mt-1">Learn & Grow</div>
            </div>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <CoursesDropdown courses={courses} loading={isLoading} />
          <NavLink href="/about">About</NavLink>
          {/* <NavLink href="/career">Career</NavLink> */}
          {/* <NavLink href="/blogs">Blogs</NavLink> */}
          <NavLink href="/contact">Contact Us</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden md:block text-sm text-gray-700">
                Hi, <span className="font-semibold text-emerald-800">{session.user?.name}</span>
              </span>
              <Button asChild variant="outline" className="hidden md:flex border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                onClick={handleLogout}
                disabled={isPending}
                variant="outline"
                className="hidden md:flex border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                {isPending ? "Logging out..." : "Logout"}
              </Button>

              {/* Mobile icons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="md:hidden hover:bg-emerald-50 hover:text-emerald-700">
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-emerald-900 text-white">Dashboard</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className="md:hidden text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-red-600 text-white">Logout</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="hidden md:flex border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="hidden md:flex bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-md hover:shadow-lg">
                <Link href="/auth/register">Sign Up</Link>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="md:hidden hover:bg-emerald-50 hover:text-emerald-700">
                    <Link href="/auth/login">
                      <LogIn className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-emerald-900 text-white">Login</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" className="md:hidden bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-md">
                    <Link href="/auth/register">
                      <UserPlus className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-emerald-900 text-white">Sign Up</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </header>
  );
}