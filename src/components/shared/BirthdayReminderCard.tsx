"use client";

import { useEffect, useState } from "react";
import { Cake } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { StatCard } from "@/components/shared/StatCard";

interface BirthdayData {
  id: string;
  name: string;
  dob: string;
  age: number;
  batch: string;
  photo?: string;
  email?: string;
}

export function BirthdayReminderCard() {
  const [birthdays, setBirthdays] = useState<BirthdayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard/todays-birthdays", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Unauthorized to view birthday reminders");
            return;
          }
          throw new Error("Failed to fetch birthday reminders");
        }

        const data = await response.json();
        setBirthdays(data.birthdays || []);
      } catch (err) {
        console.error("Error fetching birthdays:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch birthday reminders"
        );
        setBirthdays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
  }, []);

  if (loading) {
    return (
      <div className="card-soft p-5">
        <div className="flex items-center gap-3 mb-4">
          <Cake className="w-5 h-5" />
          <h3 className="font-display font-bold text-lg">Today's Birthdays 🎂</h3>
        </div>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-soft p-5">
        <div className="flex items-center gap-3 mb-4">
          <Cake className="w-5 h-5" />
          <h3 className="font-display font-bold text-lg">Today's Birthdays 🎂</h3>
        </div>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (birthdays.length === 0) {
    return (
      <div className="card-soft p-5">
        <div className="flex items-center gap-3 mb-4">
          <Cake className="w-5 h-5" />
          <h3 className="font-display font-bold text-lg">Today's Birthdays 🎂</h3>
        </div>
        <div className="text-sm text-muted-foreground">No student birthdays today.</div>
      </div>
    );
  }

  return (
    <div className="card-soft overflow-hidden">
      {/* Header with count */}
      <div className="p-5 border-b border-border/60 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-200 dark:bg-orange-800 p-2 text-orange-600 dark:text-orange-300">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Today's Birthdays 🎂</h3>
              <p className="text-xs text-muted-foreground">
                {birthdays.length} student{birthdays.length !== 1 ? "s" : ""} celebrating
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {birthdays.length}
          </div>
        </div>
      </div>

      {/* Birthday list */}
      <div className="divide-y divide-border/60">
        {birthdays.map((birthday) => (
          <div
            key={birthday.id}
            className="p-4 hover:bg-muted/40 transition-colors flex items-center gap-4"
          >
            <Avatar
              name={birthday.name}
              src={birthday.photo}
              size={48}
              className="ring-2 ring-orange-200 dark:ring-orange-800"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{birthday.name}</div>
              <div className="text-xs text-muted-foreground">
                Batch: {birthday.batch && birthday.batch.trim() ? birthday.batch : "Not Assigned"}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Turning {Number.isFinite(birthday.age) ? birthday.age : 0} years
              </div>
            </div>
            <div className="text-2xl">🎉</div>
          </div>
        ))}
      </div>

      {/* Footer wish message */}
      <div className="px-5 py-3 bg-muted/40 border-t border-border/60 text-xs text-muted-foreground text-center">
        ✨ Don't forget to wish them a happy birthday! ✨
      </div>
    </div>
  );
}
