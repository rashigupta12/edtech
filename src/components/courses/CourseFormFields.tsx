"use client";

import { DateInput, Field, StatusSelect, TextInput } from "@/components/courses/course-form";
import { ImageUpload } from "@/components/ImageUpload";
import { JyotishiSearch } from "@/components/JyotishiSearch";
import { useEffect } from "react";

interface CourseFormFieldsProps {
  formData: {
    title: string;
    slug: string;
    tagline: string;
    instructor: string;
    durationMinutes: string;
    totalSessions: string;
    priceINR: string;
    priceUSD: string;
    status: string;
    thumbnailUrl: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    commissionPercourse: string;
    assignedJyotishiId?: string | null;
    assignedJyotishiName?: string | null;
  };
  onFieldChange: (field: string, value: string) => void;
  onJyotishiChange: (id: string | null, name: string | null) => void;
  dateErrors: {
    registrationDeadline: string;
    startDate: string;
    endDate: string;
  };
  isUSDManual: boolean;
  onUSDManualToggle: () => void;
  formatDuration: () => string;
}

const USD_TO_INR_RATE = 83.5;

export function CourseFormFields({
  formData,
  onFieldChange,
  onJyotishiChange,
  dateErrors,
  isUSDManual,
  onUSDManualToggle,
  formatDuration
}: CourseFormFieldsProps) {
  
  useEffect(() => {
    if (formData.title) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      onFieldChange("slug", generatedSlug);
    }
  }, [formData.title, onFieldChange]);

  useEffect(() => {
    if (!isUSDManual && formData.priceINR) {
      const inrValue = parseFloat(formData.priceINR);
      if (!isNaN(inrValue)) {
        const calculatedUSD = (inrValue / USD_TO_INR_RATE).toFixed(2);
        onFieldChange("priceUSD", calculatedUSD);
      }
    }
  }, [formData.priceINR, isUSDManual, onFieldChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Field label="Title *">
        <TextInput
          value={formData.title}
          onChange={(value) => {
            const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
            onFieldChange("title", capitalized);
          }}
          placeholder="KP Astrology"
          required
        />
      </Field>

      <Field label="Slug (Auto-generated)">
        <div className="relative">
          <input
            type="text"
            value={formData.slug}
            disabled
            className="w-full px-4 py-2.5 bg-gray-100 text-gray-500 border border-gray-300 rounded-lg cursor-not-allowed font-mono text-sm"
          />
        </div>
      </Field>

      <Field label="Tagline *">
        <TextInput
          value={formData.tagline}
          onChange={(value) => {
            const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
            onFieldChange("tagline", capitalized);
          }}
          placeholder="Learn KP in its original form..."
          required
        />
      </Field>

      <Field label="Instructor *">
        <JyotishiSearch
          value={formData.assignedJyotishiId || null}
          onChange={onJyotishiChange}
          selectedName={formData.assignedJyotishiName || null}
        />
        <p className="mt-2 text-sm text-gray-500">
          Search and assign a Astrologer as the course instructor
        </p>
      </Field>

      <Field label="Duration (Minutes)">
        <div className="space-y-2">
          <TextInput
            type="number"
            value={formData.durationMinutes}
            onChange={(value) => onFieldChange("durationMinutes", value)}
            placeholder="1500"
          />
          {formData.durationMinutes && (
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded">
              📅 {formatDuration()}
            </div>
          )}
        </div>
      </Field>

      <Field label="Total Sessions">
        <TextInput
          type="number"
          value={formData.totalSessions}
          onChange={(value) => onFieldChange("totalSessions", value)}
          placeholder="25"
        />
      </Field>

      <Field label="Price (INR) *">
        <TextInput
          type="number"
          value={formData.priceINR}
          onChange={(value) => onFieldChange("priceINR", value)}
          placeholder="20000"
          required
        />
      </Field>

      <Field label="Price (USD) *">
        <div className="space-y-2">
          <div className="relative">
            <TextInput
              type="number"
              value={formData.priceUSD}
              onChange={(value) => {
                onFieldChange("priceUSD", value);
                onUSDManualToggle();
              }}
              placeholder="250"
              required
            />
            {!isUSDManual && formData.priceUSD && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <span className="text-xs text-green-600 font-medium">
                  Auto-calculated
                </span>
              </div>
            )}
          </div>
          {isUSDManual && (
            <button
              type="button"
              onClick={onUSDManualToggle}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Reset to auto-calculate
            </button>
          )}
        </div>
      </Field>

      <Field label="Commission per Course (%)">
        <TextInput
          type="number"
          value={formData.commissionPercourse}
          onChange={(value) => onFieldChange("commissionPercourse", value)}
          placeholder="15.5"
        />
      </Field>

     
 <DateInput
        label="Registration Deadline"
        value={formData.registrationDeadline}
        onChange={(value) => onFieldChange("registrationDeadline", value)}
        error={dateErrors.registrationDeadline}
      />
      <DateInput
        label="Start Date"
        value={formData.startDate}
        onChange={(value) => onFieldChange("startDate", value)}
        error={dateErrors.startDate}
      />
      
      <DateInput
        label="End Date"
        value={formData.endDate}
        onChange={(value) => onFieldChange("endDate", value)}
      />
      
     


      <div className="md:col-span-2">
        <StatusSelect value={formData.status} onChange={(value) => onFieldChange("status", value)} />
      </div>
      
        <ImageUpload
          label="Thumbnail Image"
          value={formData.thumbnailUrl}
          onChange={(url) => onFieldChange("thumbnailUrl", url)}
          isThumbnail={true}
        />

    </div>
  );
}