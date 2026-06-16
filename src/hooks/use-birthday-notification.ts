"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Hook to show birthday reminder notification on component mount (login/page load)
 * Only shows once per session using a flag
 */
export function useBirthdayNotification() {
  const hasShownNotification = useRef(false);

  useEffect(() => {
    // Prevent showing notification multiple times
    if (hasShownNotification.current) return;

    const fetchAndNotify = async () => {
      try {
        const response = await fetch("/api/dashboard/todays-birthdays", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.warn("Birthday notification fetch failed", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          return;
        }

        const data = await response.json();
        const birthdays = data.birthdays || [];

        if (birthdays.length === 0) {
          return;
        }

        hasShownNotification.current = true;

        if (birthdays.length === 1) {
          const birthday = birthdays[0];
          toast.success(`🎉 Birthday Reminder\n${birthday.name} is turning ${birthday.age} today!\nDon't forget to wish them!`, {
            duration: 5000,
            description: `${birthday.batch}`,
          });
        } else {
          toast.success(
            `🎉 Birthday Reminder\nThere are ${birthdays.length} student birthdays today!`,
            {
              duration: 5000,
              description: birthdays
                .slice(0, 3)
                .map((b) => `• ${b.name} (${b.age})`)
                .join("\n"),
            }
          );
        }
      } catch (error) {
        console.error("Error fetching birthday notification:", error);
      }
    };

    // Add a small delay to ensure the page is fully loaded
    const timer = setTimeout(fetchAndNotify, 500);

    return () => clearTimeout(timer);
  }, []);
}
