"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, ArrowLeft, Save, Smartphone, Mail, Bell as BellIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

const notificationSchema = z.object({
  title: z.string().min(3, "Title is required"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long"),
  type: z.string().min(1, "Notification type is required"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  targetRoles: z.array(z.string()).default([]),
  deliveryChannels: z.array(z.string()).min(1, "Select at least one delivery channel"),
  scheduledAt: z.string().optional(),
  status: z.enum(["Draft", "Sent", "Scheduled"]).default("Sent"),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function CreateNotificationPage() {
  const router = useRouter();

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      subject: "",
      message: "",
      type: "General Announcement",
      priority: "Medium",
      targetRoles: [],
      deliveryChannels: ["In-app"],
      status: "Sent",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.notification.status === "Draft" ? "Draft saved successfully!" : "Notification sent successfully!");
      router.push("/admin/notifications/list");
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const onSubmit = (data: NotificationFormValues) => {
    if (data.scheduledAt) {
      data.status = "Scheduled";
    }
    mutation.mutate(data);
  };

  const saveDraft = () => {
    form.setValue("status", "Draft");
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/notifications"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <PageHeader title="Create Notification" subtitle="Compose and send a new announcement" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="card-soft">
            <CardContent className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter notification title" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="General Announcement">General Announcement</SelectItem>
                          <SelectItem value="Holiday Notice">Holiday Notice</SelectItem>
                          <SelectItem value="Meeting">Meeting</SelectItem>
                          <SelectItem value="Exam">Exam</SelectItem>
                          <SelectItem value="Fee Reminder">Fee Reminder</SelectItem>
                          <SelectItem value="System Alert">System Alert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="If sending via email" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Body</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={6} 
                        placeholder="Type your complete message here..." 
                        {...field} 
                        className="rounded-xl resize-none" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Target Audience (Roles)</h3>
                <div className="flex flex-wrap gap-4">
                  {["Student", "Teacher", "Senior_Teacher", "HR", "Admin"].map((role) => (
                    <FormField
                      key={role}
                      control={form.control}
                      name="targetRoles"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(role)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, role])
                                  : field.onChange(field.value?.filter((value) => value !== role))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{role.replace("_", " ")}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Delivery Channels</h3>
                <div className="flex gap-4">
                  {[{ id: "In-app", icon: BellIcon, label: "In-App Notification" }, { id: "Email", icon: Mail, label: "Email" }].map((channel) => (
                    <FormField
                      key={channel.id}
                      control={form.control}
                      name="deliveryChannels"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 border rounded-xl p-3 bg-muted/20">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(channel.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, channel.id])
                                  : field.onChange(field.value?.filter((value) => value !== channel.id))
                              }}
                            />
                          </FormControl>
                          <channel.icon className="w-4 h-4 text-muted-foreground" />
                          <FormLabel className="font-normal text-sm cursor-pointer">{channel.label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Note: Email requires users to have a valid email address.</p>
              </div>

               <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem className="md:w-1/2">
                      <FormLabel>Schedule for Later (Optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} className="rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
             <Button type="button" variant="outline" className="rounded-xl" onClick={saveDraft} disabled={mutation.isPending}>
               <Save className="w-4 h-4 mr-2" /> Save Draft
             </Button>
             <Button type="submit" className="rounded-xl gradient-primary text-white border-0" disabled={mutation.isPending}>
               <Send className="w-4 h-4 mr-2" /> {mutation.isPending ? "Processing..." : "Send Notification"}
             </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
