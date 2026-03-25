"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, LogOut } from "lucide-react";
import Link from "next/link";

export default function PendingPage() {
  const { user, logout } = useAuth();
  const status = user?.status ?? "pending_approval";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              {status === "pending_approval" && (
                <>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                    <Clock className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-2xl">
                    Application Under Review
                  </CardTitle>
                  <CardDescription>
                    Your account is being reviewed by our team. You will receive
                    an email once a decision has been made.
                  </CardDescription>
                </>
              )}
              {status === "rejected" && (
                <>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <CardTitle className="text-2xl">
                    Application Not Approved
                  </CardTitle>
                  <CardDescription>
                    Unfortunately your application was not approved at this time.
                    Please contact support if you have questions.
                  </CardDescription>
                </>
              )}
              {status === "active" && user?.authorized === false && (
                <>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                    <CheckCircle2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-2xl">
                    No Application Access
                  </CardTitle>
                  <CardDescription>
                    Your account is active but you do not yet have access to this
                    application. Please contact your administrator to request
                    access.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.email && (
                <p className="text-sm text-muted-foreground text-center">
                  Signed in as{" "}
                  <span className="font-medium">{user.email}</span>
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                <Link href="/" className="w-full">
                  <Button variant="ghost" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
