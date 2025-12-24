import { ReactNode } from "react";

const LineChartCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
    <div className="mt-3">{children}</div>
  </div>
);

export default LineChartCard;
