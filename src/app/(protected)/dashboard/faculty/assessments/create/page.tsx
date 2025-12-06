"use client";

import { useRouter } from "next/navigation";
import AssessmentForm from "@/components/assessment/AssessmentForm";

export default function CreateAssessmentPage() {
  const router = useRouter();

  const handleSuccess = (assessmentId?: string) => {
    if (assessmentId) {
      setTimeout(() => {
        router.push(`/dashboard/faculty/assessments`);
      }, 1500);
    } else {
      router.push("/dashboard/faculty/assessments");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AssessmentForm
      mode="create"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}