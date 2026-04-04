"use client";

import { DeployFormProvider } from "@/components/ops/deployment/form/deploy-form-context";
import { DeployFormContent } from "@/components/ops/deployment/form/deploy-form-content";
import type { DeployFormProps } from "@/components/ops/deployment/form/deploy-form-types";

export type { DeployFormProps };

export function DeployForm(props: DeployFormProps) {
  return (
    <DeployFormProvider {...props}>
      <DeployFormContent />
    </DeployFormProvider>
  );
}
