import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Props = { data: { feature: string; importance: number }[] };

const FeatureImportance = ({ data }: Props) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <XAxis type="number" />
        <YAxis type="category" dataKey="feature" width={120} />
        <Tooltip />
        <Bar dataKey="importance" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default FeatureImportance;
