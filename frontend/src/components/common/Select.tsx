type Option = { label: string; value: string };

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
};

const Select = ({ label, value, onChange, options }: Props) => (
  <label className="block text-sm">
    {label && <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export default Select;
