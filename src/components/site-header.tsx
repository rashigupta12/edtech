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
import useSWR, { mutate } from "swr";
import { FuturetekLogo } from "./FutureTekLogo";

type Course = {
  id: string;
  title: string;
  slug: string;
};

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    })
    .then((data) => {
      // Normalize: always return array
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.courses)) return data.courses;
      return [];
    })
    .catch(() => []);

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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      // Mobile behavior: toggle dropdown on click
      e.preventDefault();
      setOpen(!open);
      return;
    }

    // Desktop behavior: handle single/double click
    if (clickTimeoutRef.current) {
      // This is a double click
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      window.location.href = "/courses";
    } else {
      // This is a single click
      e.preventDefault();
      clickTimeoutRef.current = setTimeout(() => {
        setOpen(!open);
        clickTimeoutRef.current = null;
      }, 300); // 300ms delay to detect double click
    }
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
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
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-2">
            {loading ? (
              <div className="px-4 py-2 text-sm text-slate-500">Loading...</div>
            ) : courses.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-500">No courses</div>
            ) : (
              courses.map((course) => (
                <NavLink
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="block px-4 py-2.5 hover:bg-blue-50 rounded-md text-sm text-slate-700 hover:text-blue-700"
                
                >
                  {course.title}
                </NavLink>
              ))
            )}
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
      // This is a double click
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setIsOpen(false);
      window.location.href = "/courses";
    } else {
      // This is a single click
      clickTimeoutRef.current = setTimeout(() => {
        setCoursesOpen(!coursesOpen);
        clickTimeoutRef.current = null;
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden border border-slate-300 size-9 shrink-0 hover:bg-blue-50 hover:text-blue-700"
        >
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0  flex flex-col">
        <div className="px-6 pt-4">
          <Link href="/" onClick={() => setIsOpen(false)}>
            <FuturetekLogo width={180} height={100} />
          </Link>
        </div>

        <Separator />

        {session && (
          <>
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100/50">
              <p className="text-sm text-slate-600">Welcome back,</p>
              <p className="font-semibold text-blue-900">{session.user.name}</p>
            </div>
            <Separator />
          </>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {session && (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </Button>
                <Separator className="my-2" />
              </>
            )}

            {/* Courses with double-click behavior */}
            <Button
              variant="ghost"
              className="w-full justify-between gap-3 h-11 hover:bg-blue-50 hover:text-blue-700"
              onClick={handleCoursesClick}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Courses</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${coursesOpen ? "rotate-180" : ""}`}
              />
            </Button>

           {coursesOpen && (
              <div className="pl-4 space-y-1 border-l-2 border-blue-100 ml-5">
                {courses.map((course) => (
                  <Button
                    key={course.id}
                    asChild
                    variant="ghost"
                    className="w-full justify-start h-auto min-h-10 text-sm hover:bg-blue-50 hover:text-blue-700 whitespace-normal text-left py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href={`/courses/${course.slug}`} className="break-words">{course.title}</Link>
                  </Button>
                ))}
              </div>
            )}

            {/* Other menu items */}
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={item.href}>
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </nav>

        <Separator />

        <div className="p-3 space-y-2">
          {session ? (
            <Button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              variant="outline"
              className="w-full justify-start gap-3 h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start gap-3 h-11 border-slate-300 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => setIsOpen(false)}
              >
                <Link href="/auth/login">
                  <LogIn className="h-5 w-5" />
                  <span className="font-medium">Login</span>
                </Link>
              </Button>
              <Button
                asChild
                className="w-full justify-start gap-3 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                onClick={() => setIsOpen(false)}
              >
                <Link href="/auth/register">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-medium">Sign Up</span>
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

  // SWR + Safe Normalization
 const { data: courses = [], isLoading } = useSWR<Course[]>(
  "/api/admin/courses",
  fetcher,
  {
    dedupingInterval: 300_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true, // Add this
    fallbackData: [],
  }
);
// Add a manual refresh function
// const refreshCourses = () => {
//   mutate("/api/admin/courses");
// };
const handleLogout = async () => {
  startTransition(async () => {
    // Clear SWR cache before logout
    await mutate(() => true, undefined, { revalidate: false });
    
    // Sign out with proper redirect
    await signOut({ 
      callbackUrl: "/auth/login",
      redirect: true 
    });
  });
};
  return (
    <header className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-4 px-4">
        <div className="mr-10 flex items-center gap-2">
          <Sidebar
            session={session ?? null}
            handleLogout={handleLogout}
            courses={courses}
          />
          <Link href="/" prefetch={true}>
            <FuturetekLogo width={180} height={54} />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <CoursesDropdown courses={courses} loading={isLoading} />
          <NavLink href="/about">About</NavLink>
          <NavLink href="/career">Career</NavLink>
          <NavLink href="/blogs">Blogs</NavLink>
          <NavLink href="/contact">Contact Us</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden md:inline text-sm text-slate-700">
                Hi, {session.user.name}
              </span>
              <Button asChild variant="ghost" className="hidden md:flex hover:bg-blue-50 hover:text-blue-700">
                <Link href="/dashboard" prefetch={true}>Dashboard</Link>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={isPending}
                className="hidden md:flex border-slate-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                {isPending ? "Logging out..." : "Logout"}
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="md:hidden hover:bg-blue-50 hover:text-blue-700">
                    <Link href="/dashboard" prefetch={true}>
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
                    className="md:hidden hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Logout</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden md:flex hover:bg-blue-50 hover:text-blue-700">
                <Link href="/auth/login" prefetch={true}>Login</Link>
              </Button>
              <Button asChild className="hidden md:flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Link href="/auth/register" prefetch={true}>Sign Up</Link>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="md:hidden hover:bg-blue-50 hover:text-blue-700">
                    <Link href="/auth/login" prefetch={true}>
                      <LogIn className="h-5 w-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Login</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="default" size="icon" className="md:hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <Link href="/auth/register" prefetch={true}>
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