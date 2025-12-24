import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Props = { data: { precision: number[]; recall: number[] } };

const PrCurve = ({ data }: Props) => {
  const chartData = data.recall.map((recall, idx) => ({ recall, precision: data.precision[idx] }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="recall" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="precision" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PrCurve;
