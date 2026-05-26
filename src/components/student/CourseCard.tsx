"use client";

import { useState } from "react";
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

  const finalPrice = totalFees - discountFees;

  const handleEnroll = async () => {
    if (enrolled) return;

    setLoading(true);
    try {
      const response = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Enrollment Failed",
          description: data.error || "Failed to enroll in course",
          variant: "destructive",
        });
        return;
      }

      setEnrolled(true);
      toast({
        title: "Success!",
        description: "You have successfully enrolled in the course",
        variant: "default",
      });

      onEnrollSuccess?.();
    } catch (error) {
      console.error("Enrollment error:", error);
      toast({
        title: "Error",
        description: "An error occurred while enrolling",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      {/* Image Section */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
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
        
        {/* Status Badge */}
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
              status === "active"
                ? "bg-success/15 text-success"
                : "bg-warning/15 text-warning"
            )}
          >
            {status === "active" ? "Active" : "Inactive"}
          </span>
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
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {courseTitle}
        </h3>

        {/* Instructor */}
        {instructor && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{instructor}</span>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2">
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
        <div className="space-y-1 border-t border-border/50 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xl font-bold text-foreground">
                {finalPrice.toFixed(0)}
              </span>
            </div>
            {discountPercentage > 0 && (
              <span className="inline-flex rounded-lg bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                Save {discountPercentage}%
              </span>
            )}
          </div>
          {discountPercentage > 0 && (
            <p className="text-[11px] text-muted-foreground line-through">
              ₹{totalFees.toFixed(0)}
            </p>
          )}
        </div>

        {/* Enroll Button */}
        <Button
          onClick={handleEnroll}
          disabled={loading || enrolled || status !== "active"}
          className={cn(
            "w-full transition-all duration-300",
            enrolled
              ? "bg-success/15 text-success hover:bg-success/15"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enrolling...
            </>
          ) : enrolled ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Enrolled
            </>
          ) : (
            "Enroll Now"
          )}
        </Button>
      </div>
    </div>
  );
}
