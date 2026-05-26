"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Users, 
  Clock, 
  IndianRupee, 
  User, 
  CheckCircle, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  image?: string;
  description?: string;
  duration: number;
  instructor?: string;
  totalClasses?: number;
  totalFees: number;
  discountFees: number;
  discountPercentage: number;
  status: 'active' | 'inactive';
  isEnrolled?: boolean;
  onEnrollSuccess?: () => void;
}

export function CourseCard({
  courseId,
  courseCode,
  courseTitle,
  image,
  description,
  duration,
  instructor,
  totalClasses = 24,
  totalFees,
  discountFees,
  discountPercentage,
  status,
  isEnrolled = false,
  onEnrollSuccess,
}: CourseCardProps) {
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const router = useRouter();

  useEffect(() => {
    setEnrolled(isEnrolled);
  }, [isEnrolled]);

  const originalPrice = Math.max(0, Number(discountFees ?? totalFees ?? 0));
  const percentage = Math.max(0, Number(discountPercentage ?? 0));
  const finalPrice = Math.round(Math.max(0, originalPrice - (originalPrice * percentage) / 100));
  const showDiscount = percentage > 0 && finalPrice < originalPrice;

  const handleEnroll = async () => {
    if (enrolled) return;
    if (!courseId) {
      toast({ title: 'Error', description: 'Invalid course selected.', variant: 'destructive' });
      return;
    }

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      toast({ title: 'Payment Error', description: 'Invalid course amount. Please contact support.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Create order on backend
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ amount: finalPrice, courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Payment Error', description: data.error || 'Failed to create payment order', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const order = data.order;

      // Load Razorpay script
      await new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') return reject(new Error('No window'));
        if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve();
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Razorpay script failed to load'));
        document.body.appendChild(script);
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Little Brushes Art Academy',
        description: courseTitle,
        image: '/logo.png',
        order_id: order.id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            console.log('=== PAYMENT SUCCESS HANDLER ===');
            console.log('Razorpay response:', response);
            console.log('Sending verify request with:', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: order.amount / 100,
              courseId,
            });

            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // IMPORTANT: Include cookies for authentication
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: order.amount / 100,
                courseId,
              }),
            });
            const verifyData = await verifyRes.json();
            
            console.log('Verify response:', {
              status: verifyRes.status,
              ok: verifyRes.ok,
              data: verifyData,
            });

            if (!verifyRes.ok) {
              console.error('Verification failed:', verifyData);
              toast({ title: 'Payment Verify Failed', description: verifyData.error || 'Verification failed', variant: 'destructive' });
              return;
            }

            console.log('Enrollment saved successfully!');
            setEnrolled(true);
            toast({ title: 'Enrolled', description: 'Payment successful and enrollment saved', variant: 'default' });
            onEnrollSuccess?.();
          } catch (err) {
            console.error('Verify error', err);
            toast({ title: 'Error', description: 'Payment verification error', variant: 'destructive' });
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const RazorpayCtor = (window as unknown as { Razorpay?: unknown }).Razorpay as unknown as new (opts: unknown) => { open: () => void };
      const rzp = new RazorpayCtor(options as unknown);
      rzp.open();
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({ title: 'Error', description: 'An error occurred during enrollment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    router.push(`/student/courses/${courseId}`);
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      {/* Image Section */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-900">
        {image ? (
          <img
            src={image}
            alt={courseTitle}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
          {status === 'active' ? 'Active' : 'Inactive'}
        </div>

        {/* Enrollment Badge */}
        {enrolled && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-success/90 px-2.5 py-1 text-[11px] font-semibold text-white">
            <CheckCircle className="h-3 w-3" />
            Enrolled
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="space-y-3 p-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="line-clamp-2 text-xl font-semibold text-slate-950">
              {courseTitle}
            </h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {courseCode}
            </span>
          </div>
        </div>

        {/* Instructor */}
        {instructor && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="h-4 w-4" />
            <span>{instructor}</span>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Duration */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-2">
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
            <div>
              <p className="text-[10px] text-muted-foreground">Duration</p>
              <p className="text-xs font-semibold text-foreground">
                {duration} {duration === 1 ? "month" : "months"}
              </p>
            </div>
          </div>

          {/* Classes */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-2">
            <Users className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
            <div>
              <p className="text-[10px] text-muted-foreground">Classes</p>
              <p className="text-xs font-semibold text-foreground">{totalClasses}</p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Payable Amount</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">₹{finalPrice.toLocaleString('en-IN')}</p>
            </div>
            {showDiscount ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {percentage}% OFF
              </span>
            ) : null}
          </div>
          {showDiscount ? (
            <p className="mt-4 text-sm text-slate-500 line-through">
              ₹{originalPrice.toLocaleString('en-IN')}
            </p>
          ) : null}
        </div>

        {/* Actions: View + Enroll */}
        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          <Button onClick={handleView} disabled={loading} variant="outline" className="flex-1 min-w-0">
            View Course
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={loading || enrolled || status !== 'active'}
            className={cn('flex-1 rounded-3xl transition-all duration-300',
              enrolled
                ? 'bg-success/15 text-success hover:bg-success/15'
                : 'bg-primary hover:bg-primary/90'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : enrolled ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Enrolled
              </>
            ) : (
              'Enroll Now'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
