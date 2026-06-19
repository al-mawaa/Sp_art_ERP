"use client";

import dynamic from "next/dynamic";
import React from "react";

const AdminEvaluationPage = dynamic(
  () => import("@/app/admin/senior-teacher/drawing-tasks/[id]/evaluate/[submissionId]/page"),
  { ssr: false }
);

export default function SeniorEvaluationPage() {
  return <AdminEvaluationPage />;
}
