import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleLayout, RequireRole, NavItem } from "@/components/layouts/RoleLayout";
import {
  LayoutDashboard, Building2, CreditCard, Settings as SettingsIcon, BarChart3,
  Users, GraduationCap, ClipboardCheck, Sparkles, Wallet, Boxes, Award, Bell,
  CalendarDays, MessageSquare, CalendarOff, BookOpen, ClipboardList, FileText, Palette, Star, TrendingUp,
  MessageSquareHeart,
} from "lucide-react";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";

import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import Institutions from "./pages/super-admin/Institutions";
import SuperBilling from "./pages/super-admin/Billing";
import { Settings as SuperSettings, Reports as SuperReports } from "./pages/super-admin/SimplePages";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Students from "./pages/admin/Students";
import Teachers from "./pages/admin/Teachers";
import Attendance from "./pages/admin/Attendance";
import CRM from "./pages/admin/CRM";
import Payroll from "./pages/admin/Payroll";
import Inventory from "./pages/admin/Inventory";
import Billing from "./pages/admin/Billing";
import Certificates from "./pages/admin/Certificates";
import Notifications from "./pages/admin/Notifications";
import AdminFeedback from "./pages/admin/Feedback";

import { SeniorDashboard, ClassApprovals, LeaveApprovals, MyClasses as SeniorMyClasses, ChatPage } from "./pages/senior-teacher/SeniorTeacherPages";
import { TeacherDashboard, TeacherSlotRequests, TeacherAttendance, TeacherLeave, TeacherMyClasses, ChatPage as TeacherChat } from "./pages/teacher/TeacherPages";
import { StudentDashboard, MyClassesStudent, RequestSlot, StudentAttendance, StudentFees, StudentCertificates, ChatPage as StudentChat } from "./pages/student/StudentPages";
import { StudentFeedback } from "./pages/student/Feedback";
import { TeacherDrawingTests, SeniorDrawingReviews, StudentMyScores } from "./pages/shared/DrawingTests";
import { ProgressReports } from "./pages/shared/ProgressReports";
import { Chat as SharedChat } from "./pages/shared/Chat";
import { useStore } from "@/store/dataStore";

const queryClient = new QueryClient();

