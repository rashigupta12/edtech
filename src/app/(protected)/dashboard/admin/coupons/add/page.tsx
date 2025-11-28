// app/dashboard/admin/coupons/add/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Tag } from "lucide-react";
import Swal from "sweetalert2";

interface CouponType {
  id: string;
  typeName: string;
  typeCode: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  maxDiscountLimit?: string;
  isActive: boolean;
}

interface Course {
  id: string;
  title: string;
  price: string;
}

export default function AddCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [couponTypes, setCouponTypes] = useState<CouponType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [dateErrors, setDateErrors] = useState({
    validFrom: "",
    validUntil: "",
  });

  const [formData, setFormData] = useState({
    couponTypeId: "",
    discountValue: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    maxUsageCount: "",
    validFrom: "",
    validUntil: "",
    description: "",
    couponScope: "GENERAL" as "GENERAL" | "PERSONAL",
  });

  const validateDates = () => {
    const errors = {
      validFrom: "",
      validUntil: "",
    };

    if (formData.validFrom && formData.validUntil) {
      if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
        errors.validFrom = "Valid From date must be before Valid Until date";
      }
    }

    setDateErrors(errors);
    return Object.values(errors).every((error) => !error);
  };
  useEffect(() => {
    validateDates();
  }, [formData.validFrom, formData.validUntil]);
  // Fetch coupon types and courses on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [couponTypesRes, coursesRes] = await Promise.all([
          fetch("/api/admin/coupon-types"),
          fetch("/api/courses"),
        ]);

        if (couponTypesRes.ok) {
          const couponTypesData = await couponTypesRes.json();
          setCouponTypes(couponTypesData.couponTypes || []);
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Update discount type when coupon type changes
  useEffect(() => {
    if (formData.couponTypeId) {
      const selectedType = couponTypes.find(
        (type) => type.id === formData.couponTypeId
      );
      if (selectedType) {
        setFormData((prev) => ({
          ...prev,
          discountType: selectedType.discountType,
        }));
      }
    }
  }, [formData.couponTypeId, couponTypes]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Special validation for discountValue
    if (name === "discountValue" && value !== "") {
      const selectedType = couponTypes.find(
        (type) => type.id === formData.couponTypeId
      );

      if (selectedType?.maxDiscountLimit) {
        const maxValue = Number(selectedType.maxDiscountLimit);
        const inputValue = Number(value);

        // If value exceeds max, don't update the state
        if (inputValue > maxValue) {
          return;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check discount limit validation
    const selectedType = couponTypes.find(
      (type) => type.id === formData.couponTypeId
    );

    if (
      selectedType?.maxDiscountLimit &&
      Number(formData.discountValue) > Number(selectedType.maxDiscountLimit)
    ) {
      Swal.fire({
        icon: "error",
        title: "Discount Limit Exceeded",
        text: `Discount value cannot exceed ${selectedType.maxDiscountLimit}`,
      });
      return;
    }
    if (!validateDates()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Valid From date must be before Valid Until date",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        maxUsageCount: formData.maxUsageCount
          ? parseInt(formData.maxUsageCount)
          : undefined,
        courseIds:
          formData.couponScope === "GENERAL" ? selectedCourses : undefined,
      };

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Coupon created successfully!",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/coupons");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Failed to create coupon",
        });
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      Swal.fire({
        icon: "error",
        title: "Unexpected Error",
        text: "Failed to create coupon",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const selectedCouponType = couponTypes.find(
    (type) => type.id === formData.couponTypeId
  );

  const isDiscountExceeded =
    selectedCouponType?.maxDiscountLimit &&
    Number(formData.discountValue) >
      Number(selectedCouponType.maxDiscountLimit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Coupon
            </h1>
            <p className="text-gray-600">
              Create general purpose or personal coupons
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coupon Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coupon Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Type
              </label>
              <select
                name="couponTypeId"
                value={formData.couponTypeId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Coupon Type</option>
                {couponTypes
                  .filter((type) => type.isActive)
                  .map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.typeName} ({type.typeCode})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Discount Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type
              </label>
              <input
                type="text"
                value={formData.discountType}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Value
                {selectedCouponType?.maxDiscountLimit && (
                  <span className="text-gray-500 text-sm ml-1">
                    (Max: {selectedCouponType.maxDiscountLimit})
                  </span>
                )}
              </label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                step={formData.discountType === "PERCENTAGE" ? "1" : "0.01"}
                min="0"
                max={selectedCouponType?.maxDiscountLimit}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDiscountExceeded
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder={
                  formData.discountType === "PERCENTAGE" ? "10" : "50.00"
                }
                required
              />
              {isDiscountExceeded && (
                <p className="text-red-600 text-sm mt-1">
                  Maximum discount value is{" "}
                  {selectedCouponType.maxDiscountLimit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Usage Count
              </label>
              <input
                type="number"
                name="maxUsageCount"
                value={formData.maxUsageCount}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid From
              </label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  dateErrors.validFrom ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {dateErrors.validFrom && (
                <p className="text-red-600 text-sm mt-1">
                  {dateErrors.validFrom}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Course Restrictions (Only for GENERAL coupons) */}
          {formData.couponScope === "GENERAL" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Course Restrictions (Optional)
                <span className="text-gray-500 text-sm font-normal ml-1">
                  - Select specific courses this coupon applies to. Leave empty
                  for all courses.
                </span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                {courses.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No courses available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => toggleCourseSelection(course.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium">{course.title}</span>
                          <span className="text-gray-600 text-sm ml-2">
                            (₹{course.price})
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedCourses.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  Coupon will be restricted to {selectedCourses.length} selected
                  course(s)
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter coupon description (optional)"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!isDiscountExceeded}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {loading ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Coupon Preview</h3>
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <code className="text-lg font-mono font-bold text-blue-600">
              {formData.couponTypeId && formData.discountValue
                ? `ADM${
                    couponTypes.find((t) => t.id === formData.couponTypeId)
                      ?.typeCode
                  }${formData.discountValue.replace(".", "")}XXXX`
                : "COUPON_CODE"}
            </code>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Type:</strong>{" "}
              {couponTypes.find((t) => t.id === formData.couponTypeId)
                ?.typeName || "N/A"}
            </p>
            <p>
              <strong>Discount:</strong> {formData.discountValue || "0"}{" "}
              {formData.discountType === "PERCENTAGE" ? "%" : "₹"}
            </p>
            <p>
              <strong>Scope:</strong> {formData.couponScope}
            </p>
            {formData.couponScope === "GENERAL" &&
              selectedCourses.length > 0 && (
                <p>
                  <strong>Restricted to:</strong> {selectedCourses.length}{" "}
                  course(s)
                </p>
              )}
            <p>
              <strong>Description:</strong> {formData.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
