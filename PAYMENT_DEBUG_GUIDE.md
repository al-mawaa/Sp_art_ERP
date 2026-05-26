# Payment Integration Debugging Guide

## Current Issue
✗ Enrollment data is NOT saving to MongoDB after payment succeeds
✗ Collection `course_enrollments` remains empty (0 documents)
✗ Enroll button reappears after refresh (enrollment not recognized)

## Quick Diagnosis Steps

### Step 1: Check Browser Console (F12)
Open DevTools → Console tab before starting payment:
```javascript
// You should see logs like:
=== PAYMENT SUCCESS HANDLER ===
Razorpay response: {...}
Sending verify request with: {...}
Verify response: { status: 200, ok: true, data: { success: true, enrollmentId: '...' } }
```

**Issue if you see:**
- No logs? → Payment handler not being called
- Network error? → API endpoint not responding
- 401/403? → Authentication failed
- 400? → Missing fields in request
- 500? → Server error

### Step 2: Check Terminal Logs (npm run dev)
Before starting payment, look for these logs in the terminal:

**Order Creation:**
```
╔═══════════════════════════════════════════╗
║   CREATE PAYMENT ORDER API - START        ║
╚═══════════════════════════════════════════╝
✓ Auth check: SUCCESS
✓ Body parsed
✓ Extracted values
✓ Amount is valid and > 0
✓ courseId present
✓ courseId is valid ObjectId
✓ Razorpay credentials found
✓ Razorpay order created successfully!
✓ ✓ ✓ ORDER CREATION COMPLETE ✓ ✓ ✓
```

**Payment Verification:**
```
╔═══════════════════════════════════════════╗
║      PAYMENT VERIFY API - START           ║
╚═══════════════════════════════════════════╝
✓ Auth check: SUCCESS
✓ All required fields present
✓ Database connected
✓ courseId is valid ObjectId
✓ No duplicate found
✓ Payload prepared
✓ Enrollment created successfully!
✓ ✓ ✓ PAYMENT VERIFICATION COMPLETE ✓ ✓ ✓
```

### Step 3: Use Debug Endpoint
Call the debug endpoint manually to test the complete flow:

**URL:** `POST http://localhost:3000/api/payment/debug`

**Request Body (from successful Razorpay payment):**
```json
{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "abc123def456...",
  "courseId": "507f1f77bcf86cd799439011",
  "amount": 999
}
```

**Response (if successful):**
```json
{
  "debugLog": [
    "=== DEBUG PAYMENT VERIFICATION ===",
    "Timestamp: 2025-05-26T10:30:45.123Z",
    "--- ENVIRONMENT CHECK ---",
    "RAZORPAY_KEY_SECRET exists: true",
    "--- AUTHENTICATION ---",
    "Auth OK: true",
    "Student ID: 507f1f77bcf86cd799439012",
    "...more logs..."
  ],
  "status": "success"
}
```

## Detailed Step-by-Step Testing

### Prerequisites
1. ✅ Server running: `npm run dev`
2. ✅ Student logged in to portal
3. ✅ Active course with price exists
4. ✅ Browser DevTools open (F12)

### Step 1: Verify Student Login
Open console in browser:
```javascript
// Check if student session cookie exists
document.cookie  // Should contain student_session=...
```

### Step 2: Start Payment Flow
1. Navigate to "Explore Courses"
2. Find an **active course** with price > 0
3. Click **"Enroll Now"**
4. **WATCH TERMINAL** for logs

### Step 3: Complete Test Payment
1. Razorpay dialog opens
2. Select payment method: **Netbanking** (fastest for testing)
3. Use test credentials:
   - **Card:** 4111 1111 1111 1111
   - **Expiry:** 12/25
   - **CVV:** 123
4. Click **PAY**

### Step 4: Monitor Both Console and Terminal

#### Browser Console Expected:
```
=== PAYMENT SUCCESS HANDLER ===
Razorpay response: {
  razorpay_order_id: "order_1234567890",
  razorpay_payment_id: "pay_1234567890",
  razorpay_signature: "abc123def456..."
}
Sending verify request with: {
  razorpay_order_id: "order_1234567890",
  razorpay_payment_id: "pay_1234567890",
  razorpay_signature: "abc123def456...",
  amount: 999,
  courseId: "507f1f77bcf86cd799439011"
}
Verify response: {
  status: 200,
  ok: true,
  data: {
    success: true,
    enrollmentId: "507f1f77bcf86cd799439013"
  }
}
Enrollment saved successfully!
```

#### Terminal Expected:
```
╔═══════════════════════════════════════════╗
║   CREATE PAYMENT ORDER API - START        ║
╚═══════════════════════════════════════════╝
✓ Auth check: SUCCESS
✓ Razorpay order created successfully!
  Order ID: order_1234567890

╔═══════════════════════════════════════════╗
║      PAYMENT VERIFY API - START           ║
╚═══════════════════════════════════════════╝
✓ Auth check: SUCCESS
✓ Signature verification succeeded
✓ Enrollment created successfully!
✓ ✓ ✓ PAYMENT VERIFICATION COMPLETE ✓ ✓ ✓
```

### Step 5: Check MongoDB
Open MongoDB Atlas dashboard:
1. Navigate to: https://cloud.mongodb.com/v2/...
2. Collections → SpArts → course_enrollments
3. Should show **1 document** (not 0)

