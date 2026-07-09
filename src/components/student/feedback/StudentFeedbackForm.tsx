"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Star } from "lucide-react";

type EligibleTeacher = {
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseName: string;
  batchId: string;
  batchName: string;
};

const formSchema = z.object({
  teacherData: z.string().min(1, "Please select a teacher"),
  category: z.string().min(1, "Please select a category"),
  teachingRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  behaviourRating: z.number().min(1).max(5),
  knowledgeRating: z.number().min(1).max(5),
  practicalRating: z.number().min(1).max(5),
  overallRating: z.number().min(1).max(5),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(100),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
  anonymous: z.boolean().default(false),
});

export function StudentFeedbackForm({ onSuccess }: { onSuccess: () => void }) {
  const [eligibleTeachers, setEligibleTeachers] = useState<EligibleTeacher[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEligibleTeachers() {
      try {
        const res = await fetch("/api/student/feedback/eligibility");
        const json = await res.json();
        if (json.success) {
          setEligibleTeachers(json.eligibleTeachers);
        }
      } catch (error) {
        console.error("Failed to fetch teachers", error);
      } finally {
        setLoadingEligible(false);
      }
    }
    fetchEligibleTeachers();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teacherData: "",
      category: "",
      teachingRating: 0,
      communicationRating: 0,
      behaviourRating: 0,
      knowledgeRating: 0,
      practicalRating: 0,
      overallRating: 0,
      subject: "",
      message: "",
      anonymous: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (
      !values.teachingRating ||
      !values.communicationRating ||
      !values.behaviourRating ||
      !values.knowledgeRating ||
      !values.practicalRating ||
      !values.overallRating
    ) {
      toast.error("Please provide ratings for all areas.");
      return;
    }

    // Decode teacher data
    const [teacherId, courseId, batchId, originalTeacherName] = values.teacherData.split("|");

    setSubmitting(true);
    try {
      const res = await fetch("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          teacherId,
          courseId,
          batchId,
          originalTeacherName,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit feedback");

      toast.success("Feedback submitted successfully!");
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ field }: { field: { value: number; onChange: (v: number) => void } }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => field.onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                field.value >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-300"
              } hover:fill-yellow-300 transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loadingEligible) {
    return <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        
        {/* Selection Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <FormField
            control={form.control}
            name="teacherData"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Teacher & Class</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eligibleTeachers.map((t) => (
                      <SelectItem
                        key={`${t.teacherId}|${t.courseId}|${t.batchId}`}
                        value={`${t.teacherId}|${t.courseId}|${t.batchId}|${t.teacherName}`}
                      >
                        {t.teacherName} (Course: {t.courseName}, Batch: {t.batchName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eligibleTeachers.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">You are not currently assigned to any batches.</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Feedback Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Teaching Quality">Teaching Quality</SelectItem>
                    <SelectItem value="Communication">Communication</SelectItem>
                    <SelectItem value="Behaviour">Behaviour</SelectItem>
                    <SelectItem value="Time Management">Time Management</SelectItem>
                    <SelectItem value="Classroom Management">Classroom Management</SelectItem>
                    <SelectItem value="Course Content">Course Content</SelectItem>
                    <SelectItem value="Practical Session">Practical Session</SelectItem>
                    <SelectItem value="Overall Experience">Overall Experience</SelectItem>
                    <SelectItem value="Suggestion">Suggestion</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ratings Area */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4">Rate your experience</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <FormField control={form.control} name="teachingRating" render={({ field }) => (
              <FormItem className="flex items-center justify-between"><FormLabel className="m-0">Teaching Quality</FormLabel><FormControl><StarRating field={field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="communicationRating" render={({ field }) => (
              <FormItem className="flex items-center justify-between"><FormLabel className="m-0">Communication</FormLabel><FormControl><StarRating field={field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="behaviourRating" render={({ field }) => (
              <FormItem className="flex items-center justify-between"><FormLabel className="m-0">Behaviour</FormLabel><FormControl><StarRating field={field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="knowledgeRating" render={({ field }) => (
              <FormItem className="flex items-center justify-between"><FormLabel className="m-0">Knowledge</FormLabel><FormControl><StarRating field={field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="practicalRating" render={({ field }) => (
              <FormItem className="flex items-center justify-between"><FormLabel className="m-0">Practical Guidance</FormLabel><FormControl><StarRating field={field} /></FormControl></FormItem>
            )} />
            <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-slate-100">
              <FormField control={form.control} name="overallRating" render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="m-0 text-base font-bold text-violet-700">Overall Satisfaction</FormLabel>
                  <FormControl><StarRating field={field} /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Great practical examples" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Feedback</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Share your detailed thoughts, suggestions, or concerns here..." 
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="anonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-slate-50/50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Submit Anonymously
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Your name will be hidden from the admin and teacher.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          disabled={submitting || eligibleTeachers.length === 0}
          className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Feedback
        </Button>
      </form>
    </Form>
  );
}
