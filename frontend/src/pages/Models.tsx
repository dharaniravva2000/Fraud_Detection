import { useMemo, useState } from "react";
import { useModels } from "../api/hooks";
import { useQueries } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import { MetricsResponse } from "../api/types";
import { Button } from "../components/common/Button";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { setDefaultModel, getDefaultModel } from "../utils/storage";

const Models = () => {
  const { data: models } = useModels();
  const [defaultModel, setDefault] = useState(getDefaultModel());

  const metricsQueries = useQueries({
    queries:
      models?.models.map((model) => ({
        queryKey: ["metrics", model.key],
        queryFn: () => apiFetch<MetricsResponse>(`/api/v1/metrics?model=${model.key}`),
      })) || [],
  });

  const rows = useMemo(() => {
    return models?.models.map((model, index) => ({
      key: model.key,
      name: model.name,
      metrics: metricsQueries[index]?.data?.metrics,
    }));
  }, [models, metricsQueries]);

  const radarData = useMemo(() => {
    const labels = ["roc_auc", "pr_auc", "precision", "recall", "f1"];
    return labels.map((label) => {
      const entry: any = { metric: label };
      rows?.forEach((row) => {
        entry[row.key] = (row.metrics as any)?.[label] || 0;
      });
      return entry;
    });
  }, [rows]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Models</h2>
        <p className="mt-1 text-sm text-slate-500">Compare models trained on IEEE-CIS fraud data.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {rows?.map((row) => (
            <div key={row.key} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-lg font-semibold">{row.name}</h3>
              <p className="text-xs text-slate-500">ROC-AUC: {(row.metrics?.roc_auc || 0).toFixed(3)}</p>
              <p className="text-xs text-slate-500">PR-AUC: {(row.metrics?.pr_auc || 0).toFixed(3)}</p>
              <p className="text-xs text-slate-500">Recall: {(row.metrics?.recall || 0).toFixed(3)}</p>
              <Button
                variant={defaultModel === row.key ? "primary" : "secondary"}
                className="mt-3"
                onClick={() => {
                  setDefaultModel(row.key);
                  setDefault(row.key);
                }}
              >
                {defaultModel === row.key ? "Default" : "Select as default"}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Model comparison</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th>Model</th>
                <th>ROC-AUC</th>
                <th>PR-AUC</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1</th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((row) => (
                <tr key={row.key} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 font-semibold">{row.name}</td>
                  <td>{(row.metrics?.roc_auc || 0).toFixed(3)}</td>
                  <td>{(row.metrics?.pr_auc || 0).toFixed(3)}</td>
                  <td>{(row.metrics?.precision || 0).toFixed(3)}</td>
                  <td>{(row.metrics?.recall || 0).toFixed(3)}</td>
                  <td>{(row.metrics?.f1 || 0).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Radar comparison</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              {rows?.map((row) => (
                <Radar
                  key={row.key}
                  name={row.name}
                  dataKey={row.key}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default Models;
