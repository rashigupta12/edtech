/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Role } from "@/validaton-schema";
import { registerUser } from "@/actions/registerUser";
import MainButton from "@/components/common/MainButton";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";

// Simplified validation schema
const RegisterFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobile: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
  role: z.enum(["USER", "ADMIN", "JYOTISHI"]).optional(),
});

type RegisterFormProps = {
  text: string;
  role: Role;
};

const RegisterForm = ({ text, role }: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof RegisterFormSchema>>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      role: "USER",
    },
    mode: "onChange",
  });

  // Check password requirements for visual feedback
  const checkPasswordRequirements = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const passwordRequirements = checkPasswordRequirements(
    form.watch("password") || ""
  );

  // Check if all password requirements are met
  const isPasswordValid = (password: string) => {
    const requirements = checkPasswordRequirements(password);
    return Object.values(requirements).every(Boolean);
  };

  const onSubmit = async (data: z.infer<typeof RegisterFormSchema>) => {
    if (role) {
      data.role = role;
    }

    setError(undefined);
    setSuccess(undefined);

    // Simple password validation check
    if (!isPasswordValid(data.password)) {
      setError("Password does not meet all requirements");
      return;
    }

    startTransition(() => {
      registerUser(data)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
            toast({
              title: "Registration failed",
              description: data.error,
              variant: "destructive",
            });
          }
          if (data?.success) {
            form.reset();
            setSuccess(data.success);
            toast({
              title: "🎉 Registration successful!",
              description: data.success,
            });
            // Optional: Redirect to login page after successful registration
            setTimeout(() => {
              router.push("/auth/login");
            }, 2000);
          }
        })
        .catch((error) => {
          console.error("Registration error:", error);
          setError("Something went wrong! Please try again.");
        });
    });
  };

  // Check if form is valid and ready for submission
  const isFormValid =
    form.watch("name")?.length >= 2 &&
    form.watch("email")?.includes("@") &&
    form.watch("mobile")?.length >= 10 &&
    form.watch("password")?.length >= 8 &&
    isPasswordValid(form.watch("password") || "");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border border-slate-200 shadow-lg">
        <CardHeader>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-800">Hello!</h2>
            <p className="mt-2 text-sm text-slate-600">{text}</p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Full Name
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <Input
                          {...field}
                          className={`h-12 pl-10 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            form.formState.errors.name
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300"
                          }`}
                          placeholder="John Doe"
                          disabled={isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500 flex items-center gap-1">
                      {form.formState.errors.name && (
                        <>
                          <span>⚠️</span>
                          {form.formState.errors.name.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Email Address
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                        <Input
                          {...field}
                          className={`h-12 pl-10 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            form.formState.errors.email
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300"
                          }`}
                          placeholder="john@example.com"
                          type="email"
                          disabled={isPending}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500 flex items-center gap-1">
                      {form.formState.errors.email && (
                        <>
                          <span>⚠️</span>
                          {form.formState.errors.email.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Phone Field */}
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Phone Number
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                        <Input
                          {...field}
                          maxLength={15}
                          onChange={(e) => {
                            const onlyNums = e.target.value.replace(/\D/g, "");
                            field.onChange(onlyNums);
                          }}
                          value={field.value}
                          placeholder="      1234567890"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500 flex items-center gap-1">
                      {form.formState.errors.mobile && (
                        <>
                          <span>⚠️</span>
                          {form.formState.errors.mobile.message}
                        </>
                      )}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Password
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                        <Input
                          {...field}
                          className={`h-12 pl-10 pr-10 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            form.formState.errors.password
                              ? "border-red-500 bg-red-50"
                              : "border-slate-300"
                          }`}
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          disabled={isPending}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                          disabled={isPending}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500 flex items-center gap-1">
                      {form.formState.errors.password && (
                        <>
                          <span>⚠️</span>
                          {form.formState.errors.password.message}
                        </>
                      )}
                    </FormMessage>

                    {/* Password Requirements Checklist */}
                    {form.watch("password") && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-medium text-slate-700 mb-2">
                          Password Requirements:
                        </p>
                        <div className="space-y-1">
                          <PasswordRequirement
                            met={passwordRequirements.length}
                            text="At least 8 characters"
                          />
                          <PasswordRequirement
                            met={passwordRequirements.uppercase}
                            text="One uppercase letter"
                          />
                          <PasswordRequirement
                            met={passwordRequirements.lowercase}
                            text="One lowercase letter"
                          />
                          <PasswordRequirement
                            met={passwordRequirements.number}
                            text="One number"
                          />
                          <PasswordRequirement
                            met={passwordRequirements.specialChar}
                            text="One special character (!@#$...)"
                          />
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormError message={error} />
              <FormSuccess message={success} />

              <MainButton
                text={isPending ? "Creating Account..." : "Register"}
                classes={`h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isFormValid && !isPending
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                width="full_width"
                isSubmitable
                isLoading={isPending}
                disabled={isPending || !isFormValid}
              />

              <div className="text-center mt-4">
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  Already have an account? Login Instead
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

// Password requirement indicator component
const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-xs">
    {met ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-slate-400" />
    )}
    <span className={met ? "text-green-700" : "text-slate-600"}>{text}</span>
  </div>
);

export default RegisterForm;
