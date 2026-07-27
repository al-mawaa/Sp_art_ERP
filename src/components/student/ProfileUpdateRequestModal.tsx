"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type FieldOption = {
  value: string;
  label: string;
};

const FIELD_OPTIONS: FieldOption[] = [
  { value: "dob", label: "Date of Birth" },
  { value: "gender", label: "Gender" },
  { value: "bloodGroup", label: "Blood Group" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "fatherMobile", label: "Father's Mobile" },
  { value: "motherMobile", label: "Mother's Mobile" },
  { value: "howYouKnowUs", label: "How You Came to Know Us" },
];

interface ProfileUpdateRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: {
    dob?: string;
    gender?: string;
    bloodGroup?: string;
    phone?: string;
    address?: string;
    fatherMobile?: string;
    motherMobile?: string;
    howYouKnowUs?: string;
  };
  onSubmitted: () => void;
}

export function ProfileUpdateRequestModal({
  open,
  onOpenChange,
  currentProfile,
  onSubmitted,
}: ProfileUpdateRequestModalProps) {
  const [fieldToUpdate, setFieldToUpdate] = useState<string>("");
  const [currentValue, setCurrentValue] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleFieldChange = (value: string) => {
    setFieldToUpdate(value);
    setCurrentValue(getCurrentValue(value));
    setNewValue("");
  };

  const getCurrentValue = (field: string): string => {
    switch (field) {
      case "dob":
        return currentProfile.dob || "";
      case "gender":
        return currentProfile.gender || "";
      case "bloodGroup":
        return currentProfile.bloodGroup || "";
      case "phone":
        return currentProfile.phone || "";
      case "address":
        return currentProfile.address || "";
      case "fatherMobile":
        return currentProfile.fatherMobile || "";
      case "motherMobile":
        return currentProfile.motherMobile || "";
      case "howYouKnowUs":
        return currentProfile.howYouKnowUs || "";
      default:
        return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fieldToUpdate) {
      toast.error("Please select a field to update");
      return;
    }
    
    if (!newValue.trim()) {
      toast.error("Please enter the new value");
      return;
    }
    
    if (!reason.trim()) {
      toast.error("Please provide a reason for the change");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/student/profile-update-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          field: fieldToUpdate,
          currentValue,
          newValue: newValue.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      toast.success(data.message || "Profile update request submitted successfully");
      onOpenChange(false);
      onSubmitted();
      
      // Reset form
      setFieldToUpdate("");
      setCurrentValue("");
      setNewValue("");
      setReason("");
    } catch (error) {
      toast.error((error as Error).message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setFieldToUpdate("");
    setCurrentValue("");
    setNewValue("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Request Profile Update</DialogTitle>
          <DialogDescription>
            Submit a request to update your profile information. The admin will review and approve your request.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field">Field to update</Label>
            <Select value={fieldToUpdate} onValueChange={handleFieldChange}>
              <SelectTrigger id="field" className="rounded-xl">
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fieldToUpdate && (
            <>
              <div className="space-y-2">
                <Label htmlFor="currentValue">Current value</Label>
                <Input
                  id="currentValue"
                  value={currentValue}
                  disabled
                  className="rounded-xl bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newValue">New value</Label>
                <Input
                  id="newValue"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter new value"
                  className="rounded-xl"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for change</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to update this information"
              className="rounded-xl min-h-[100px]"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !fieldToUpdate || !newValue.trim() || !reason.trim()}
              className="rounded-xl"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
