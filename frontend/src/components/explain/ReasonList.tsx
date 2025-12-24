type Props = {
  title: string;
  items: { feature: string; value: number }[];
};

const ReasonList = ({ title, items }: Props) => (
  <div>
    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
    <div className="mt-2 space-y-2">
      {items.map((item) => (
        <div key={item.feature} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800">
          <span>{item.feature}</span>
          <span className="font-semibold text-slate-600 dark:text-slate-200">{item.value.toFixed(3)}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ReasonList;
