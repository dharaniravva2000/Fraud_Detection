type Props = {
  label?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

const Slider = ({ label, value, min, max, step, onChange }: Props) => (
  <label className="block text-sm">
    {label && <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-brand-600"
    />
    <div className="mt-1 flex justify-between text-xs text-slate-500">
      <span>{min.toFixed(2)}</span>
      <span>{value.toFixed(2)}</span>
      <span>{max.toFixed(2)}</span>
    </div>
  </label>
);

export default Slider;