**Document should contain:**
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  studentId: ObjectId("507f1f77bcf86cd799439012"),
  courseId: ObjectId("507f1f77bcf86cd799439011"),
  enrollmentDate: ISODate("2025-05-26T10:30:45.123Z"),
  status: "active",
  completionPercentage: 0,
  paymentId: "pay_1234567890",
  orderId: "order_1234567890",
  amount: 999,
  paymentStatus: "paid",
  createdAt: ISODate("2025-05-26T10:30:45.123Z"),
  updatedAt: ISODate("2025-05-26T10:30:45.123Z")
}
```

### Step 6: Verify UI Update
- ✅ Toast: "Enrolled - Payment successful and enrollment saved"
- ✅ "Enrolled" badge appears on course card
- ✅ Enroll button becomes disabled
- ✅ Course appears in "My Courses" after refresh

## Troubleshooting by Error

### Error: "Unauthorized" (401)
**Browser Console:**
```json
{ "error": "Unauthorized", "status": 401 }
```
**Cause:** Student not logged in or session expired
**Fix:** Login to student portal and ensure cookies are enabled

**Check:**
```javascript
// In browser console:
document.cookie  // Must contain student_session
```

### Error: "Missing payment verification fields" (400)
**Browser Console:**
```json
{
  "error": "Missing payment verification fields",
  "missing": ["courseId"]
}
```
**Cause:** Frontend not sending all required fields
**Fix:** Check CourseCard component is sending all fields correctly
**Debug:** Look at browser Network tab → payment/verify request → Request body

### Error: "Invalid signature" (400)
**Terminal:**
```
Signature verification: { match: false }
Provided signature:  abc123def456...
Generated signature: def789abc123...
```
**Cause:** Razorpay signature verification failed
**Possible Issues:**
1. Wrong RAZORPAY_KEY_SECRET in .env
2. Signature tampering
3. Timestamp mismatch

**Fix:**
```bash
# Verify .env has correct secret
grep RAZORPAY_KEY_SECRET .env
# Should match what's in Razorpay Dashboard
```

### Error: "Database connection failed" (500)
**Terminal:**
```
✗ Database connection failed: connect ENOTFOUND cluster0.nxlsj6o.mongodb.net
```
**Cause:** MongoDB URI incorrect or connection issue
**Fix:**
```bash
# Check .env
grep MONGODB_URI .env
# Verify MongoDB is accessible from your network
# Check if IP whitelist includes your IP: https://cloud.mongodb.com/v2/.../security/networkAccess
```

### Error: "Invalid courseId format" (400)
**Terminal:**
```
✗ Invalid courseId format
```
**Cause:** courseId is not a valid MongoDB ObjectId
**Fix:** Ensure courseId is a valid 24-character hex string (e.g., 507f1f77bcf86cd799439011)

### Error: "Failed to create enrollment" (500)
**Terminal:**
```
✗ Failed to create enrollment
Error type: MongoServerError
Error message: E11000 duplicate key error
Error: Duplicate key - { "studentId": 1, "courseId": 1 }
```
**Cause:** Student already enrolled in this course
**Fix:** This is expected on retry. Check MongoDB to confirm enrollment exists.

### Collection Still Empty After Payment
**Diagnosis Steps:**
1. **Check Terminal Logs:**
   - Does "Enrollment created successfully!" appear?
   - Any error messages?

2. **Check Browser Console:**
   - What's the verify response?
   - Is the status 200?

3. **Check MongoDB:**
   - Query: `db.courseenrollments.find({orderid: "order_xxx"})`
   - Does it return anything?

4. **Check Collection Name:**
   - MongoDB should have collection named: `courseenrollments` (not `course_enrollments`)

**If still not working:**
1. Restart dev server: `npm run dev`
2. Clear browser cache: Ctrl+Shift+Delete
3. Try payment again
4. Check ALL terminal output for errors
5. Look for red text ✗ in terminal logs

## Manual Testing with curl

If you want to test verify API directly:

```bash
# Get a valid order_id, payment_id, and signature from actual Razorpay payment first
# Then test:

curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -b "student_session=YOUR_STUDENT_ID" \
  -d '{
    "razorpay_order_id": "order_1234567890",
    "razorpay_payment_id": "pay_1234567890",
    "razorpay_signature": "abc123...",
    "courseId": "507f1f77bcf86cd799439011",
    "amount": 999
  }'
```

## Logs Collection

Save these logs for debugging:
1. **Browser Console** (F12 → Copy all)
2. **Terminal Output** (Ctrl+A → Copy all)
3. **MongoDB Document** (Export as JSON)
4. **Network Tab** (Export HAR)

## Files Being Used

- **Frontend:** `/src/components/student/CourseCard.tsx`
- **Create Order API:** `/src/app/api/payment/create-order/route.ts`
- **Verify API:** `/src/app/api/payment/verify/route.ts`
- **Debug API:** `/src/app/api/payment/debug/route.ts`
- **Model:** `/src/lib/models/CourseEnrollment.ts`
- **Authentication:** `/src/lib/auth/require-student.ts`

## Next Steps

After identifying the issue:
1. Share the terminal logs and browser console output
2. I'll analyze and provide specific fixes
3. Test again and confirm enrollment saves successfully

## Success Checklist

- ✅ Server logs show "Enrollment created successfully!"
- ✅ Browser shows success toast notification
- ✅ MongoDB shows 1 document in course_enrollments
- ✅ Course card shows "Enrolled" badge
- ✅ Course appears in "My Courses"
- ✅ Enroll button is disabled on refresh
