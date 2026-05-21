import { redirect } from "next/navigation";

/** Merged into /admin/leaves */
export default function AdminSeniorTeacherLeavesRedirect() {
  redirect("/admin/leaves");
}
