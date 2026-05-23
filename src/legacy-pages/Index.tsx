"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { roleHome } from "@/contexts/AuthContext.exports";

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      router.push(roleHome(user.role));
    } else {
      router.push("/login");
    }
  }, [user, router]);
  
  return null;
}
