"use client";

import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, User, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SETTINGS_SECTIONS = [
  {
    href: "/settings/api-keys",
    icon: Key,
    title: "Venue API Keys",
    description: "Connect your exchange accounts to enable trading, reports, and analytics.",
    badge: "Required",
  },
  {
    href: "#",
    icon: User,
    title: "Profile",
    description: "Your name, email, and organisation details.",
    badge: "Coming Soon",
    disabled: true,
  },
  {
    href: "/settings/notifications",
    icon: Bell,
    title: "Notifications",
    description: "Configure alert delivery channels, routing rules, and mobile push.",
    badge: "New",
  },
];

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <PageHeader title="Settings" description="Manage your account, API keys, and preferences." />
      <div className="space-y-3">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const Wrapper = section.disabled ? "div" : Link;
          return (
            <Wrapper key={section.title} href={section.href}>
              <Card
                className={`transition-colors ${section.disabled ? "opacity-50" : "hover:border-primary/30 cursor-pointer"}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription className="text-xs">{section.description}</CardDescription>
                    </div>
                    <Badge variant={section.badge === "Required" ? "default" : "secondary"} className="text-xs">
                      {section.badge}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
