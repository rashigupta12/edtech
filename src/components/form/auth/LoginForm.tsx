"use client";

import { EyeOff, Eye } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../../ui/button";
import { loginUser } from "@/actions/loginUser";
import { FormSuccess } from "../form-success";
import { FormError } from "../form-error";

// Enhanced validation schema
const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine(
      (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      {
        message: "Please enter a valid email address (e.g., john.snow@gmail.com)",
      }
    ),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .refine(
      (password) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
      },
      {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      }
    ),
});

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange", // Validate on change for real-time feedback
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Real-time validation
  const handleInputChange = (field: string) => {
    setValidationErrors(prev => ({ ...prev, [field]: "" }));
  };

  // Custom validation before submission
  const validateForm = (data: z.infer<typeof LoginSchema>) => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!data.password) {
      errors.password = "Password is required";
    } else if (data.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else {
      const hasUpperCase = /[A-Z]/.test(data.password);
      const hasLowerCase = /[a-z]/.test(data.password);
      const hasNumbers = /\d/.test(data.password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(data.password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        errors.password = "Password must contain uppercase, lowercase, number, and special character";
      }
    }

    return errors;
  };

  async function onSubmit(data: z.infer<typeof LoginSchema>) {
    setError(undefined);
    setSuccess(undefined);
    setValidationErrors({});

    // Manual validation before submission
    const errors = validateForm(data);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    startTransition(async () => {
      try {
        const result = await loginUser(data);
        
        if (result?.error) {
          setError(result.error);
          return;
        }

        if (result?.success) {
          setSuccess(result.success);
          
          // If there's a redirectTo, handle the redirect
          if (result.redirectTo) {
            // Small delay to show success message
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Use window.location to ensure session is properly loaded
            window.location.href = result.redirectTo;
          }
        }
      } catch (e) {
        console.error("Login error:", e);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }

  // Get field errors for real-time display
  const getFieldError = (fieldName: keyof z.infer<typeof LoginSchema>) => {
    return form.formState.errors[fieldName]?.message || validationErrors[fieldName];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg border border-slate-200">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-2">
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <span className="text-white font-bold text-xl">F</span>
              </div>
            </div>
          </Link>
          <h1 className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent font-bold text-xl">
            Futuretek
          </h1>
        </div>

        {/* Login Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-600">Please login to your account</p>
        </div>

        {/* Login Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Email
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="john.snow@gmail.com"
                      className={`h-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        getFieldError('email') 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-slate-300'
                      }`}
                      type="email"
                      disabled={isPending}
                      onChange={(e) => {
                        field.onChange(e);
                        handleInputChange('email');
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-sm text-red-500 flex items-center gap-1">
                    {getFieldError('email') && (
                      <>
                        <span>⚠️</span>
                        {getFieldError('email')}
                      </>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Password
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="********"
                        className={`h-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          getFieldError('password') 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-slate-300'
                        }`}
                        type={showPassword ? "text" : "password"}
                        disabled={isPending}
                        onChange={(e) => {
                          field.onChange(e);
                          handleInputChange('password');
                        }}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                      onClick={togglePasswordVisibility}
                      disabled={isPending}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <FormMessage className="text-sm text-red-500 flex items-center gap-1">
                    {getFieldError('password') && (
                      <>
                        <span>⚠️</span>
                        {getFieldError('password')}
                      </>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  disabled={isPending}
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <Button
                asChild
                variant="link"
                size="sm"
                className="px-0 text-sm text-blue-600 hover:text-blue-800"
              >
                <Link href="/auth/forgot-password">Forgot password?</Link>
              </Button>
            </div>

            <FormError message={error} />
            <FormSuccess message={success} />

            <button
              type="submit"
              disabled={isPending || !form.watch('email') || !form.watch('password')}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-[0.99] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {success ? "Redirecting..." : "Logging in..."}
                </span>
              ) : (
                "Login now"
              )}
            </button>

            <div className="text-center">
              <Link 
                href="/auth/register" 
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Don&apos;t have an account? {" "}
                <span className="text-blue-600 hover:text-blue-800 font-medium">
                  Register Instead
                </span>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default LoginForm;