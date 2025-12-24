import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Props = { data: { feature: string; missing: number }[] };

const MissingnessChart = ({ data }: Props) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <XAxis type="number" />
        <YAxis type="category" dataKey="feature" width={120} />
        <Tooltip />
        <Bar dataKey="missing" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default MissingnessChart;
