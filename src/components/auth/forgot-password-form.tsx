"use client";

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
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { initiatePasswordReset } from "@/actions/initiatePasswordReset";
import { ForgotPasswordSchema } from "@/validaton-schema";
// import Image from "next/image";
import { FuturetekLogo } from "../FutureTekLogo";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ForgotPasswordSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      initiatePasswordReset(values)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }
          if (data?.success) {
            form.reset();
            setSuccess(data?.success);
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

        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-3">
           <Link href="/" prefetch={true}>
            <FuturetekLogo width={180} height={54} />
          </Link>
          <p className="text-sm text-gray-500 -mt-2">
            Empowering Your Digital Future
          </p>
        </div>

        {/* Header */}
        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Forgot Password
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Enter your email to receive password reset instructions
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="example@futuretek.com"
                      className="h-12 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#1B2B65] focus:border-[#1B2B65]"
                      type="email"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage className="text-sm text-red-500" />
                </FormItem>
              )}
            />

            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 bg-[#1B2B65] text-white rounded-lg font-medium hover:bg-[#152451] transition-all duration-300 transform hover:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                       xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       viewBox="0 0 24 24">
                    <circle className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                    <path className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 
                          0 5.373 0 12h4zm2 5.291A7.962 
                          7.962 0 014 12H0c0 3.042 1.135 
                          5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-gray-700 hover:text-[#1B2B65] transition-colors"
              >
                Remember your password?{" "}
                <span className="text-[#1B2B65] font-medium">
                  Login Instead
                </span>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
