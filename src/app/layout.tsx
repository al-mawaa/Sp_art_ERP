import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import "@/index.css";

const Providers = dynamic(() => import("./providers").then((m) => m.Providers));

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "Little Brushes Studio - ERP System",
  description: "ERP system for Little Brushes Studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
