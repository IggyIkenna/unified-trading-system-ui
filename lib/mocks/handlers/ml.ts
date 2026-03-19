/**
 * handlers/ml.ts — ML service mock handlers.
 *
 * REAL endpoints (exist in openapi.json):
 *   GET /ml-inference-api/api/models — list models
 *   GET /ml-training-api/api/experiments — list experiments
 *   GET /ml-training-api/api/training-runs — list training runs
 *
 * ASPIRATIONAL endpoints (mocked ahead of backend):
 *   GET /api/ml/model-families — model family catalogue
 *   GET /api/ml/versions — model versions with champion/challenger
 *   GET /api/ml/deployments — live model deployments
 *   GET /api/ml/features — feature provenance
 *   GET /api/ml/datasets — dataset snapshots
 */

import { http, HttpResponse } from "msw"
import {
  MODEL_FAMILIES,
  EXPERIMENTS,
  TRAINING_RUNS,
  MODEL_VERSIONS,
  LIVE_DEPLOYMENTS,
  CHAMPION_CHALLENGER_PAIRS,
  FEATURE_PROVENANCE,
  DATASET_SNAPSHOTS,
  FEATURE_SET_VERSIONS,
} from "@/lib/ml-mock-data"
import { getPersonaFromRequest, personaHasEntitlement } from "@/lib/mocks/utils"

export const mlHandlers = [
  http.get("*/api/ml/model-families", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!personaHasEntitlement([...persona.entitlements], "ml-full")) {
      return HttpResponse.json({ families: [], total: 0, locked: true })
    }

    return HttpResponse.json({ families: MODEL_FAMILIES, total: MODEL_FAMILIES.length })
  }),

  http.get("*/api/ml/experiments", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!personaHasEntitlement([...persona.entitlements], "ml-full")) {
      return HttpResponse.json({ experiments: [], total: 0, locked: true })
    }

    return HttpResponse.json({ experiments: EXPERIMENTS, total: EXPERIMENTS.length })
  }),

  http.get("*/api/ml/training-runs", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!personaHasEntitlement([...persona.entitlements], "ml-full")) {
      return HttpResponse.json({ runs: [], total: 0, locked: true })
    }

    return HttpResponse.json({ runs: TRAINING_RUNS, total: TRAINING_RUNS.length })
  }),

  http.get("*/api/ml/versions", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    return HttpResponse.json({
      versions: MODEL_VERSIONS,
      pairs: CHAMPION_CHALLENGER_PAIRS,
    })
  }),

  http.get("*/api/ml/deployments", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    return HttpResponse.json({ deployments: LIVE_DEPLOYMENTS, total: LIVE_DEPLOYMENTS.length })
  }),

  http.get("*/api/ml/features", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    return HttpResponse.json({
      provenance: FEATURE_PROVENANCE,
      featureSets: FEATURE_SET_VERSIONS,
    })
  }),

  http.get("*/api/ml/datasets", ({ request }) => {
    const persona = getPersonaFromRequest(request)
    if (!persona) return HttpResponse.json({ error: "Unauthorized" }, { status: 401 })

    return HttpResponse.json({ datasets: DATASET_SNAPSHOTS, total: DATASET_SNAPSHOTS.length })
  }),
]
