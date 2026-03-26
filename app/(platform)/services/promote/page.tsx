import { redirect } from "next/navigation";
import { PROMOTE_PIPELINE_HREF } from "@/lib/config/services/promote.config";

export default function PromoteIndexPage() {
  redirect(PROMOTE_PIPELINE_HREF);
}
