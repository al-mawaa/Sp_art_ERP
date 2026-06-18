import React from "react";
import { redirect } from "next/navigation";

export default function SeniorTeacherDrawingTestsPage() {
  // Redirect legacy route to the new Drawing Tasks dashboard
  if (typeof window !== "undefined") {
    window.location.replace('/senior-teacher/drawing-tasks');
    return null;
  }
  redirect('/senior-teacher/drawing-tasks');
}
