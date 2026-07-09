# SP Art Hub - ERP System
## Comprehensive Project Documentation

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [How It Works](#how-it-works)
5. [Role-Based Access Control](#role-based-access-control)
6. [Database Schema](#database-schema)
7. [Module Details by Role](#module-details-by-role)
8. [API Structure](#api-structure)
9. [Authentication & Security](#authentication--security)
10. [Payment Integration](#payment-integration)
11. [Deployment](#deployment)

---

## Project Overview

**SP Art Hub**  is a comprehensive Enterprise Resource Planning (ERP) system designed specifically for art academies and educational institutions. The system manages students, teachers, classes, attendance, fees, payroll, evaluations, certificates, and more through a unified web-based platform.

### Key Features
- Multi-role dashboard system with 5 distinct user roles
- Complete student lifecycle management (admission to certification)
- Teacher and staff management with payroll processing
- Attendance tracking for students and teachers
- Drawing test evaluation system with image comparison
- Course and batch management
- Payment processing with Razorpay integration
- Referral and rewards system
- Chat and communication system
- Leave management system
- Certificate generation
- Inventory management
- CRM for lead management
- Real-time notifications

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**: 
  - Zustand (dataStore)
  - React Context (AuthContext)
- **Data Fetching**: TanStack React Query (@tanstack/react-query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Date Handling**: date-fns
- **PDF Generation**: jsPDF, PDFKit

### Backend
- **Runtime**: Node.js
- **Database**: MongoDB (with Mongoose ODM)
- **API**: Next.js API Routes
- **Authentication**: bcryptjs for password hashing
- **Email**: Nodemailer
- **File Upload**: Cloudinary
- **Payment Gateway**: Razorpay

### Development Tools
- **Package Manager**: npm / Bun
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint
- **Build Tool**: Next.js built-in compiler

---

## Architecture

### Project Structure
```
Sp_art_ERP/
├── public/                 # Static assets (images, favicon)
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── teacher/      # Teacher dashboard pages
│   │   ├── senior-teacher/ # Senior teacher dashboard pages
│   │   ├── student/      # Student portal pages
│   │   ├── super-admin/  # Super admin pages
│   │   ├── login/        # Authentication pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── shared/      # Shared components (Logo, Avatar)
│   │   ├── layouts/     # Layout components (RoleLayout)
│   │   ├── admin/       # Admin-specific components
│   │   ├── teacher/     # Teacher-specific components
│   │   ├── student/     # Student-specific components
│   │   └── senior-teacher/ # Senior teacher components
│   ├── contexts/        # React contexts (AuthContext)
│   ├── lib/            # Utility functions and libraries
│   │   ├── models/     # Mongoose database models
│   │   ├── auth/       # Authentication utilities
│   │   ├── email/      # Email templates and sending
│   │   ├── attendance/ # Attendance logic
│   │   ├── payroll/    # Salary calculations
│   │   ├── invoice/    # Invoice generation
│   │   ├── chat/       # Chat functionality
│   │   └── mongodb.ts  # Database connection
│   ├── data/           # Mock data and constants
│   ├── hooks/          # Custom React hooks
│   ├── store/          # Zustand state management
│   └── legacy-pages/   # Migrated Vite pages
├── .env                # Environment variables
├── package.json        # Dependencies
└── next.config.js      # Next.js configuration
```

### Key Architectural Patterns

1. **Role-Based Layout System**: Uses `RoleLayout` component to provide consistent sidebar navigation and header across all role dashboards
2. **Route Protection**: `RequireRole` and `RequireRoles` components ensure users can only access authorized pages
3. **API Route Organization**: RESTful API routes organized by role and feature
4. **Database Models**: Mongoose schemas with proper indexing and relationships
5. **Client-Side State**: AuthContext for authentication, Zustand for global state
6. **Server-Side State**: React Query for data fetching and caching

---

## How It Works

### Application Flow

1. **Authentication**
   - User accesses `/login` page
   - Selects role (Super Admin, Admin, Senior Teacher, Teacher, Student)
   - Enters credentials (email/password)
   - System validates against database
   - Session created and stored in localStorage
   - User redirected to role-specific dashboard

2. **Dashboard Loading**
   - RoleLayout component wraps dashboard
   - Sidebar navigation populated based on role
   - Header shows user info and notifications
   - Dashboard data fetched via API routes
   - React Query caches responses for performance

3. **Data Operations**
   - CRUD operations performed through API routes
   - API routes interact with MongoDB via Mongoose models
   - Changes reflected in UI through React Query invalidation
   - Real-time updates via re-fetching

4. **Payment Flow**
   - Student enrolls in course
   - Razorpay payment initiated
   - Payment success/failure handled
   - Enrollment record created in database
   - Invoice generated automatically
   - Email confirmation sent

5. **Evaluation Flow**
   - Teacher creates drawing test/task
   - Students submit drawings
   - Senior teacher reviews and evaluates
   - Scores and feedback recorded
   - Progress updated

---

## Role-Based Access Control

### 1. Super Admin
**Purpose**: Multi-institution management at the highest level

**Access Level**: Full access to all institutions and system-wide settings

**Dashboard**: `/super-admin`

**Modules**:
- **Institutions Management**: View, create, edit, deactivate art academies
- **Billing**: Manage subscription plans and payments
- **Credentials**: Manage system-wide credentials
- **Reports**: Generate institution-level reports
- **Settings**: Configure system-wide parameters

**Key Features**:
- Monitor all connected institutions
- Manage pricing plans (Basic, Pro, Enterprise)
- View revenue analytics across institutions
- System configuration and maintenance

---

### 2. Admin
**Purpose**: Single institution management (Principal/Owner)

**Access Level**: Full control over one academy

**Dashboard**: `/admin`

**Modules**:

#### A. Student Management
- **Students** (`/admin/students`): View all students, add new students, edit student details
- **Admissions** (`/admin/admission`): Manage new student admissions
- **Student Credentials** (`/admin/credentials`): Manage student login credentials
- **Enrolled Students** (`/admin/enrolled`): View enrolled students by course/batch

#### B. Teacher Management
- **Teachers** (`/admin/teachers`): View and manage teaching staff
- **Senior Teachers** (`/admin/senior-teacher`): Manage senior teacher accounts
- **Teacher Performance** (`/admin/teacher-performance`): Track teacher metrics
- **Staff Attendance** (`/admin/attendance/staff`): Mark staff attendance

#### C. Academic Management
- **Courses** (`/admin/courses`): Create and manage art courses
- **Batches** (`/admin/batches`): Create class batches, assign teachers and students
- **Classes** (`/admin/classes`): Schedule and manage classes
- **Drawing Tasks** (`/admin/drawing-tasks`): Create drawing assignments

#### D. Attendance & Progress
- **Attendance** (`/admin/attendance`): View attendance reports
- **Progress** (`/admin/progress`): Track student progress across courses

#### E. Financial Management
- **Billing** (`/admin/billing`): Manage fee collection and billing
- **Offline Payments** (`/admin/offline-payments`): Record cash/offline payments
- **Payroll** (`/admin/payroll`): Process teacher salaries
- **Installments** (`/admin/installments`): Manage fee installment plans

#### F. Communication & CRM
- **Chat** (`/admin/chat`): Communicate with parents and staff
- **Queries** (`/admin/queries`): Handle parent/student queries
- **CRM** (`/admin/crm`): Manage leads and enrollments
- **Notifications** (`/admin/notifications`): Send announcements

#### G. Certificates & Rewards
- **Certificates** (`/admin/certificates`): Generate student certificates
- **Referrals** (`/admin/referrals`): Manage referral program
- **Rewards** (`/admin/rewards`): Configure reward system
- **Gift Management** (`/admin/gift-management`): Manage reward gifts

#### H. Administrative
- **Leaves** (`/admin/leaves`): Approve/reject staff leave requests
- **Inventory** (`/admin/inventory`): Manage art supplies and materials
- **Feedback** (`/admin/feedback`): View student/parent feedback

**Key Features**:
- Complete oversight of academy operations
- Financial reporting and analytics
- Staff management and payroll
- Student lifecycle management
- Communication hub for all stakeholders

---

### 3. Senior Teacher
**Purpose**: Academic oversight and teacher supervision

**Access Level**: Manage teachers, students, and academic quality

**Dashboard**: `/senior-teacher`

**Modules**:

#### A. Student Management
- **Students** (`/senior-teacher/students`): View assigned students, manage records
- **Admissions** (`/senior-teacher/admission`): Process new admissions
- **Progress** (`/senior-teacher/progress`): Track student academic progress

#### B. Teacher Management
- **Teachers** (`/senior-teacher/teachers`): View and manage assigned teachers
- **Performance** (`/senior-teacher/performance`): Evaluate teacher performance
- **Teacher Queries** (`/senior-teacher/teacher-queries`): Handle teacher questions

#### C. Batch & Class Management
- **Batches** (`/senior-teacher/batches`): Create and manage batches
- **Classes** (`/senior-teacher/classes`): View class schedules
- **Class Approvals** (`/senior-teacher/class-approvals`): Approve teacher-created classes

#### D. Drawing Evaluations
- **Drawing Tasks** (`/senior-teacher/drawing-tasks`): Create drawing assignments
- **Drawing Reviews** (`/senior-teacher/drawing-reviews`): Review student drawings
- **Drawing Tests** (`/senior-teacher/drawing-tests`): Manage drawing tests

#### E. Attendance
- **Attendance** (`/senior-teacher/attendance`): View attendance reports
- **Self Attendance** (`/senior-teacher/self-attendance`): Mark own attendance

#### F. Leave Management
- **Leave** (`/senior-teacher/leave`): Apply for leave
- **Leave Approvals** (`/senior-teacher/leave-approvals`): Approve teacher leave requests

#### G. Financial
- **Salary** (`/senior-teacher/salary`): View salary details

#### H. Communication
- **Chat** (`/senior-teacher/chat`): Communicate with teachers and students
- **Queries** (`/senior-teacher/queries`): Handle queries
- **Profile** (`/senior-teacher/profile`): Manage profile

**Key Features**:
- Academic quality control
- Teacher supervision and evaluation
- Student progress monitoring
- Drawing test evaluation
- Batch scheduling and management

---

### 4. Teacher
**Purpose**: Classroom instruction and student interaction

**Access Level**: Manage assigned classes and students

**Dashboard**: `/teacher`

**Modules**:

#### A. Attendance Management
- **Attendance** (`/teacher/attendance`): Mark student attendance for batches
- **Student Attendance** (`/teacher/student-attendance`): View individual student attendance
- **Attendance Report** (`/teacher/attendance-report`): Generate attendance reports
- **Self Attendance** (`/teacher/self-attendance`): Mark own attendance

#### B. Batch & Class Management
- **Batches** (`/teacher/batches`): View assigned batches
- **Classes** (`/teacher/classes`): View class schedules

#### C. Drawing Tests
- **Drawing Tests** (`/teacher/drawing-tests`): Create and manage drawing tests
- Evaluate student drawings

#### D. Student Progress
- **Progress** (`/teacher/progress`): Track student progress

#### E. Leave Management
- **Leave** (`/teacher/leave`): Apply for leave

#### F. Financial
- **Salary** (`/teacher/salary`): View salary details and download payslips

#### G. Communication
- **Chat** (`/teacher/chat`): Communicate with students and parents
- **Queries** (`/teacher/queries`): Handle student queries
- **Profile** (`/teacher/profile`): Manage profile
- **Slot Requests** (`/teacher/slot-requests`): Handle student slot requests

**Key Features**:
- Daily attendance marking
- Drawing test creation and evaluation
- Student progress tracking
- Communication with students/parents
- Salary viewing

---

### 5. Student
**Purpose**: Learning portal for students

**Access Level**: View personal information, enrolled courses, and progress

**Dashboard**: `/student/dashboard`

**Modules**:

#### A. Course Management
- **Courses** (`/student/courses`): Browse available courses
- **My Courses** (`/student/my-courses`): View enrolled courses
- **Classes** (`/student/classes`): View class schedules

#### B. Evaluations
- **Scores** (`/student/scores`): View drawing test scores and feedback
- **Scores Detail** (`/student/scores/[evaluationId]`): Detailed evaluation view

#### C. Attendance
- **Attendance** (`/student/attendance`): View personal attendance record

#### D. Financial
- **Fees** (`/student/fees`): View fee status and payment history

#### E. Certificates
- **Certificates** (`/student/certificates`): View earned certificates

#### F. Communication
- **Chat** (`/student/chat`): Communicate with teachers
- **Feedback** (`/student/feedback`): Submit feedback
- **Support** (`/student/support`): Get support

#### G. Referrals & Rewards
- **Referrals** (`/student/referrals`): Refer new students and earn rewards
- **Rewards** (`/student/rewards`): View and claim rewards

#### H. Other
- **Profile** (`/student/profile`): Manage personal profile
- **Request Slot** (`/student/request-slot`): Request class slot changes

**Key Features**:
- Course enrollment and viewing
- Drawing test submission
- Score and feedback viewing
- Attendance tracking
- Fee payment
- Referral program participation
- Communication with teachers

---

## Database Schema

### Core Models

#### 1. Student
```typescript
{
  fullName: string
  email?: string
  passwordHash?: string
  badgeId: string (unique)
  className: string
  parentName?: string
  phone?: string
  photo?: string
  dob?: Date
  age?: number
  bloodGroup?: string
  gender?: string
  school?: string
  college?: string
  occupation?: string
  fatherName?: string
  fatherMobile?: string
  fatherOccupation?: string
  motherName?: string
  motherMobile?: string
  motherOccupation?: string
  address?: string
  howYouKnowUs?: string
  courseDurationMonths: number
  courseEndDate?: Date
  feeStatus: 'Paid' | 'Pending' | 'Overdue'
  createdBy?: ObjectId (SeniorTeacher)
  createdAt: Date
  updatedAt: Date
}
```

#### 2. Teacher
```typescript
{
  fullName: string
  badgeId?: string
  email: string (unique)
  phone?: string
  dob?: string
  age?: number
  gender?: string
  bloodGroup?: string
  schoolCollege?: string
  parentGuardianDetails?: string
  address?: string
  className?: string
  currentSubjectCourse?: string
  experience: number
  batchDetails?: string
  specialization: string
  role?: string
  photo?: string
  qualification?: string
  school?: string
  college?: string
  joiningDate?: string
  salary?: number
  branchName?: string
  bio?: string
  classes: string[]
  status: 'Active' | 'Inactive'
  isSenior: boolean
  createdBy?: ObjectId (SeniorTeacher)
  assignedBatches?: ObjectId[]
  createdAt: Date
  updatedAt: Date
}
```

#### 3. SeniorTeacher
```typescript
{
  fullName: string
  email: string (unique)
  phone?: string
  specialization: string
  experience: number
  qualification?: string
  salary?: number
  status: 'Active' | 'Inactive'
  createdAt: Date
  updatedAt: Date
}
```

#### 4. Course
```typescript
{
  courseTitle: string
  courseCode: string (unique)
  image?: string
  instructor?: string
  duration: number
  startDate?: Date
  endDate?: Date
  totalFees: number
  discountFees: number
  discountPercentage: number
  status: 'active' | 'inactive'
  notes?: string
  rulesAndRegulations?: string
  materialsRequired?: string
  category?: string
  categorySlug?: string
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}
```

#### 5. Batch
```typescript
{
  batchName: string
  batchCode?: string
  courseName: string
  batchTiming?: string
  batchDay: string
  batchTime: string
  startDate?: string
  endDate?: string
  startMonth: string
  endMonth: string
  roomNumber?: string
  branch: string
  maxStudents?: number
  batchCapacity: number
  batchStatus: 'Active' | 'Inactive' | 'Completed'
  description: string
  students: BatchEmbeddedStudent[] (embedded roster)
  teacherIds: ObjectId[] (assigned teachers)
  seniorTeacherIds: ObjectId[] (assigned senior teachers)
  attendanceSummary: {
    totalSessions: number
    completedSessions: number
    averageAttendancePercent: number
  }
  createdBy?: ObjectId (SeniorTeacher)
  createdAt: Date
  updatedAt: Date
}
```

#### 6. Attendance
```typescript
{
  studentId: ObjectId
  batchId: ObjectId
  teacherId: ObjectId
  attendanceDate: string
  status: 'Present' | 'Absent'
  remarks: string
  markedBy: ObjectId (Teacher)
  createdAt: Date
  updatedAt: Date
}
```

#### 7. CourseEnrollment
```typescript
{
  studentId: ObjectId
  courseId: ObjectId
  batchId?: ObjectId
  enrollmentDate: Date
  status: 'active' | 'completed' | 'dropped'
  completionPercentage: number
  paymentType: 'full' | 'installment'
  paymentId?: string
  orderId?: string
  amount?: number
  baseAmount?: number
  totalAmount?: number
  paidAmount?: number
  remainingAmount?: number
  paymentStatus?: string
  paymentPlanStatus: 'paid' | 'partially_paid' | 'pending' | 'overdue' | 'failed'
  paymentMethod?: string
  discountPercentage?: number
  discountAmount?: number
  taxAmount?: number
  installmentCharge?: number
  invoiceId?: string
  invoiceGeneratedAt?: Date
  referralCode?: string
  referralDiscountTotal?: number
  referralDiscountApplied?: number
  createdAt: Date
  updatedAt: Date
}
```

#### 8. DrawingTest
```typescript
{
  teacherId: ObjectId
  teacherName: string
  batchId: ObjectId
  batchName: string
  courseName: string
  batchMonth?: string
  studentId: ObjectId
  studentName: string
  taskId?: ObjectId
  testTitle: string
  timeTaken: number
  teacherDrawingImage: string
  studentDrawingImage: string
  status: 'Pending Senior Review' | 'Reviewed' | 'Approved' | 'Rejected'
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

#### 9. Leave
```typescript
{
  teacherId: ObjectId
  teacherName: string
  teacherEmail: string
  leaveType: 'Casual' | 'Sick' | 'Personal'
  fromDate: string
  toDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  adminRemark: string
  daysCount: number
  createdAt: Date
  updatedAt: Date
}
```

#### 10. Payment-Related Models
- **EnrollmentInstallment**: Installment payment tracking
- **EnrollmentPaymentRecord**: Payment transaction records
- **OfflinePayment**: Cash/offline payment records
- **PaymentAuditLog**: Payment audit trail

#### 11. Referral & Rewards
- **ReferralSetting**: Referral program configuration
- **ReferralTransaction**: Referral transactions
- **ReferralWalletTransaction**: Wallet transactions
- **Reward**: Available rewards
- **RewardCategory**: Reward categories
- **RewardClaim**: Reward redemption records

#### 12. Chat Models
- **ChatConversation**: Conversation threads
- **ChatMessage**: Individual messages
- **ChatParticipant**: Conversation participants
- **ChatBlockedUser**: Blocked users

#### 13. Other Models
- **Query**: Student/parent queries
- **StudentCredentials**: Student login credentials
- **SalaryProfile**: Teacher salary profiles
- **PayrollEntry**: Payroll records
- **PayrollRun**: Payroll run history
- **TeacherAttendance**: Teacher attendance records
- **TeacherLeaveBalance**: Leave balance tracking
- **SeniorTeacherLeave**: Senior teacher leave
- **SeniorTeacherLeaveBalance**: Senior teacher leave balance
- **StudentEvaluation**: Student evaluation records
- **StudentAdmission**: Admission records
- **StudentReferralProfile**: Referral profiles
- **CredentialAudit**: Credential change audit
- **DrawingTask**: Drawing task definitions

---

## API Structure

### API Route Organization

#### Admin APIs (`/api/admin`)
- **Session**: `/api/admin/session` - Admin authentication
- **Students**: `/api/admin/students` - Student CRUD
- **Teachers**: `/api/admin/teachers` - Teacher CRUD
- **Senior Teachers**: `/api/admin/senior-teachers` - Senior teacher CRUD
- **Enrollments**: `/api/admin/enrollments` - Course enrollment management
- **Installments**: `/api/admin/installments` - Installment tracking
- **Offline Payments**: `/api/admin/offline-payments` - Cash payment management
- **Payroll**: `/api/admin/payroll` - Salary processing
- **Leaves**: `/api/admin/leaves` - Leave management
- **Attendance**: `/api/admin/attendance` - Attendance reports
- **Staff Attendance**: `/api/admin/staff-attendance` - Staff attendance
- **Queries**: `/api/admin/queries` - Query management
- **Teacher Queries**: `/api/admin/teacher-queries` - Teacher queries
- **Referrals**: `/api/admin/referrals` - Referral management
- **Rewards**: `/api/admin/rewards` - Reward management
- **Reward Claims**: `/api/admin/reward-claims` - Reward redemption
- **Update Credentials**: `/api/admin/update-credentials` - Credential updates

#### Student APIs (`/api/student`)
- **Login**: `/api/student/login` - Student authentication
- **Logout**: `/api/student/logout` - Student logout
- **Profile**: `/api/student/profile` - Profile management
- **Courses**: `/api/student/courses` - Course browsing
- **Enroll**: `/api/student/enroll` - Course enrollment
- **Enrolled Courses**: `/api/student/enrolled-courses` - My courses
- **Attendance**: `/api/student/attendance` - Attendance records
- **Evaluations**: `/api/student/evaluations` - Drawing test evaluations
- **Enrollment Invoice**: `/api/student/enrollment-invoice` - Invoice download
- **Queries**: `/api/student/queries` - Submit queries
- **Referrals**: `/api/student/referrals` - Referral operations
- **Rewards**: `/api/student/rewards` - Reward operations

#### Teacher APIs (`/api/teacher`)
- **Session**: `/api/teacher/session` - Teacher authentication
- **Logout**: `/api/teacher/logout` - Teacher logout
- **Profile**: `/api/teacher/profile` - Profile management
- **Attendance**: `/api/teacher/attendance` - Mark attendance
- **Attendance Report**: `/api/teacher/attendance-report` - Attendance reports
- **Batches**: `/api/teacher/batches` - Batch management
- **Leaves**: `/api/teacher/leaves` - Leave management
- **Salary**: `/api/teacher/salary` - Salary details
- **Self Attendance**: `/api/teacher/self-attendance` - Self attendance
- **Queries**: `/api/teacher/queries` - Query management

#### Senior Teacher APIs (`/api/senior-teacher`)
- **Session**: `/api/senior-teacher/session` - Senior teacher authentication
- **Logout**: `/api/senior-teacher/logout` - Senior teacher logout
- **Profile**: `/api/senior-teacher/profile` - Profile management
- **Students**: `/api/senior-teacher/students` - Student management
- **Teachers**: `/api/senior-teacher/teachers` - Teacher management
- **Batches**: `/api/senior-teacher/batches` - Batch management
- **Drawing Tasks**: `/api/senior-teacher/drawing-tasks` - Drawing task management
- **Performance**: `/api/senior-teacher/performance` - Performance metrics
- **Leaves**: `/api/senior-teacher/leaves` - Leave management
- **Salary**: `/api/senior-teacher/salary` - Salary details
- **Self Attendance**: `/api/senior-teacher/self-attendance` - Self attendance
- **Queries**: `/api/senior-teacher/queries` - Query management

#### Shared APIs
- **Login**: `/api/login` - General login (teacher/senior-teacher)
- **Credentials**: `/api/credentials` - Credential management
- **Attendance**: `/api/attendance` - General attendance
- **Courses**: `/api/courses` - Course data
- **Drawing Tasks**: `/api/drawing-tasks` - Drawing task data
- **Drawing Tests**: `/api/drawing-tests` - Drawing test data
- **Chat**: `/api/chat/*` - Chat functionality
- **Payment**: `/api/payment/*` - Payment processing
- **Invoice**: `/api/invoice/*` - Invoice generation
- **Upload**: `/api/upload` - File uploads
- **Dashboard**: `/api/dashboard/todays-birthdays` - Dashboard data
- **Cron**: `/api/cron/*` - Scheduled tasks

---

## Authentication & Security

### Authentication Flow

1. **Login Process**
   - User selects role and enters credentials
   - API route validates against database
   - Password compared using bcryptjs
   - Session token generated (for admin/super-admin)
   - User data stored in AuthContext
   - Redirect to role-specific dashboard

2. **Session Management**
   - Admin/Super-Admin: Token-based session with secure env credentials
   - Teacher/Senior-Teacher: Database credential validation
   - Student: Database credential validation
   - Session persisted in localStorage
   - Automatic logout on token expiration

3. **Route Protection**
   - `RequireRole` component protects single-role routes
   - `RequireRoles` component protects multi-role routes
   - Middleware checks authentication status
   - Unauthorized users redirected to login

### Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **Environment Variables**: Sensitive data in .env file
- **Role-Based Access**: Strict role separation and permissions
- **API Route Protection**: Server-side validation on all API routes
- **SQL Injection Prevention**: Mongoose ORM prevents injection
- **XSS Prevention**: React's built-in XSS protection
- **CSRF Protection**: Next.js built-in CSRF protection

---

## Payment Integration

### Razorpay Integration

**Purpose**: Process online payments for course enrollments

**Flow**:
1. Student enrolls in course
2. System creates Razorpay order
3. Razorpay checkout opens
4. Student completes payment
5. Payment success/failure webhook received
6. Enrollment record updated
7. Invoice generated
8. Confirmation email sent

**Payment Types**:
- Full payment: One-time payment for entire course
- Installment payment: Course fee split into monthly installments

**Features**:
- Automatic invoice generation
- Payment failure handling
- Refund support
- Payment history tracking
- Installment tracking

### Offline Payments

**Purpose**: Record cash/offline payments

**Flow**:
1. Admin records offline payment
2. Payment details stored in database
3. Enrollment status updated
4. Manual verification process
5. Receipt generation

---

## Deployment

### Environment Setup

**Required Environment Variables**:
```env
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Build Process

```bash
# Clean build
npm run build

# Start production server
npm run start
```

### Production Considerations

- MongoDB connection with SRV resolution fallback
- DNS configuration for MongoDB Atlas
- Static asset optimization
- API route optimization
- Image optimization with Cloudinary
- Email configuration for notifications
- Payment gateway configuration

---

## Key Features by Module

### 1. Student Management
- Complete student profiles with family details
- Badge ID generation and tracking
- Course enrollment and tracking
- Fee status monitoring
- Attendance records
- Progress tracking
- Certificate generation

### 2. Teacher Management
- Teacher profiles with specialization
- Batch assignment
- Performance tracking
- Salary management
- Leave management
- Attendance marking
- Drawing test creation

### 3. Attendance System
- Daily attendance marking
- Attendance reports
- Attendance percentage calculation
- Monthly summaries
- Student-wise attendance history
- Batch-wise attendance tracking

### 4. Drawing Evaluation System
- Drawing task creation by teachers
- Student drawing submission
- Image upload via Cloudinary
- Senior teacher review
- Score assignment
- Feedback generation
- Progress tracking

### 5. Payment System
- Razorpay integration
- Installment plans
- Offline payment recording
- Invoice generation (PDF)
- Payment history
- Refund handling
- Fee status tracking

### 6. Referral System
- Unique referral codes
- Referral tracking
- Reward points
- Wallet system
- Reward redemption
- Gift management

### 7. Chat System
- Role-based chat threads
- Real-time messaging
- Read/unread status
- Attachment support
- User blocking

### 8. Leave Management
- Leave application
- Leave approval workflow
- Leave balance tracking
- Leave types (Casual, Sick, Personal)
- Leave history

### 9. Payroll System
- Salary profile management
- Salary calculation
- Payroll runs
- Payslip generation (PDF)
- Tax calculation
- Deduction tracking

### 10. Certificate System
- Certificate templates
- Auto-generation
- PDF download
- Student name and course details
- Issue date tracking

### 11. Inventory Management
- Item tracking
- Stock level monitoring
- Low stock alerts
- Reorder point management
- Issue tracking

### 12. CRM System
- Lead management
- Lead stages (New Enquiry, Follow-up, Visit Scheduled, Enrolled)
- Counselor assignment
- Source tracking
- Conversion tracking

### 13. Notification System
- Birthday reminders
- Fee due alerts
- Inventory alerts
- General announcements
- Multi-channel (WhatsApp, SMS, Email)

---

## Development Guidelines

### Code Organization
- Keep components modular and reusable
- Use TypeScript for type safety
- Follow existing folder structure
- Use Tailwind CSS for styling
- Write tests for new features

### Best Practices
- Use React Query for data fetching
- Implement proper error handling
- Add loading states
- Validate forms with Zod
- Use environment variables for sensitive data
- Follow RESTful API conventions

### Testing
```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Check MONGODB_URI in .env
   - Verify DNS configuration
   - Check network connectivity

2. **Payment Failures**
   - Verify Razorpay credentials
   - Check webhook configuration
   - Review payment logs

3. **Email Not Sending**
   - Verify email configuration
   - Check SMTP settings
   - Review email logs

4. **Image Upload Failures**
   - Check Cloudinary credentials
   - Verify file size limits
   - Review upload logs

---

## Future Enhancements

### Planned Features
- Mobile app (React Native)
- Advanced analytics dashboard
- AI-powered drawing evaluation
- Video learning modules
- Parent portal
- Multi-language support
- Advanced reporting
- API for third-party integrations

---

## Support & Contact

For technical support or questions:
- Email: support@spartshub.com
- Documentation: Available in project repository

---

## License

Proprietary - All rights reserved

---

## Credits

**Development Team**: SP Art Hub Development Team
**Project Lead**: Dev.PawanBWagh
**Testing**: shashant
**Contributors**: coflictr

---

*Last Updated: July 2026*
*Version: 1.0.0*
