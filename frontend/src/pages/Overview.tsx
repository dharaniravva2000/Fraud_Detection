import { useMemo, useState } from "react";
import { useModels, useTrainingEda } from "../api/hooks";
import { useQueries } from "@tanstack/react-query";
import { apiFetch } from "../api/client";
import KpiCard from "../components/common/KpiCard";
import ConfusionMatrix from "../components/charts/ConfusionMatrix";
import RocCurve from "../components/charts/RocCurve";
import PrCurve from "../components/charts/PrCurve";
import FeatureImportance from "../components/charts/FeatureImportance";
import MissingnessChart from "../components/charts/MissingnessChart";
import DistributionChart from "../components/charts/DistributionChart";
import BarChartCard from "../components/charts/BarChartCard";
import LineChartCard from "../components/charts/LineChartCard";
import Slider from "../components/common/Slider";
import { Badge } from "../components/common/Badge";
import { MetricSet, MetricsResponse } from "../api/types";

const Overview = () => {
  const { data: models } = useModels();
  const { data: trainingEda } = useTrainingEda();
  const [weights, setWeights] = useState({ pr: 0.4, f1: 0.3, recall: 0.2, roc: 0.1 });

  const metricsQueries = useQueries({
    queries:
      models?.models.map((model) => ({
        queryKey: ["metrics", model.key],
        queryFn: () => apiFetch<MetricsResponse>(`/api/v1/metrics?model=${model.key}`),
      })) || [],
  });

  const metricsByModel = useMemo(() => {
    const result: Record<string, MetricsResponse> = {};
    metricsQueries.forEach((query, index) => {
      const key = models?.models[index]?.key;
      if (key && query.data) result[key] = query.data;
    });
    return result;
  }, [metricsQueries, models]);

  const bestModel = useMemo(() => {
    const scores = Object.entries(metricsByModel).map(([key, data]) => {
      const m = data.metrics || {};
      const score =
        (m.pr_auc || 0) * weights.pr +
        (m.f1 || 0) * weights.f1 +
        (m.recall || 0) * weights.recall +
        (m.roc_auc || 0) * weights.roc;
      return { key, score, metrics: m };
    });
    return scores.sort((a, b) => b.score - a.score)[0];
  }, [metricsByModel, weights]);

  const narrative = bestModel
    ? `Best model is ${bestModel.key.toUpperCase()} with strong PR-AUC and balanced recall/precision. It maximizes fraud capture while keeping false alarms controlled.`
    : "Awaiting metrics...";

  const primaryMetrics = metricsByModel[bestModel?.key || ""]?.metrics || ({} as MetricSet);
  const confusion = metricsByModel[bestModel?.key || ""]?.confusion_matrix;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Model Overview</h1>
            <p className="mt-1 text-sm text-slate-500">Data -&gt; Training -&gt; Model comparison -&gt; Inference -&gt; Explainability</p>
          </div>
          {bestModel && <Badge label={`Best model: ${bestModel.key.toUpperCase()}`} />}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="ROC-AUC" value={(primaryMetrics.roc_auc || 0).toFixed(3)} />
          <KpiCard label="PR-AUC" value={(primaryMetrics.pr_auc || 0).toFixed(3)} />
          <KpiCard label="Precision" value={(primaryMetrics.precision || 0).toFixed(3)} />
          <KpiCard label="Recall" value={(primaryMetrics.recall || 0).toFixed(3)} />
          <KpiCard label="F1" value={(primaryMetrics.f1 || 0).toFixed(3)} />
          <KpiCard
            label="Fraud rate (sampled)"
            value={(metricsByModel[bestModel?.key || ""]?.training_stats?.fraud_rate || 0).toFixed(3)}
          />
          <KpiCard
            label="Sampling ratio"
            value={(metricsByModel[bestModel?.key || ""]?.training_stats?.sampling_ratio || 0).toFixed(2)}
          />
          <KpiCard
            label="Last trained"
            value={metricsByModel[bestModel?.key || ""]?.training_stats?.trained_at || "-"}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Confusion Matrix</h3>
          <div className="mt-4">
            {confusion ? (
              <ConfusionMatrix tn={confusion.tn} fp={confusion.fp} fn={confusion.fn} tp={confusion.tp} />
            ) : (
              <p className="text-sm text-slate-500">No confusion matrix available.</p>
            )}
          </div>
        </div>
        <LineChartCard title="ROC Curve">
          {metricsByModel[bestModel?.key || ""]?.curves?.roc ? (
            <RocCurve data={metricsByModel[bestModel?.key || ""]?.curves?.roc!} />
          ) : (
            <p className="text-sm text-slate-500">No ROC data.</p>
          )}
        </LineChartCard>
        <LineChartCard title="PR Curve">
          {metricsByModel[bestModel?.key || ""]?.curves?.pr ? (
            <PrCurve data={metricsByModel[bestModel?.key || ""]?.curves?.pr!} />
          ) : (
            <p className="text-sm text-slate-500">No PR data.</p>
          )}
        </LineChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <BarChartCard title="Feature Importance (Top 20)">
          {metricsByModel[bestModel?.key || ""]?.feature_importance ? (
            <FeatureImportance data={metricsByModel[bestModel?.key || ""]?.feature_importance!} />
          ) : (
            <p className="text-sm text-slate-500">No feature importance data.</p>
          )}
        </BarChartCard>
        <BarChartCard title="Missingness (Top 20)">
          {trainingEda?.missingness ? (
            <MissingnessChart data={trainingEda.missingness.slice(0, 20)} />
          ) : (
            <p className="text-sm text-slate-500">No missingness data.</p>
          )}
        </BarChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <BarChartCard title="Fraud by Hour">
          {trainingEda?.fraud_by_hour ? (
            <DistributionChart
              data={trainingEda.fraud_by_hour.map((item) => ({
                bin: String(item.hour),
                count: Number(item.fraud_rate.toFixed(4)),
              }))}
            />
          ) : (
            <p className="text-sm text-slate-500">No hourly fraud data.</p>
          )}
        </BarChartCard>
        <BarChartCard title="Transaction Amount Distribution">
          {trainingEda?.distributions?.transaction_amount ? (
            <DistributionChart data={trainingEda.distributions.transaction_amount} />
          ) : (
            <p className="text-sm text-slate-500">No distribution data.</p>
          )}
        </BarChartCard>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Model Justification</h3>
        <p className="mt-2 text-sm text-slate-500">Adjust metric weights to see which model wins.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Slider label="PR-AUC weight" value={weights.pr} min={0} max={1} step={0.05} onChange={(v) => setWeights({ ...weights, pr: v })} />
          <Slider label="F1 weight" value={weights.f1} min={0} max={1} step={0.05} onChange={(v) => setWeights({ ...weights, f1: v })} />
          <Slider label="Recall weight" value={weights.recall} min={0} max={1} step={0.05} onChange={(v) => setWeights({ ...weights, recall: v })} />
          <Slider label="ROC-AUC weight" value={weights.roc} min={0} max={1} step={0.05} onChange={(v) => setWeights({ ...weights, roc: v })} />
        </div>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {narrative}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {Object.entries(metricsByModel).map(([key, data]) => (
            <div key={key} className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{key.toUpperCase()}</span>
                {bestModel?.key === key && <Badge label="Best" />}
              </div>
              <div className="mt-2 text-xs text-slate-500">PR-AUC: {(data.metrics?.pr_auc || 0).toFixed(3)}</div>
              <div className="text-xs text-slate-500">F1: {(data.metrics?.f1 || 0).toFixed(3)}</div>
              <div className="text-xs text-slate-500">Recall: {(data.metrics?.recall || 0).toFixed(3)}</div>
              <div className="text-xs text-slate-500">ROC-AUC: {(data.metrics?.roc_auc || 0).toFixed(3)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Overview;
