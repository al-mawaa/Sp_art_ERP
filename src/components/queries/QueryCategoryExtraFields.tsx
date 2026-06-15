"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QueryCategory } from "@/lib/queries/queryCategories";

type ExtraFieldsProps = {
  category: QueryCategory | "";
  register: UseFormRegister<Record<string, string>>;
  errors: FieldErrors<Record<string, string>>;
  setValue: (name: string, value: string) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function QueryCategoryExtraFields({
  category,
  register,
  errors,
  setValue,
}: ExtraFieldsProps) {
  if (!category) return null;

  if (category === "profile_correction") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="requestedChanges">Requested profile changes</Label>
        <Textarea
          id="requestedChanges"
          rows={3}
          className="rounded-xl resize-none"
          placeholder="e.g. Update mobile number and address"
          {...register("requestedChanges")}
        />
        <FieldError message={errors.requestedChanges?.message as string} />
      </div>
    );
  }

  if (category === "switch_batch") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="currentBatchName">Current batch</Label>
          <Input
            id="currentBatchName"
            className="rounded-xl"
            placeholder="Your current batch name"
            {...register("currentBatchName")}
          />
          <FieldError message={errors.currentBatchName?.message as string} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="requestedBatchName">Requested batch</Label>
          <Input
            id="requestedBatchName"
            className="rounded-xl"
            placeholder="Batch you want to switch to"
            {...register("requestedBatchName")}
          />
          <FieldError message={errors.requestedBatchName?.message as string} />
        </div>
      </div>
    );
  }

  if (category === "course_change") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="currentCourseName">Current course</Label>
          <Input
            id="currentCourseName"
            className="rounded-xl"
            placeholder="Your current course"
            {...register("currentCourseName")}
          />
          <FieldError message={errors.currentCourseName?.message as string} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="requestedCourseName">Requested course</Label>
          <Input
            id="requestedCourseName"
            className="rounded-xl"
            placeholder="Course you want to change to"
            {...register("requestedCourseName")}
          />
          <FieldError message={errors.requestedCourseName?.message as string} />
        </div>
      </div>
    );
  }

  if (category === "attendance_correction") {
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="attendanceDate">Attendance date</Label>
          <Input id="attendanceDate" type="date" className="rounded-xl" {...register("attendanceDate")} />
          <FieldError message={errors.attendanceDate?.message as string} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentAttendanceStatus">Current status</Label>
          <Select onValueChange={v => setValue("currentAttendanceStatus", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select current status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="requestedAttendanceStatus">Requested status</Label>
          <Select onValueChange={v => setValue("requestedAttendanceStatus", v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select requested status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={errors.requestedAttendanceStatus?.message as string} />
        </div>
      </div>
    );
  }

  if (category === "fee_related") {
    return (
      <p className="text-xs text-muted-foreground rounded-xl bg-muted/40 p-3">
        Include fee details, pending amount, or payment issue in your remarks below.
      </p>
    );
  }

  return null;
}
