"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResetPasswordPage from "@/components/ResetPasswordPage";

function Inner() {
  const token = useSearchParams().get("token") || "";
  return <ResetPasswordPage token={token} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
