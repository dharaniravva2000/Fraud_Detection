import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, apiUpload } from "./client";
import {
  HealthResponse,
  ModelsResponse,
  MetricsResponse,
  EdaTrainingResponse,
  PredictResponse,
  ExplainResponse,
  UploadEdaResponse,
} from "./types";

export const useHealth = () =>
  useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<HealthResponse>("/api/v1/health"),
    refetchInterval: 15000,
  });

export const useModels = () =>
  useQuery({
    queryKey: ["models"],
    queryFn: () => apiFetch<ModelsResponse>("/api/v1/models"),
  });

export const useMetrics = (modelKey: string) =>
  useQuery({
    queryKey: ["metrics", modelKey],
    queryFn: () => apiFetch<MetricsResponse>(`/api/v1/metrics?model=${modelKey}`),
    enabled: !!modelKey,
  });

export const useTrainingEda = () =>
  useQuery({
    queryKey: ["eda", "training"],
    queryFn: () => apiFetch<EdaTrainingResponse>("/api/v1/eda/training"),
  });

export const usePredict = () =>
  useMutation({
    mutationFn: ({ formData, onProgress }: { formData: FormData; onProgress?: (p: number) => void }) =>
      apiUpload<PredictResponse>({ path: "/api/v1/predict", formData, onProgress }),
  });

export const useExplain = () =>
  useMutation({
    mutationFn: (payload: { model: string; row_ids: string[]; top_k: number }) =>
      apiFetch<ExplainResponse>("/api/v1/explain", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

export const useUploadEda = () =>
  useMutation({
    mutationFn: ({ formData, onProgress }: { formData: FormData; onProgress?: (p: number) => void }) =>
      apiUpload<UploadEdaResponse>({ path: "/api/v1/eda/upload", formData, onProgress }),
  });
