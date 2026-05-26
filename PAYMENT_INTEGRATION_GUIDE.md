# Razorpay Payment Integration Guide

## Overview
This document explains the complete Razorpay payment integration flow with debugging steps.

## Architecture

### Frontend Flow (StudentCoursesPage.tsx + CourseCard.tsx)

```
User clicks "Enroll Now"
    ↓
CourseCard.handleEnroll() called
    ↓
Fetch /api/payment/create-order
    ├─ Body: { amount, courseId }
    └─ Response: { order } (Razorpay order object)
    ↓
Razorpay checkout.js opens payment dialog
    ↓
User completes payment
    ↓
Razorpay calls handler() with:
    ├─ razorpay_order_id
    ├─ razorpay_payment_id
    └─ razorpay_signature
    ↓
Frontend calls /api/payment/verify
    ├─ Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, amount }
    └─ Response: { success: true, enrollmentId }
    ↓
setEnrolled(true) + Toast notification
    ↓
onEnrollSuccess callback → handleRefresh() 
    ↓
StudentCoursesPage fetches /api/student/courses
    ↓
UI updates: "Enrolled" badge appears on course card
```

### Backend Flow

#### 1. POST /api/payment/create-order
**Input:**
```json
{
  "amount": 999,        // Amount in rupees (e.g., 999 = ₹999)
  "courseId": "507f1f77bcf86cd799439011"
}
```

**Process:**
1. Authenticate student (via STUDENT_SESSION_COOKIE)
2. Validate amount (must be > 0 and finite)
3. Validate courseId (must be valid ObjectId)
4. Initialize Razorpay SDK with RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET
5. Create order with amount in paise (amount * 100)
6. Return Razorpay order object

**Output:**
```json
{
  "order": {
    "id": "order_1234567890",
    "entity": "order",
    "amount": 99900,          // In paise
    "amount_paid": 0,
    "amount_due": 99900,
    "currency": "INR",
    "receipt": "rcpt_1234567890",
    "status": "created",
    "attempts": 0,
    "notes": {
      "courseId": "507f1f77bcf86cd799439011",
      "studentId": "507f1f77bcf86cd799439012"
    },
    "created_at": 1234567890
  }
}
```

#### 2. POST /api/payment/verify
**Input:**
```json
{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "abc123def456...",
  "courseId": "507f1f77bcf86cd799439011",
  "amount": 999                 // Amount in rupees
}
```

**Process:**
1. Authenticate student
2. Validate all required fields
3. **Verify Razorpay signature:**
   ```
   message = "{razorpay_order_id}|{razorpay_payment_id}"
   generated_signature = HMAC-SHA256(message, RAZORPAY_KEY_SECRET)
   if (generated_signature !== razorpay_signature) → FAIL
   ```
4. Check for duplicate enrollment (orderId must be unique)
5. Create enrollment in MongoDB:
   ```javascript
   {
     studentId: ObjectId(auth.student.id),
     courseId: ObjectId(courseId),
     enrollmentDate: new Date(),
     status: 'active',
     completionPercentage: 0,
     paymentId: razorpay_payment_id,
     orderId: razorpay_order_id,
     amount: 999,                    // Amount in rupees
     paymentStatus: 'paid'
   }
   ```
6. Return success response

**Output:**
```json
{
  "success": true,
  "enrollmentId": "507f1f77bcf86cd799439013",
  "message": "Enrollment saved successfully"
}
```

## Database Schema

### courseenrollments Collection
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,              // Reference to Student
  courseId: ObjectId,               // Reference to Course
  enrollmentDate: Date,             // When enrolled (default: now)
  status: String,                   // 'active', 'completed', 'dropped'
  completionPercentage: Number,     // 0-100 (default: 0)
  paymentId: String,                // Razorpay payment ID
  orderId: String,                  // Razorpay order ID (unique)
  amount: Number,                   // Amount in rupees
  paymentStatus: String,            // 'paid', 'pending', etc.
  createdAt: Date,                  // Automatic timestamp
  updatedAt: Date                   // Automatic timestamp
}
```

**Indexes:**
- `{ studentId: 1, courseId: 1 }` - Unique (prevent duplicate enrollments)
- `{ orderId: 1 }` - Unique, sparse (prevent duplicate payments)

## Environment Variables Required

```env
# Razorpay Keys (from .env)
RAZORPAY_KEY_ID=rzp_test_Stdm0qhXR41UhV
RAZORPAY_KEY_SECRET=b9u028UvScY5Gzlu8U3wApoD

# Public key for frontend
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_Stdm0qhXR41UhV

# MongoDB
MONGODB_URI=mongodb+srv://...

# Authentication
STUDENT_SESSION_COOKIE=student_session
```

## Testing Guide

### Step 1: Verify Environment Setup
```bash
# Check .env file has Razorpay credentials
grep RAZORPAY .env
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser DevTools
1. Press F12 → Console tab
2. Keep this open to see debug logs

### Step 4: Enroll in a Course

**Test Scenario:**
1. Navigate to Student Dashboard → Explore Courses
2. Find an active course with price > 0
3. Click "Enroll Now" button on a course card

**Console Logs to Watch:**
```
=== CREATE PAYMENT ORDER API ===
Auth result: { ok: true, studentId: '507f...' }
Request body: { amount: 999, courseId: '507f...' }
Initializing Razorpay...
Creating Razorpay order: { amount: 99900, currency: 'INR', ... }
Razorpay order created successfully: { id: 'order_1234...', ... }
```

### Step 5: Complete Payment
1. Razorpay payment dialog opens
2. Select "Netbanking" or "Card" option
3. Use test credentials:
   - Card: **4111 1111 1111 1111**
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits

