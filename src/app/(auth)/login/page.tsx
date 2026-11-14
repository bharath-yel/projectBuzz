import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginFlow } from "@/components/auth/LoginFlow";
import { LoginNotice } from "@/components/auth/LoginNotice";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      {/* Reads the URL, so it renders after the static form around it. */}
      <Suspense fallback={null}>
        <LoginNotice />
      </Suspense>
      <LoginFlow />
    </>
  );
}
