"use client";

import dynamic from "next/dynamic";
import React from "react";

const AdminTaskDetail = dynamic(
  () => import("@/app/admin/senior-teacher/drawing-tasks/[id]/page"),
  { ssr: false }
);

export default function SeniorTaskDetailPage() {
  return <AdminTaskDetail basePath="/senior-teacher" />;
}
