import { useMemo, useState } from "react";
import { useUploadEda } from "../api/hooks";
import UploadDropzone from "../components/common/UploadDropzone";
import { Button } from "../components/common/Button";
import MissingnessChart from "../components/charts/MissingnessChart";
import DistributionChart from "../components/charts/DistributionChart";

const bytesToMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

const AnalysisReport = () => {
  const [merged, setMerged] = useState<File | null>(null);
  const [transaction, setTransaction] = useState<File | null>(null);
  const [identity, setIdentity] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadEda = useUploadEda();

  const runAnalysis = () => {
    const formData = new FormData();
    if (merged) formData.append("file_merged", merged);
    if (transaction) formData.append("file_transaction", transaction);
    if (identity) formData.append("file_identity", identity);
    uploadEda.mutate({ formData, onProgress: setProgress });
  };

  const report = uploadEda.data;

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analysis-report.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const toBins = (items?: { label: string; value: number }[]) =>
    items?.map((item) => ({ bin: item.label, count: item.value })) || [];

  const topMissing = report?.missingness?.top || [];

  const statsRows = useMemo(() => {
    if (!report?.stats) return [];
    return Object.entries(report.stats)
      .filter(([, value]) => value)
      .map(([key, value]) => ({ key, ...(value as any) }));
  }, [report?.stats]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Uploaded Dataset Analysis</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload your CSV to see how the system interprets it, what quality risks exist, and how it aligns with the
          fraud model pipeline.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <UploadDropzone label="Merged file" file={merged} onFile={setMerged} />
          <UploadDropzone label="Transaction file" file={transaction} onFile={setTransaction} />
          <UploadDropzone label="Identity file" file={identity} onFile={setIdentity} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button onClick={runAnalysis} disabled={uploadEda.isPending}>
            Run Analysis
          </Button>
          {uploadEda.isPending && <span className="text-sm text-slate-500">Uploading... {progress}%</span>}
          {uploadEda.isError && <span className="text-sm text-red-500">{(uploadEda.error as Error).message}</span>}
          {report && (
            <>
              <Button variant="secondary" onClick={downloadJson}>
                Download Report (JSON)
              </Button>
              <Button variant="ghost" onClick={() => window.print()}>
                Print View
              </Button>
            </>
          )}
        </div>
      </section>

      {report && (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Rows</p>
              <p className="text-2xl font-semibold">{report.summary.rows}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Columns</p>
              <p className="text-2xl font-semibold">{report.summary.columns}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Dataset type</p>
              <p className="text-2xl font-semibold capitalize">{report.summary.dataset_type || "unknown"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">File size</p>
              <p className="text-2xl font-semibold">{bytesToMb(report.summary.file_size_bytes)} MB</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-semibold">Dataset overview</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Upload time</p>
                <p className="text-sm">{report.summary.upload_timestamp}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">TransactionID present</p>
                <p className="text-sm">{report.summary.transaction_id_present ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Numeric / Categorical / Binary</p>
                <p className="text-sm">
                  {report.summary.numeric_columns} / {report.summary.categorical_columns} / {report.summary.binary_columns}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Files detected</p>
                <p className="text-sm">
                  {report.summary.files.map((file) => file.filename).join(", ") || "-"}
                </p>
              </div>
            </div>
          </section>

          {report.warnings && report.warnings.length > 0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/20">
              <h3 className="text-sm font-semibold">Data quality warnings</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {report.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Missingness (Top 20)</h3>
              <p className="mt-1 text-xs text-slate-500">
                Overall missing: {report.missingness?.overall_missing_pct.toFixed(1)}% | Rows with missing values: {report.missingness?.rows_with_missing_pct.toFixed(1)}%
              </p>
              {report.missingness ? (
                <MissingnessChart data={topMissing.map((item) => ({ feature: item.feature, missing: item.missing }))} />
              ) : (
                <p className="text-sm text-slate-500">No missingness data.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Schema alignment</h3>
              <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Present required</p>
                  <p>{report.schema_alignment?.present_required.join(", ") || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Missing required</p>
                  <p>{report.schema_alignment?.missing_required.join(", ") || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created by backend</p>
                  <p>{report.schema_alignment?.created_columns.join(", ") || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ignored columns</p>
                  <p>{report.schema_alignment?.ignored_columns.join(", ") || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Final feature count</p>
                  <p>{report.schema_alignment?.final_feature_count ?? "-"}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Numeric summary</h3>
            {statsRows.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2">Feature</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Mean</th>
                      <th>Median</th>
                      <th>Std</th>
                      <th>Outliers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsRows.map((row) => (
                      <tr key={row.key} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-2 font-semibold">{row.key}</td>
                        <td>{row.min.toFixed(2)}</td>
                        <td>{row.max.toFixed(2)}</td>
                        <td>{row.mean.toFixed(2)}</td>
                        <td>{row.median.toFixed(2)}</td>
                        <td>{row.std.toFixed(2)}</td>
                        <td>{row.outliers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No numeric summary available.</p>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transaction Amount</h3>
              {report.distributions?.transaction_amount ? (
                <DistributionChart data={toBins(report.distributions.transaction_amount)} />
              ) : (
                <p className="text-sm text-slate-500">No distribution data.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transaction Amount (log)</h3>
              {report.distributions?.transaction_amount_log ? (
                <DistributionChart data={toBins(report.distributions.transaction_amount_log)} />
              ) : (
                <p className="text-sm text-slate-500">No log distribution data.</p>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transactions by Hour</h3>
              {report.distributions?.hour ? (
                <DistributionChart data={toBins(report.distributions.hour)} />
              ) : (
                <p className="text-sm text-slate-500">No hour distribution.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Device Type</h3>
              {report.distributions?.device_type ? (
                <DistributionChart data={toBins(report.distributions.device_type)} />
              ) : (
                <p className="text-sm text-slate-500">No device type distribution.</p>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">ProductCD</h3>
              {report.distributions?.product_cd ? (
                <DistributionChart data={toBins(report.distributions.product_cd)} />
              ) : (
                <p className="text-sm text-slate-500">No ProductCD distribution.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email Domains</h3>
              {report.distributions?.email_domain ? (
                <DistributionChart data={toBins(report.distributions.email_domain)} />
              ) : (
                <p className="text-sm text-slate-500">No email domain distribution.</p>
              )}
            </div>
          </section>

          {report.identity_analysis && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Identity feature analysis</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">ID columns present</p>
                  <p className="text-lg font-semibold">{report.identity_analysis.id_columns_present}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ID missing %</p>
                  <p className="text-lg font-semibold">{report.identity_analysis.id_missing_percent.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Rows with many missing IDs</p>
                  <p className="text-lg font-semibold">{report.identity_analysis.rows_with_many_missing_ids}</p>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Duplicate TransactionID</p>
              <p className="text-xl font-semibold">{report.duplicates?.transaction_id_duplicates ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500">TransactionAmt outliers (IQR)</p>
              <p className="text-xl font-semibold">{report.stats?.TransactionAmt?.outliers ?? 0}</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AnalysisReport;
