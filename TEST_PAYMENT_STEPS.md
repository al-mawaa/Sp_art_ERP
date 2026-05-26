# QUICK PAYMENT TEST - STEP BY STEP

## Step 1: Open Browser Developer Tools
1. Open your browser
2. Press **F12** to open DevTools
3. Go to **Console tab**
4. Make sure you can see it clearly
5. **Leave it open** while testing

## Step 2: Open Student Portal
1. Go to: `http://localhost:3000/student/courses`
2. You should see "Elementary" course for ₹15,000
3. **DO NOT CLICK ENROLL YET**

## Step 3: Prepare to Capture Logs
1. Keep DevTools Console open (F12)
2. Keep terminal window open showing "Ready in 2.1s"
3. Have notepad ready to copy-paste logs

## Step 4: Click "Enroll Now"
1. Click the orange **"Enroll Now"** button
2. Watch the **Console** for logs
3. You should see: `=== PAYMENT SUCCESS HANDLER ===` appear

## Step 5: Complete Razorpay Payment
When Razorpay dialog opens:
1. Select **Netbanking** (easier for testing)
2. Click **Pay**
3. On test bank page, click **SUCCESS**

## Step 6: Capture Console Logs
After payment:
1. In Console, select all text: **Ctrl+A**
2. Copy: **Ctrl+C**
3. Open Notepad and paste
4. Save as: `browser_logs.txt`
5. **Send this file to me**

## Step 7: Capture Terminal Logs
In the terminal where `npm run dev` is running:
1. Select all output: **Ctrl+A**
2. Copy: **Ctrl+C**
3. Paste into Notepad
4. Save as: `terminal_logs.txt`
5. **Send this file to me**

## What to Look For

### ✅ In Browser Console, you should see:
```
=== PAYMENT SUCCESS HANDLER ===
Razorpay response: {
  razorpay_order_id: "order_...",
  razorpay_payment_id: "pay_...",
  razorpay_signature: "abc123..."
}
Verify response: { status: 200, ok: true, data: { success: true } }
Enrollment saved successfully!
```

### ✅ In Terminal, you should see:
```
✓ Auth check: SUCCESS
✓ Body parsed
✓ Razorpay order created successfully!
```

Then later:

```
✓ Auth check: SUCCESS
✓ Signature verification succeeded
✓ Enrollment created successfully!
```

### ❌ If you see errors:
- **401 Unauthorized** → Not logged in
- **Invalid signature** → Wrong credentials
- **Database connection failed** → MongoDB issue
- **Failed to create enrollment** → Database error

## After Payment

After you complete payment:

1. **Check MongoDB** - Go to course_enrollments collection
   - Should show **1 document** instead of 0

2. **Check UI** - Course page should show:
   - Toast: "Enrolled - Payment successful"
   - "Enrolled" badge on course card
   - Enroll button disabled

3. **Refresh page** - The badge should remain

---

## Send Me:
1. Browser Console logs (screenshot or text)
2. Terminal logs (screenshot or text)
3. Any error messages you see
4. Whether collection shows 1 document or still 0

I'll analyze and identify the exact issue!
