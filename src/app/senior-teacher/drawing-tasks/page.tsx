"use client";

import dynamic from "next/dynamic";
import React from "react";

// Import the admin dashboard component dynamically to reuse the UI
const AdminDrawingTasksPage = dynamic(
  () => import("@/app/admin/senior-teacher/drawing-tasks/page"),
  { ssr: false }
);

export default function SeniorDrawingTasksPage() {
  return <AdminDrawingTasksPage basePath="/senior-teacher" />;
}
