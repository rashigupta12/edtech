/*eslint-disable @typescript-eslint/no-explicit-any */
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
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Razorpay type declarations
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  notes?: Record<string, string>;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: any) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface Course {
  id: string;
  title: string;
  priceINR: string;
  slug: string;
}

interface AppliedCoupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  discountAmount?: number;
  creatorType?: "ADMIN" | "JYOTISHI";
  creatorName?: string;
}

interface GSTData {
  legalName?: string;
  tradeName?: string;
  address?: string;
  status?: string;
  gstin?: string;
  [key: string]: any;
}

interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

interface CheckoutSidebarProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  appliedCoupons?: AppliedCoupon[];
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

  const [step, setStep] = useState<"payment" | "processing">("payment");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [isGstValid, setIsGstValid] = useState(false);
  const [isVerifyingGst, setIsVerifyingGst] = useState(false);
  const [gstData, setGstData] = useState<GSTData | null>(null);
  const [gstError, setGstError] = useState("");
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // Manual address state
  const [manualAddress, setManualAddress] = useState<Address>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
  });

// Load user's saved GST and address data
useEffect(() => {
  const loadUserData = async () => {
    if (!session?.user?.id) {
      setIsLoadingUserData(false);
      return;
    }

    try {
      const response = await fetch("/api/payment/billing-info");
      if (response.ok) {
        const data = await response.json();

        if (data.gstNumber) {
          setGstNumber(data.gstNumber);
          if (data.isGstVerified && data.gstData) {
            setGstData(data.gstData);
            setIsGstValid(true);
          }
        }

        // Load saved address
        if (data.address) {
          setManualAddress(data.address);
          // If user has a saved address, show manual address section
          if (!data.gstData?.address) {
            setUseManualAddress(true);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  loadUserData();
}, [session]);

  const courseOriginalPrice = parseFloat(originalPrice || course.priceINR);
  const courseFinalPrice = parseFloat(finalPrice || course.priceINR);
  const courseDiscountAmount = parseFloat(discountAmount || "0");
  const courseAdminDiscountAmount = parseFloat(adminDiscountAmount || "0");
  const courseJyotishiDiscountAmount = parseFloat(
    jyotishiDiscountAmount || "0"
  );
  const coursePriceAfterAdminDiscount = parseFloat(
    priceAfterAdminDiscount || courseOriginalPrice.toString()
  );

  const adminCoupon = appliedCoupons.find((c) => c.creatorType === "ADMIN");
  const jyotishiCoupon = appliedCoupons.find(
    (c) => c.creatorType === "JYOTISHI"
  );

  const validateGST = (gst: string) => {
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const verifyGSTNumber = async (gstNum: string) => {
    if (!validateGST(gstNum)) {
      setGstError("Invalid GST format");
      setGstData(null);
      return;
    }

    setIsVerifyingGst(true);
    setGstError("");
    setGstData(null);

    try {
      const response = await fetch(`/api/gst/${gstNum.trim().toUpperCase()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "GST verification failed");
      }

      const apiResponse = await response.json();

      if (!apiResponse.flag || apiResponse.message === "error") {
        throw new Error(apiResponse.message || "GST verification failed");
      }

      const gstInfo = apiResponse.data;

      if (!gstInfo) {
        throw new Error("Invalid GST data received from API");
      }

      // Build address from GST data
      let address = "";
      if (gstInfo.pradr?.addr?.bno || gstInfo.pradr?.adr) {
        if (gstInfo.pradr.adr) {
          address = gstInfo.pradr.adr;
        } else if (gstInfo.pradr.addr) {
          const addrComponents = gstInfo.pradr.addr;
          const parts = [
            addrComponents.flno,
            addrComponents.bno && addrComponents.bno !== "0"
              ? addrComponents.bno
              : null,
            addrComponents.bnm,
            addrComponents.st,
            addrComponents.loc,
            addrComponents.dst,
            addrComponents.stcd,
            addrComponents.pncd,
          ].filter(Boolean);
          address = parts.join(", ");
        }
      }

      const gstDetails: GSTData = {
        gstin: gstInfo.gstin || gstNum,
        legalName: gstInfo.lgnm,
        tradeName: gstInfo.tradeNam,
        address: address || undefined,
        status: gstInfo.sts,
      };

      if (!gstDetails.legalName && !gstDetails.tradeName) {
        throw new Error("Incomplete GST data received");
      }

      setGstData(gstDetails);
      setIsGstValid(true);
      setGstError("");

      // Auto-fill address from GST if available
      if (address) {
        setManualAddress({
          addressLine1: address,
          addressLine2: "",
          city: gstInfo.pradr?.addr?.dst || "",
          state: gstInfo.pradr?.addr?.stcd || "",
          pinCode: gstInfo.pradr?.addr?.pncd || "",
          country: "India",
        });
        setUseManualAddress(false);
      }
    } catch (err: any) {
      console.error("GST verification error:", err);
      setGstError(err.message || "Failed to verify GST number");
      setGstData(null);
      setIsGstValid(false);
    } finally {
      setIsVerifyingGst(false);
    }
  };

  const handleGstChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setGstNumber(upperValue);
    setIsGstValid(validateGST(upperValue));
    setGstError("");

    if (gstData && upperValue !== gstData.gstin) {
      setGstData(null);
    }
  };

  const handleVerifyGst = () => {
    if (gstNumber && validateGST(gstNumber)) {
      verifyGSTNumber(gstNumber);
    }
  };

  const subtotal = courseFinalPrice;
  const gst = subtotal * 0.18;
  const total = subtotal + gst;
  const courseCommissionRate = parseFloat(commissionPercourse || "0");

  let commission = 0;
  if (courseJyotishiDiscountAmount > 0 && courseCommissionRate > 0) {
    commission = coursePriceAfterAdminDiscount * (courseCommissionRate / 100);
  }

  const prices = {
    originalPrice: courseOriginalPrice,
    discount: courseDiscountAmount,
    subtotal,
    gst,
    total,
    commission,
    commissionRate: courseCommissionRate,
    adminDiscountAmount: courseAdminDiscountAmount,
    jyotishiDiscountAmount: courseJyotishiDiscountAmount,
    priceAfterAdminDiscount: coursePriceAfterAdminDiscount,
  };

  const initializeRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
// Add this function in your CheckoutSidebar component
const saveBillingInfo = async () => {
  try {
    const billingData = {
      gstNumber: gstData?.gstin || gstNumber || null,
      gstData: gstData || null,
      address: gstData?.address ? null : manualAddress // Only save manual address if GST address not available
    };

    const response = await fetch("/api/payment/billing-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(billingData),
    });

    if (!response.ok) {
      console.error("Failed to save billing info");
    } else {
      console.log("Billing info saved successfully");
    }
  } catch (err) {
    console.error("Error saving billing info:", err);
  }
};
const handlePaymentVerification = async (
  response: RazorpayResponse,
  orderData: any
) => {
  try {
    const verifyResponse = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        paymentId: orderData.paymentId,
        courseId: course.id,
      }),
    });

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();

      if (
        errorData.error?.includes("signature") ||
        errorData.error?.includes("verification")
      ) {
        const recoveryResponse = await fetch("/api/payment/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: orderData.paymentId }),
        });

        if (recoveryResponse.ok) {
          const recoveryData = await recoveryResponse.json();
          if (recoveryData.success) {
            window.location.href = `/dashboard/user/courses`;
            return;
          }
        }
      }

      throw new Error(errorData.error || "Payment verification failed");
    }

    const verifyData = await verifyResponse.json();

    if (verifyData.success || verifyData.message) {
      // ✅ Save billing info after successful payment
      await saveBillingInfo();
      window.location.href = `/dashboard/user/courses`;
    } else {
      throw new Error("Payment verification failed");
    }
  } catch (err: any) {
    console.error("Payment verification error:", err);
    setError(
      err.message || "Payment verification failed. Please contact support."
    );
    setStep("payment");
    setIsProcessing(false);
  }
};

  const validateAddress = () => {
    // CASE 1: GST is entered → must be verified
    if (gstNumber && !isGstValid) {
      setError("Please enter a valid GST number or remove it");
      return false;
    }

    if (gstNumber && !gstData) {
      setError("Please verify your GST number before proceeding");
      return false;
    }

    // CASE 2: No GST provided → manual address MUST be filled
    if (!gstNumber || !gstData) {
      if (!useManualAddress) {
        setError("Please provide a billing address (via GST or manual entry)");
        return false;
      }

      // Validate manual address fields
      if (
        !manualAddress.addressLine1.trim() ||
        !manualAddress.city.trim() ||
        !manualAddress.state.trim() ||
        !manualAddress.pinCode.trim() ||
        manualAddress.pinCode.length !== 6 ||
        !/^\d{6}$/.test(manualAddress.pinCode)
      ) {
        setError(
          "Please fill all required address fields correctly (PIN must be 6 digits)"
        );
        return false;
      }
    }

    return true;
  };

  const handlePayment = async () => {
    if (!session) {
      setError("Please login to proceed with payment");
      return;
    }

    if (gstNumber && !gstData) {
      setError("Please verify your GST number before proceeding");
      return;
    }

    if (!validateAddress()) {
      return;
    }

    setIsProcessing(true);
    setStep("processing");
    setError("");

    try {
      const res = await initializeRazorpay();
      if (!res) throw new Error("Failed to load payment gateway");

      const couponCodes =
        appliedCoupons.length > 0
          ? appliedCoupons.map((c) => c.code).join(",")
          : null;

      // Prepare billing address
      const billingAddress =
        gstData?.address || (useManualAddress ? manualAddress : null);

      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          couponCode: couponCodes,
          paymentType: "DOMESTIC",
          billingAddress,
          gstNumber: gstData?.gstin || gstNumber || null,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData = await orderResponse.json();

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: Math.round(orderData.amount * 100),
        currency: "INR",
        name: "Futuretek",
        description: course.title,
        order_id: orderData.orderId,
        handler: (response: RazorpayResponse) => {
          handlePaymentVerification(response, orderData);
        },
        prefill: {
          name: session.user?.name || "",
          email: session.user?.email || "",
          contact: "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setStep("payment");
          },
        },
        notes: {
          courseId: course.id,
          courseName: course.title,
          invoiceNumber: orderData.invoiceNumber,
          gst_number: gstData?.gstin || gstNumber || "",
          gst_legal_name: gstData?.legalName || "",
          user_id: session.user?.id || "",
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", function (response: any) {
        setError(
          `Payment failed: ${response.error.description || "Please try again"}`
        );
        setStep("payment");
        setIsProcessing(false);
      });

      paymentObject.open();
    } catch (err: any) {
      console.error("Payment initialization error:", err);
      setError(err.message || "Payment failed. Please try again.");
      setStep("payment");
      setIsProcessing(false);
    }
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
            disabled={isProcessing}
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
            {hasAssignedCoupon ? (
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

          {/* GST Input with Verification */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              GST Number (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => handleGstChange(e.target.value)}
                placeholder="37AADCD4946L2Z8"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isProcessing || isVerifyingGst || isLoadingUserData}
                maxLength={15}
              />
              <button
                onClick={handleVerifyGst}
                disabled={
                  !isGstValid ||
                  isVerifyingGst ||
                  isProcessing ||
                  !!gstData ||
                  isLoadingUserData
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                {isVerifyingGst ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying
                  </>
                ) : gstData ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Verified
                  </>
                ) : (
                  "Verify"
                )}
              </button>
            </div>

            {gstNumber && !isGstValid && !isVerifyingGst && (
              <p className="text-xs text-red-600">
                Please enter a valid GST number format
              </p>
            )}

            {gstError && (
              <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>{gstError}</span>
              </div>
            )}

            {/* GST Details Display */}
            {gstData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  GST Verified Successfully
                </div>

                {gstData.legalName && (
                  <div className="flex items-start gap-2 text-xs">
                    <Building2 className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600">Legal Name</p>
                      <p className="font-medium text-gray-800">
                        {gstData.legalName}
                      </p>
                    </div>
                  </div>
                )}

                {gstData.address && (
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600">Address</p>
                      <p className="font-medium text-gray-800">
                        {gstData.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manual Address Option */}
          {!gstData && (
            <div className="space-y-3">
              <button
                onClick={() => setUseManualAddress(!useManualAddress)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {useManualAddress
                  ? "- Hide Address Form"
                  : "+ Add Billing Address Manually"}
              </button>

              {useManualAddress && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    placeholder="Address Line 1 *"
                    value={manualAddress.addressLine1}
                    onChange={(e) =>
                      setManualAddress({
                        ...manualAddress,
                        addressLine1: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    disabled={isProcessing}
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={manualAddress.addressLine2}
                    onChange={(e) =>
                      setManualAddress({
                        ...manualAddress,
                        addressLine2: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    disabled={isProcessing}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City *"
                      value={manualAddress.city}
                      onChange={(e) =>
                        setManualAddress({
                          ...manualAddress,
                          city: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={isProcessing}
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={manualAddress.state}
                      onChange={(e) =>
                        setManualAddress({
                          ...manualAddress,
                          state: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="PIN Code *"
                      value={manualAddress.pinCode}
                      onChange={(e) =>
                        setManualAddress({
                          ...manualAddress,
                          pinCode: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={isProcessing}
                      maxLength={6}
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={manualAddress.country}
                      onChange={(e) =>
                        setManualAddress({
                          ...manualAddress,
                          country: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Applied Coupons */}
          {hasAssignedCoupon && appliedCoupons.length > 0 && (
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

          {/* Order Summary */}
          <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
            <h3 className="font-semibold text-sm mb-2">Order Summary</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Course Price</span>
                <span className="font-semibold text-sm">
                  ₹{prices.originalPrice.toLocaleString("en-IN")}
                </span>
              </div>

              {prices.adminDiscountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-medium text-sm flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Discount Applied
                  </span>
                  <span className="font-semibold text-green-600 text-sm">
                    -₹{prices.adminDiscountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {prices.jyotishiDiscountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium text-sm flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Discount Applied
                  </span>
                  <span className="font-semibold text-blue-600 text-sm">
                    -₹{prices.jyotishiDiscountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Subtotal</span>
                  <span className="font-semibold text-sm">
                    ₹{prices.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">GST (18%)</span>
                <span className="font-semibold text-sm">
                  ₹{prices.gst.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="border-t-2 border-blue-200 pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-base">Total Amount</span>
                  <span className="font-bold text-xl text-blue-600">
                    ₹{prices.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-1.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {step === "payment" && (
            <>
              <div className="space-y-2">
                <button
                  onClick={handlePayment}
                  disabled={
                    isProcessing ||
                    isLoadingUserData ||
                    // Address not provided: no GST verified AND no manual address filled
                    (!gstData &&
                      (!useManualAddress ||
                        !manualAddress.addressLine1 ||
                        !manualAddress.city ||
                        !manualAddress.state ||
                        manualAddress.pinCode.length !== 6))
                  }
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-900 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Pay ₹{prices.total.toLocaleString("en-IN")}
                    </>
                  )}
                </button>

                {gstNumber && !gstData && (
                  <p className="text-xs text-amber-600 text-center">
                    Please verify your GST number before proceeding
                  </p>
                )}
                {!gstData && !useManualAddress && (
                  <p className="text-xs text-amber-600 mt-2">
                    Billing address is required. Please verify GST or add
                    address manually.
                  </p>
                )}
              </div>

              <div className="text-xs text-center text-gray-500 space-y-0.5">
                <p className="flex items-center justify-center gap-1">
                  <span className="text-green-500">🔒</span>
                  Secure payment powered by Razorpay
                </p>
                <p className="text-xs">100% Money-back guarantee</p>
              </div>
            </>
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
                  Processing your payment...
                </p>
                <p className="text-xs text-gray-500">
                  Please don&apos;t close this window
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
