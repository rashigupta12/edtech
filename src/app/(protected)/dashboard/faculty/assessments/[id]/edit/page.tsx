"use client";

import { useRouter, useParams } from "next/navigation";
import AssessmentForm from "@/components/assessment/AssessmentForm";

export default function EditAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;

  const handleSuccess = () => {
    setTimeout(() => {
      router.push(`/dashboard/faculty/assessments`);
    }, 1500);
  };

  const handleCancel = () => {
    router.push(`/dashboard/faculty/assessments`);
  };

  const handleDelete = () => {
    router.push("/dashboard/faculty/assessments");
    router.refresh();
  };

  return (
    <AssessmentForm
      mode="edit"
      assessmentId={assessmentId}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      onDelete={handleDelete}
    />
  );
}