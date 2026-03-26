"use client";

import { ChampionChallengerTab } from "@/components/promote/champion-challenger-tab";
import { PromoteLifecycleStagePage } from "@/components/promote/promote-lifecycle-stage-page";

export default function PromoteChampionPage() {
  return (
    <PromoteLifecycleStagePage>
      {(strategy) => <ChampionChallengerTab strategy={strategy} />}
    </PromoteLifecycleStagePage>
  );
}
