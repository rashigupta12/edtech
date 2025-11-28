"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import React, { useState, useEffect } from "react";

export default function AddJyotishiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankAccountHolderName, setBankAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranchName, setBankBranchName] = useState("");
  const [cancelledChequeImage, setCancelledChequeImage] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [bio, setBio] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [jyotishiCode, setJyotishiCode] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  // Auto-generate code when name changes
  useEffect(() => {
    const generateCode = async () => {
      if (name.trim().length >= 2) {
        setGeneratingCode(true);
        try {
          const res = await fetch("/api/admin/jyotishi/generate-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() }),
          });

          if (res.ok) {
            const data = await res.json();
            setJyotishiCode(data.jyotishiCode);
          } else {
            console.error("Failed to generate code");
          }
        } catch (error) {
          console.error("Error generating code:", error);
        } finally {
          setGeneratingCode(false);
        }
      } else {
        setJyotishiCode("");
      }
    };

    const timeoutId = setTimeout(generateCode, 500);
    return () => clearTimeout(timeoutId);
  }, [name]);

  const validatePassword = (pwd: string) => {
    const validation = {
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      hasMinLength: pwd.length >= 8,
    };

    setPasswordValidation(validation);

    if (!pwd) {
      setPasswordError("");
      return "";
    }

    const allValid = Object.values(validation).every(Boolean);
    
    if (!allValid) {
      setPasswordError("Password does not meet all requirements");
      return "Password does not meet all requirements";
    }

    setPasswordError("");
    return "";
  };

  const validateMobile = (phone: string) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    if (!phone) {
      return "";
    }

    const indianPattern = /^(\+91|0)?[6-9]\d{9}$/;
    const digitsOnly = cleanPhone.replace(/^(\+91|0)/, "");

    if (digitsOnly.length !== 10) {
      return "Mobile number must be exactly 10 digits";
    }

    if (!indianPattern.test(cleanPhone)) {
      return "Please enter a valid 10 digit mobile number starting with 6-9";
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !commissionRate || !jyotishiCode) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Name, Email, Password, Commission Rate are required.',
      });
      return;
    }

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Password',
        text: 'Password must contain uppercase, lowercase, number, special character and be at least 8 characters long.',
      });
      return;
    }

    const mobileValidationError = validateMobile(mobile);
    if (mobileValidationError) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Mobile',
        text: mobileValidationError,
      });
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      mobile: mobile.trim() || null,
      jyotishiCode: jyotishiCode.trim().toUpperCase(),
      commissionRate: parseFloat(Number(commissionRate).toFixed(2)),
      bankAccountNumber: bankAccountNumber.trim() || null,
      bankIfscCode: bankIfscCode.trim().toUpperCase() || null,
      bankAccountHolderName: bankAccountHolderName.trim() || null,
      bankName: bankName.trim() || null,
      bankBranchName: bankBranchName.trim() || null,
      cancelledChequeImage: cancelledChequeImage || null,
      panNumber: panNumber.trim().toUpperCase() || null,
      bio: bio.trim() || null,
    };

    try {
      const res = await fetch("/api/admin/jyotishi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Astrologer account created successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        router.push("/dashboard/admin/agent");
      } else {
        const err = await res.json();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error || 'Failed to create Astrolger account',
        });
      }
    } catch (err) {
      console.error("Submission error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Unexpected Error',
        text: 'An unexpected error occurred while creating the account',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard/admin/agent"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to astrologers
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Add New Astrologer
              </h1>
              <p className="text-gray-600">
                Create a new astrologer account with commission and banking
                details.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    const capitalized =
                      value.charAt(0).toUpperCase() + value.slice(1);
                    setName(capitalized);
                  }}
                  placeholder="Pandit Rajesh Sharma"
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@example.com"
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password" className="text-sm text-gray-700">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => {
                    validatePassword(password);
                  }}
                  placeholder="••••••••"
                  required
                  className={`border-gray-300 focus:border-blue-500 ${
                    passwordError && password ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                
                {(showPasswordRequirements || password) && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    
                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasMinLength ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordValidation.hasMinLength ? "text-green-700" : "text-gray-600"}>
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasUpperCase ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordValidation.hasUpperCase ? "text-green-700" : "text-gray-600"}>
                        One uppercase letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasLowerCase ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordValidation.hasLowerCase ? "text-green-700" : "text-gray-600"}>
                        One lowercase letter (a-z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasNumber ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordValidation.hasNumber ? "text-green-700" : "text-gray-600"}>
                        One number (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasSpecialChar ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={passwordValidation.hasSpecialChar ? "text-green-700" : "text-gray-600"}>
                        One special character (!@#$%^&*...)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm text-gray-700">
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 10);
                    setMobile(value);
                    const error = validateMobile(value);
                    setMobileError(error);
                  }}
                  onBlur={(e) => {
                    const error = validateMobile(e.target.value);
                    setMobileError(error);
                  }}
                  placeholder="+91 98765 43210"
                  maxLength={15}
                  className={`border-gray-300 focus:border-blue-500 ${
                    mobileError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {mobileError && (
                  <p className="text-red-500 text-sm mt-1">{mobileError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jyotishiCode" className="text-sm text-gray-700">
                  Astrologer Code * (Auto-generated)
                </Label>
                <div className="relative">
                  <Input
                    id="jyotishiCode"
                    type="text"
                    value={jyotishiCode}
                    readOnly
                    placeholder="Enter name to generate code..."
                    className="border-gray-300 bg-gray-50 font-mono uppercase pr-20"
                  />
                  {generatingCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Code is automatically generated based on the name
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="commissionRate"
                  className="text-sm text-gray-700"
                >
                  Commission Rate (%) *
                </Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="15"
                  required
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="bio" className="text-sm text-gray-700">
                  Bio / Introduction
                </Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief introduction about the astrologer, expertise, and experience..."
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Banking & Tax Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="bankAccountNumber"
                  className="text-sm text-gray-700"
                >
                  Bank Account Number
                </Label>
                <Input
                  id="bankAccountNumber"
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="1234567890"
                  className="border-gray-300 focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankIfscCode" className="text-sm text-gray-700">
                  IFSC Code
                </Label>
                <Input
                  id="bankIfscCode"
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value)}
                  placeholder="SBIN0001234"
                  className="border-gray-300 focus:border-amber-500 font-mono uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="bankAccountHolderName"
                  className="text-sm text-gray-700"
                >
                  Account Holder Name
                </Label>
                <Input
                  id="bankAccountHolderName"
                  type="text"
                  value={bankAccountHolderName}
                  onChange={(e) => setBankAccountHolderName(e.target.value)}
                  placeholder="Rajesh Sharma"
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-sm text-gray-700">
                  Bank Name
                </Label>
                <Input
                  id="bankName"
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="State Bank of India"
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankBranchName" className="text-sm text-gray-700">
                  Bank Branch Name
                </Label>
                <Input
                  id="bankBranchName"
                  type="text"
                  value={bankBranchName}
                  onChange={(e) => setBankBranchName(e.target.value)}
                  placeholder="Connaught Place, New Delhi"
                  className="border-gray-300 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber" className="text-sm text-gray-700">
                  PAN Number
                </Label>
                <Input
                  id="panNumber"
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  placeholder="ABCDE1234F"
                  className="border-gray-300 focus:border-amber-500 font-mono uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <ImageUpload
                  label="Cancelled Cheque Image"
                  value={cancelledChequeImage}
                  onChange={setCancelledChequeImage}
                  isThumbnail={false}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Upload a clear image of a cancelled cheque for bank verification (max 5MB)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              disabled={loading || !jyotishiCode || generatingCode || !!passwordError}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {loading ? "Creating…" : "Create Astrologer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              asChild
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Link href="/dashboard/admin/agent">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}