import crypto from "crypto";

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return { keyId, keySecret, configured: Boolean(keyId && keySecret) };
}

export function getPublicRazorpayKeyId() {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
    process.env.RAZORPAY_KEY_ID?.trim() ||
    ""
  );
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const { keyId, keySecret, configured } = getRazorpayCredentials();
  if (!configured || !keyId || !keySecret) {
    throw new Error("RAZORPAY_NOT_CONFIGURED");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.max(100, Math.round(input.amountPaise)),
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes ?? {},
    }),
  });

  const data = (await res.json()) as { id?: string; error?: { description?: string } };
  if (!res.ok || !data.id) {
    throw new Error(data.error?.description || "Failed to create Razorpay order");
  }
  return data;
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret, configured } = getRazorpayCredentials();
  if (!configured || !keySecret) return false;

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(input.signature, "hex"),
    );
  } catch {
    return expected === input.signature;
  }
}

export function generateReceiptNumber() {
  return `SPA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
