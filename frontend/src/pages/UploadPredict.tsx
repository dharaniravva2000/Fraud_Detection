import { useMemo, useState } from "react";
import { useExplain, useModels, usePredict } from "../api/hooks";
import UploadDropzone from "../components/common/UploadDropzone";
import Select from "../components/common/Select";
import Slider from "../components/common/Slider";
import { Button } from "../components/common/Button";
import KpiCard from "../components/common/KpiCard";
import DataTable from "../components/common/DataTable";
import ExplainDrawer from "../components/explain/ExplainDrawer";
import { exportRowsToCsv } from "../utils/csv";
import { getDefaultModel } from "../utils/storage";

const UploadPredict = () => {
  const { data: models } = useModels();
  const predictMutation = usePredict();
  const explainMutation = useExplain();

  const [merged, setMerged] = useState<File | null>(null);
  const [transaction, setTransaction] = useState<File | null>(null);
  const [identity, setIdentity] = useState<File | null>(null);
  const [model, setModel] = useState(getDefaultModel());
  const [threshold, setThreshold] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const supportsThreshold = models?.models.find((m) => m.key === model)?.supports_threshold;

  const runPrediction = () => {
    const formData = new FormData();
    formData.append("model", model);
    if (supportsThreshold) formData.append("threshold", String(threshold));
    if (merged) formData.append("file_merged", merged);
    if (transaction) formData.append("file_transaction", transaction);
    if (identity) formData.append("file_identity", identity);

    predictMutation.mutate({ formData, onProgress: setProgress });
  };

  const rows = predictMutation.data?.rows || [];

  const columns = useMemo(
    () => [
      { key: "TransactionID", label: "TransactionID" },
      { key: "pred_label", label: "Prediction" },
      { key: "proba", label: "Probability" },
      {
        key: "row_id",
        label: "Reason",
        render: (row: any) => (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedRow(row.row_id);
              explainMutation.mutate({ model, row_ids: [row.row_id], top_k: 8 });
            }}
          >
            View reason
          </Button>
        ),
      },
    ],
    [explainMutation, model]
  );

  const explanation = explainMutation.data?.explanations?.find((e) => e.row_id === selectedRow);
  const explainError = explainMutation.isError ? (explainMutation.error as Error).message : null;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Upload & Predict</h2>
        <p className="mt-1 text-sm text-slate-500">Upload CSVs to run fraud prediction with your chosen model.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <UploadDropzone label="Merged file" file={merged} onFile={setMerged} />
          <UploadDropzone label="Transaction file" file={transaction} onFile={setTransaction} />
          <UploadDropzone label="Identity file" file={identity} onFile={setIdentity} />
        </div>
        <p className="mt-2 text-xs text-slate-500">Max file size recommended: 200MB. CSV only.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Select
            label="Model"
            value={model}
            onChange={setModel}
            options={
              models?.models.map((m) => ({ label: m.name, value: m.key })) || [
                { label: "XGBoost", value: "xgb" },
                { label: "CatBoost", value: "cat" },
                { label: "Stacking", value: "stack" },
              ]
            }
          />
          {supportsThreshold && (
            <div className="md:col-span-2">
              <Slider label="Threshold" value={threshold} min={0.05} max={0.95} step={0.01} onChange={setThreshold} />
              <p className="mt-1 text-xs text-slate-500">
                Higher threshold reduces fraud flags but increases misses.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button onClick={runPrediction} disabled={predictMutation.isPending}>
            Run Prediction
          </Button>
          {predictMutation.isPending && <span className="text-sm text-slate-500">Uploading... {progress}%</span>}
          {predictMutation.isError && (
            <span className="text-sm text-red-500">{(predictMutation.error as Error).message}</span>
          )}
        </div>
      </section>

      {predictMutation.data && (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total rows" value={predictMutation.data.summary.total} />
            <KpiCard label="Fraud predicted" value={predictMutation.data.summary.fraud_count} />
            <KpiCard label="Non-fraud predicted" value={predictMutation.data.summary.non_fraud_count} />
            <KpiCard label="Fraud rate" value={predictMutation.data.summary.fraud_rate.toFixed(3)} />
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => exportRowsToCsv(rows, "predictions.csv")}>Export CSV</Button>
          </div>

          <DataTable columns={columns as any} rows={rows as any} />
        </section>
      )}

      <ExplainDrawer
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        explanation={explanation}
        isLoading={explainMutation.isPending}
        error={explainError}
      />
    </div>
  );
};

export default UploadPredict;
