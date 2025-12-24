import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Props = { data: { bin: string; count: number }[] };

const DistributionChart = ({ data }: Props) => (
  <div className="h-56">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="bin" hide />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#64748b" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default DistributionChart;