const superAdminNav: NavItem[] = [
  { to: "/super-admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/super-admin/institutions", label: "Institutions", icon: Building2 },
  { to: "/super-admin/billing", label: "Billing", icon: CreditCard },
  { to: "/super-admin/settings", label: "Settings", icon: SettingsIcon },
  { to: "/super-admin/reports", label: "Reports", icon: BarChart3 },
];
const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/admin/progress", label: "Progress Reports", icon: TrendingUp },
  { to: "/admin/crm", label: "CRM Leads", icon: Sparkles },
  { to: "/admin/payroll", label: "HR & Payroll", icon: Wallet },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/billing", label: "Billing", icon: CreditCard },
  { to: "/admin/certificates", label: "Certificates", icon: Award },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/feedback", label: "Parent Feedback", icon: MessageSquareHeart },
  { to: "/admin/chat", label: "Chat", icon: MessageSquare },
];
const seniorNav: NavItem[] = [
  { to: "/senior-teacher", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/senior-teacher/class-approvals", label: "Class Approvals", icon: ClipboardCheck },
  { to: "/senior-teacher/leave-approvals", label: "Leave Approvals", icon: CalendarOff },
  { to: "/senior-teacher/drawing-reviews", label: "Drawing Reviews", icon: Palette },
  { to: "/senior-teacher/classes", label: "My Classes", icon: CalendarDays },
  { to: "/senior-teacher/chat", label: "Chat", icon: MessageSquare },
];
const teacherNav: NavItem[] = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/teacher/classes", label: "My Classes", icon: CalendarDays },
  { to: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/teacher/drawing-tests", label: "Drawing Tests", icon: Palette },
  { to: "/teacher/progress", label: "Student Progress", icon: TrendingUp },
  { to: "/teacher/slot-requests", label: "Slot Requests", icon: ClipboardList },
  { to: "/teacher/leave", label: "Leave", icon: CalendarOff },
  { to: "/teacher/chat", label: "Chat", icon: MessageSquare },
];
const studentNav: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/student/classes", label: "My Classes", icon: CalendarDays },
  { to: "/student/scores", label: "My Scores", icon: Star },
  { to: "/student/request-slot", label: "Request Slot", icon: ClipboardList },
  { to: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/student/fees", label: "Fees", icon: Wallet },
  { to: "/student/certificates", label: "Certificates", icon: Award },
  { to: "/student/feedback", label: "Feedback", icon: MessageSquareHeart },
  { to: "/student/chat", label: "Chat", icon: MessageSquare },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            <Route element={<RequireRole role="super-admin"><RoleLayout navItems={superAdminNav} role="super-admin" /></RequireRole>}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/institutions" element={<Institutions />} />
              <Route path="/super-admin/billing" element={<SuperBilling />} />
              <Route path="/super-admin/settings" element={<SuperSettings />} />
              <Route path="/super-admin/reports" element={<SuperReports />} />
            </Route>

            <Route element={<RequireRole role="admin"><RoleLayout navItems={adminNav} role="admin" /></RequireRole>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<Students />} />
              <Route path="/admin/teachers" element={<Teachers />} />
              <Route path="/admin/attendance" element={<Attendance />} />
              <Route path="/admin/progress" element={<ProgressReports scope="admin" />} />
              <Route path="/admin/crm" element={<CRM />} />
              <Route path="/admin/payroll" element={<Payroll />} />
              <Route path="/admin/inventory" element={<Inventory />} />
              <Route path="/admin/billing" element={<Billing />} />
              <Route path="/admin/certificates" element={<Certificates />} />
              <Route path="/admin/notifications" element={<Notifications />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />
              <Route path="/admin/chat" element={<SharedChat />} />
            </Route>

            <Route element={<RequireRole role="senior-teacher"><RoleLayout navItems={seniorNav} role="senior-teacher" /></RequireRole>}>
              <Route path="/senior-teacher" element={<SeniorDashboard />} />
              <Route path="/senior-teacher/class-approvals" element={<ClassApprovals />} />
              <Route path="/senior-teacher/leave-approvals" element={<LeaveApprovals />} />
              <Route path="/senior-teacher/drawing-reviews" element={<SeniorDrawingReviews />} />
              <Route path="/senior-teacher/classes" element={<SeniorMyClasses />} />
              <Route path="/senior-teacher/chat" element={<ChatPage />} />
            </Route>

            <Route element={<RequireRole role="teacher"><RoleLayout navItems={teacherNav} role="teacher" /></RequireRole>}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/classes" element={<TeacherMyClasses />} />
              <Route path="/teacher/attendance" element={<TeacherAttendance />} />
              <Route path="/teacher/drawing-tests" element={<TeacherDrawingTests />} />
              <Route path="/teacher/progress" element={<ProgressReports scope="teacher" />} />
              <Route path="/teacher/slot-requests" element={<TeacherSlotRequests />} />
              <Route path="/teacher/leave" element={<TeacherLeave />} />
              <Route path="/teacher/chat" element={<TeacherChat />} />
            </Route>

            <Route element={<RequireRole role="student"><RoleLayout navItems={studentNav} role="student" /></RequireRole>}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/classes" element={<MyClassesStudent />} />
              <Route path="/student/scores" element={<StudentScoresRoute />} />
              <Route path="/student/request-slot" element={<RequestSlot />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/fees" element={<StudentFees />} />
              <Route path="/student/certificates" element={<StudentCertificates />} />
              <Route path="/student/feedback" element={<StudentFeedback />} />
              <Route path="/student/chat" element={<StudentChat />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

// Bridge so the student "scores" route uses the same "current student" the rest of the
// student portal uses (the first student in the store).
function StudentScoresRoute() {
  const studentId = useStore(s => s.students[0]?.id ?? "");
  return <StudentMyScores studentId={studentId} />;
}
