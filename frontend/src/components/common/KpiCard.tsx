type Props = {
  label: string;
  value: string | number;
  helper?: string;
};

const KpiCard = ({ label, value, helper }: Props) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
  </div>
);

export default KpiCard;
