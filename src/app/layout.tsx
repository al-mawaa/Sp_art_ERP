/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import { ClientProviders } from "./client-providers";
import "@/index.css";

export const metadata: Metadata = {
  title: "SP Art Hub - ERP System",
  description: "ERP system for SP Art Hub",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
