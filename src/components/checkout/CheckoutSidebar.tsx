/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShoppingCart,
  X,
  Users,
  Crown,
  Building2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Course {
  id: string;
  title: string;
  priceINR: string;
  slug: string;
  isFree?: boolean; // Add this
}

interface CheckoutSidebarProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  appliedCoupons?: any[];
  hasAssignedCoupon?: boolean;
  finalPrice?: string;
  originalPrice?: string;
  discountAmount?: string;
  adminDiscountAmount?: string;
  jyotishiDiscountAmount?: string;
  priceAfterAdminDiscount?: string;
  commissionPercourse?: string;
}

export const CheckoutSidebar = ({
  course,
  isOpen,
  onClose,
  appliedCoupons = [],
  hasAssignedCoupon = false,
  finalPrice,
  originalPrice,
  discountAmount,
  adminDiscountAmount,
  jyotishiDiscountAmount,
  priceAfterAdminDiscount,
  commissionPercourse,
}: CheckoutSidebarProps) => {
  const { data: session } = useSession();

  const [step, setStep] = useState<"payment" | "processing" | "success">("payment");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  const courseOriginalPrice = parseFloat(originalPrice || course.priceINR);
  const courseFinalPrice = parseFloat(finalPrice || course.priceINR);
  // const courseDiscountAmount = parseFloat(discountAmount || "0");
  const courseAdminDiscountAmount = parseFloat(adminDiscountAmount || "0");
  const courseJyotishiDiscountAmount = parseFloat(
    jyotishiDiscountAmount || "0"
  );
  // const coursePriceAfterAdminDiscount = parseFloat(
  //   priceAfterAdminDiscount || courseOriginalPrice.toString()
  // );

  const adminCoupon = appliedCoupons.find((c) => c.creatorType === "ADMIN");
  const jyotishiCoupon = appliedCoupons.find(
    (c) => c.creatorType === "JYOTISHI"
  );

  const isFreeCourse = course.isFree || courseFinalPrice === 0;

  // Free enrollment handler
  const enrollForFree = async () => {
    if (!session?.user?.id) {
      setError("Please login to enroll");
      return;
    }

    setIsEnrolling(true);
    setStep("processing");
    setError("");

    try {
      // Create enrollment
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          courseId: course.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.error?.code === "ALREADY_ENROLLED") {
          setEnrollmentSuccess(true);
          setTimeout(() => {
            window.location.href = "/dashboard/user/courses";
          }, 1500);
          return;
        }
        
        throw new Error(errorData.error?.message || "Enrollment failed");
      }

      const data = await response.json();
      
      if (data.success) {
        setEnrollmentSuccess(true);
        setStep("success");
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = "/dashboard/user/courses";
        }, 2000);
      } else {
        throw new Error(data.message || "Enrollment failed");
      }
    } catch (err: any) {
      console.error("Enrollment error:", err);
      setError(err.message || "Failed to enroll. Please try again.");
      setStep("payment");
    } finally {
      setIsEnrolling(false);
    }
  };

  // Handle payment for paid courses (optional, for future)
  const handlePayment = async () => {
    if (isFreeCourse) {
      await enrollForFree();
      return;
    }
    
    // Add Razorpay payment logic here for future
    setError("Payment integration coming soon");
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white shadow-lg z-50 overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Checkout</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing || isEnrolling}
            className="p-1.5 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Course Info */}
          <div className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-lg p-3 border border-blue-200">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
              {course.title}
            </h3>
            {isFreeCourse ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-green-600">
                  FREE
                </span>
                <Badge className="bg-green-500 text-white text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  No Payment Required
                </Badge>
              </div>
            ) : hasAssignedCoupon ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-blue-600">
                    ₹{courseFinalPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    ₹{courseOriginalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xl font-bold text-blue-600">
                ₹{courseOriginalPrice.toLocaleString("en-IN")}
              </p>
            )}
          </div>

          {/* Applied Coupons - only show for paid courses */}
          {!isFreeCourse && hasAssignedCoupon && appliedCoupons.length > 0 && (
            <div className="space-y-2">
              {adminCoupon && (
                <div className="rounded-lg p-3 border bg-green-50 border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
                    <div>
                      <p className="font-semibold text-sm mb-0.5 text-green-800">
                        Discount Applied!
                      </p>
                      <p className="text-xs mt-0.5 text-green-600">
                        You save ₹
                        {courseAdminDiscountAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {jyotishiCoupon && (
                <div className="rounded-lg p-3 border bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-sm mb-0.5 text-blue-800">
                        Discount Applied!
                      </p>
                      <p className="text-xs mt-0.5 text-blue-600">
                        You save ₹
                        {courseJyotishiDiscountAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Summary - simplified for free courses */}
          <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
            <h3 className="font-semibold text-sm mb-2">Order Summary</h3>

            <div className="space-y-2">
              {isFreeCourse ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Course Price</span>
                    <span className="font-semibold text-sm">FREE</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base">Total Amount</span>
                      <span className="font-bold text-xl text-green-600">
                        FREE
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Course Price</span>
                    <span className="font-semibold text-sm">
                      ₹{courseOriginalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {courseAdminDiscountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Discount Applied
                      </span>
                      <span className="font-semibold text-green-600 text-sm">
                        -₹{courseAdminDiscountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {courseJyotishiDiscountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-medium text-sm flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Discount Applied
                      </span>
                      <span className="font-semibold text-blue-600 text-sm">
                        -₹{courseJyotishiDiscountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Subtotal</span>
                      <span className="font-semibold text-sm">
                        ₹{courseFinalPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">GST (18%)</span>
                    <span className="font-semibold text-sm">
                      ₹{(courseFinalPrice * 0.18).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="border-t-2 border-blue-200 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base">Total Amount</span>
                      <span className="font-bold text-xl text-blue-600">
                        ₹{(courseFinalPrice * 1.18).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-1.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-base">
                  {isFreeCourse ? "Enrolling you in the course..." : "Processing your payment..."}
                </p>
                <p className="text-xs text-gray-500">
                  Please don&apos;t close this window
                </p>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
                <CheckCircle2 className="h-12 w-12 text-green-600 relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg text-green-700">
                  Enrollment Successful! 🎉
                </p>
                <p className="text-sm text-gray-600">
                  Redirecting to your dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Payment/Enroll Step */}
          {step === "payment" && (
            <>
              <div className="space-y-2">
                <button
                  onClick={handlePayment}
                  disabled={isEnrolling || isProcessing}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-900 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg text-sm"
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isFreeCourse ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Enroll for Free
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Pay ₹{(courseFinalPrice * 1.18).toLocaleString("en-IN")}
                    </>
                  )}
                </button>
              </div>

              {isFreeCourse && (
                <div className="text-xs text-center text-gray-500 space-y-0.5">
                  <p className="flex items-center justify-center gap-1">
                    <span className="text-green-500">🎓</span>
                    Start learning immediately after enrollment
                  </p>
                  <p className="text-xs">Lifetime access • Certificate included</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Badge component for free course indicator
const Badge = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);