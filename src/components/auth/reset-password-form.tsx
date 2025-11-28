"use client";

import { resetPassword } from "@/actions/resetPassword";
import { FormError } from "@/components/form/form-error";
import { FormSuccess } from "@/components/form/form-success";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ResetPasswordSchema } from "@/validaton-schema";
import { FuturetekLogo } from "../FutureTekLogo";

export function ResetPasswordForm() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResetPasswordSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      resetPassword(values, token)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
          }
          if (data?.success) {
            setSuccess(data.success);
          }
        })
        .catch(() => {
          setError("Something went wrong!");
        });
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">

        <div className="flex flex-col items-center space-y-3">
          <Link href="/" prefetch={true}>
            <FuturetekLogo width={180} height={54} />
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a strong new password
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* New Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>

                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Enter a strong password"
                        className="h-12 w-full rounded-lg border-gray-300 focus:ring-2 
                        focus:ring-[#1B2B65] focus:border-[#1B2B65] pr-12"
                        type={showPassword ? "text" : "password"}
                        disabled={isPending}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </FormControl>

                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>

                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Re-enter password"
                        className="h-12 w-full rounded-lg border-gray-300 focus:ring-2 
                        focus:ring-[#1B2B65] focus:border-[#1B2B65] pr-12"
                        type={showConfirmPassword ? "text" : "password"}
                        disabled={isPending}
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </FormControl>

                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 bg-[#1B2B65] text-white rounded-lg font-medium hover:bg-[#152451] 
              transition-all duration-300 transform hover:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-gray-700 hover:text-[#1B2B65]"
              >
                Back to{" "}
                <span className="font-semibold text-[#1B2B65]">Login</span>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
