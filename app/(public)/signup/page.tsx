import { Suspense } from "react";

import { SignupPageContent } from "./components/signup/signup-page-content";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
}