### Step 6: Verify Payment Handler Called
**Console Logs:**
```
=== PAYMENT SUCCESS HANDLER ===
Razorpay response: { 
  razorpay_order_id: 'order_1234...',
  razorpay_payment_id: 'pay_1234...',
  razorpay_signature: 'abc123...'
}
Sending verify request with: {
  razorpay_order_id: '...',
  razorpay_payment_id: '...',
  razorpay_signature: '...',
  amount: 999,
  courseId: '...'
}
Verify response: { status: 200, ok: true, data: { success: true, enrollmentId: '507f...' } }
Enrollment saved successfully!
```

### Step 7: Check Backend Logs
Monitor terminal running `npm run dev`:
```
=== CREATE PAYMENT ORDER API ===
Auth result: { ok: true, studentId: '507f...' }
Request body: { amount: 999, courseId: '507f...' }
Connecting to database...
Database connected
...
=== PAYMENT VERIFY API ===
Auth result: { ok: true, studentId: '507f...' }
Request body: { razorpay_order_id: 'order_1234...', ... }
Verifying Razorpay signature...
Signature verification: { match: true }
Connecting to database...
Database connected
Creating enrollment with payload: { 
  studentId: ObjectId('507f...'),
  courseId: ObjectId('507f...'),
  amount: 999,
  paymentStatus: 'paid',
  ...
}
Enrollment created successfully: { _id: ObjectId('507f...'), ... }
```

### Step 8: Verify MongoDB Entry
Connect to MongoDB and check:
```javascript
db.courseenrollments.findOne({ orderId: "order_1234567890" })
```

Expected output:
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  studentId: ObjectId("507f1f77bcf86cd799439012"),
  courseId: ObjectId("507f1f77bcf86cd799439011"),
  enrollmentDate: ISODate("2025-05-26T10:30:45Z"),
  status: "active",
  completionPercentage: 0,
  paymentId: "pay_1234567890",
  orderId: "order_1234567890",
  amount: 999,
  paymentStatus: "paid",
  createdAt: ISODate("2025-05-26T10:30:45Z"),
  updatedAt: ISODate("2025-05-26T10:30:45Z")
}
```

### Step 9: Verify UI Update
✅ Toast notification: "Enrolled - Payment successful and enrollment saved"
✅ Course card now shows "Enrolled" badge
✅ Course moves to "My Courses" section

## Troubleshooting

### Issue 1: "Missing payment verification fields"
**Cause:** Frontend not sending all required fields

**Debug:**
- Check browser console log: "Sending verify request with"
- Verify all fields are present:
  - `razorpay_order_id`
  - `razorpay_payment_id`
  - `razorpay_signature`
  - `courseId`
  - `amount`

### Issue 2: "Invalid signature"
**Cause:** Signature verification failed

**Debug:**
- Check backend log: "Signature verification"
- Verify RAZORPAY_KEY_SECRET is correct in .env
- Check the signature match: true/false

### Issue 3: "Unauthorized"
**Cause:** Student authentication failed

**Debug:**
- Check STUDENT_SESSION_COOKIE exists
- Verify student is logged in
- Check browser cookies

### Issue 4: Enrollment not saved
**Cause:** Database error

**Debug:**
- Check backend log for error details
- Verify MongoDB connection
- Check for duplicate key error (studentId + courseId or orderId)
- Check MongoDB logs for validation errors

### Issue 5: Duplicate enrollment error
**Cause:** Student tries to enroll twice

**Debug:**
- Check MongoDB for existing enrollment:
  ```javascript
  db.courseenrollments.find({ 
    studentId: ObjectId("..."), 
    courseId: ObjectId("...") 
  })
  ```

## API Response Status Codes

| Code | Scenario |
|------|----------|
| 200 | Success |
| 400 | Missing/invalid fields |
| 401 | Unauthorized (not logged in) |
| 404 | Course/Student not found |
| 409 | Duplicate enrollment |
| 500 | Server error (check logs) |

## Performance Considerations

1. **Database Queries:**
   - Create-order: No DB query (just validation)
   - Verify: 2 queries (duplicate check, create enrollment)

2. **API Response Time:**
   - Create-order: ~500ms (Razorpay API call)
   - Verify: ~100ms (signature verification + DB save)

3. **UI Refresh:**
   - Automatic via `onEnrollSuccess` callback
   - Fetches `/api/student/courses` to update list

## Security Measures

1. **Signature Verification:** ✅
   - Uses HMAC-SHA256 with RAZORPAY_KEY_SECRET
   - Prevents payment tampering

2. **Authentication:** ✅
   - Requires valid STUDENT_SESSION_COOKIE
   - Prevents unauthorized access

3. **Duplicate Prevention:** ✅
   - Unique index on orderId
   - Prevents double-charging

4. **Input Validation:** ✅
   - All fields validated before processing
   - ObjectId format validation

## Files Modified

1. **`src/app/api/payment/create-order/route.ts`**
   - Added comprehensive logging
   - Added input validation

2. **`src/app/api/payment/verify/route.ts`**
   - Added comprehensive logging
   - Added signature verification logging
   - Improved error handling
   - Added ObjectId validation

3. **`src/lib/models/CourseEnrollment.ts`**
   - Added unique index on orderId
   - Updated model documentation

4. **`src/components/student/CourseCard.tsx`**
   - Added frontend logging
   - Improved error feedback

## Next Steps

1. Deploy to production with real Razorpay credentials
2. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in production .env
3. Test with real payments
4. Monitor logs for any issues
5. Set up error tracking (Sentry, LogRocket, etc.)

## Support

For issues, check:
1. Browser DevTools Console
2. Terminal/Server Logs
3. MongoDB logs
4. Razorpay Dashboard (https://dashboard.razorpay.com)
