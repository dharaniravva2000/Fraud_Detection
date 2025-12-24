type Props = {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
};

const cellClass = "flex h-24 flex-col items-center justify-center rounded-xl text-sm font-semibold";

const ConfusionMatrix = ({ tn, fp, fn, tp }: Props) => {
  const max = Math.max(tn, fp, fn, tp, 1);
  const shade = (value: number) => Math.round((value / max) * 200 + 30);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className={cellClass} style={{ background: `rgba(34,197,94,${shade(tn) / 255})` }}>
        <span>TN</span>
        <span>{tn}</span>
      </div>
      <div className={cellClass} style={{ background: `rgba(239,68,68,${shade(fp) / 255})` }}>
        <span>FP</span>
        <span>{fp}</span>
      </div>
      <div className={cellClass} style={{ background: `rgba(239,68,68,${shade(fn) / 255})` }}>
        <span>FN</span>
        <span>{fn}</span>
      </div>
      <div className={cellClass} style={{ background: `rgba(34,197,94,${shade(tp) / 255})` }}>
        <span>TP</span>
        <span>{tp}</span>
      </div>
    </div>
  );
};

export default ConfusionMatrix;
