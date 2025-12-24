import Modal from "../common/Modal";
import ReasonList from "./ReasonList";
import { Button } from "../common/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
  explanation?: {
    row_id: string;
    proba: number;
    pred_label: string | number;
    positives: { feature: string; value: number }[];
    negatives: { feature: string; value: number }[];
    category_breakdown?: { category: string; percentage: number }[];
    simple_fields?: { label: string; value: string | number | null; percentage: number }[];
  };
};

const ExplainDrawer = ({ open, onClose, explanation, isLoading, error }: Props) => {
  if (!open) return null;

  const copy = () => {
    const text = JSON.stringify(explanation, null, 2);
    navigator.clipboard.writeText(text);
  };

  const title = explanation ? `Explanation for ${explanation.row_id}` : "Explanation";

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        {isLoading && <div className="text-sm text-slate-500">Loading explanation...</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}
        {!isLoading && !error && explanation && (
          <>
            <div className="text-sm text-slate-500">Probability: {explanation.proba.toFixed(3)}</div>
            {explanation.simple_fields && explanation.simple_fields.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {Number(explanation.pred_label) === 1 ? "Why this looks like fraud" : "Why this looks safe"}
                </h4>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {explanation.simple_fields.map((item) => (
                    <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-slate-600 dark:text-slate-200">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="mt-1 text-slate-500">Value: {item.value ?? "-"}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">Percentages show influence, not absolute fraud probability.</p>
              </div>
            )}
            <Button variant="secondary" onClick={copy}>
              Copy explanation
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ExplainDrawer;
