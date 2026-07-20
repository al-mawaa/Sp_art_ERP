"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, MessageSquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { QueryCategoryExtraFields } from "@/components/queries/QueryCategoryExtraFields";
import {
  buildCreateQuerySchema,
  QUERY_CATEGORIES,
  QUERY_CATEGORY_LABELS,
  type QueryCategory,
} from "@/lib/queries/queryCategories";

type QueryRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  defaultEmail: string;
  nameField: string;
  emailField: string;
  apiUrl: string;
  onSubmitted: () => void;
};

export function QueryRequestModal({
  open,
  onOpenChange,
  defaultName,
  defaultEmail,
  nameField,
  emailField,
  apiUrl,
  onSubmitted,
}: QueryRequestModalProps) {
  const schema = buildCreateQuerySchema(nameField, emailField);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: {
      [nameField]: defaultName,
      [emailField]: defaultEmail,
      category: "",
    },
  });

  const category = watch("category") as QueryCategory | "";

  useEffect(() => {
    if (open) {
      reset({
        [nameField]: defaultName,
        [emailField]: defaultEmail,
        category: "",
        requestedChanges: "",
        currentBatchName: "",
        requestedBatchName: "",
        currentCourseName: "",
        requestedCourseName: "",
        attendanceDate: "",
        currentAttendanceStatus: "",
        requestedAttendanceStatus: "",
      });
    }
  }, [open, defaultName, defaultEmail, nameField, emailField, reset]);

  const onSubmit = async (values: Record<string, string>) => {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await parseJsonResponse<{
        error?: string;
        message?: string;
        data?: { emailWarnings?: string[] };
      }>(res);
      if (!res.ok) throw new Error(json.error || "Failed to submit query");

      const warnings = json.data?.emailWarnings ?? [];
      if (warnings.length) {
        toast.warning("Query saved. Admin email could not be sent — check SMTP in .env");
      } else {
        toast.success(json.message || "Query submitted successfully");
      }
      onOpenChange(false);
      onSubmitted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md border-border/80 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Request Query Form
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="query-name">Name</Label>
            <Input id="query-name" className="rounded-xl" {...register(nameField)} />
            {errors[nameField] && (
              <p className="text-xs text-destructive">{errors[nameField]?.message as string}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="query-email">Email</Label>
            <Input id="query-email" type="email" className="rounded-xl" {...register(emailField)} />
            {errors[emailField] && (
              <p className="text-xs text-destructive">{errors[emailField]?.message as string}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={v => setValue("category", v, { shouldValidate: true })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {QUERY_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {QUERY_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message as string}</p>
            )}
          </div>

          <QueryCategoryExtraFields
            category={category}
            register={register}
            errors={errors}
            setValue={setValue}
          />


          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl flex-1 gradient-primary text-white border-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
