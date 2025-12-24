import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Props = { data: { fpr: number[]; tpr: number[] } };

const RocCurve = ({ data }: Props) => {
  const chartData = data.fpr.map((fpr, idx) => ({ fpr, tpr: data.tpr[idx] }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="fpr" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="tpr" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RocCurve;
