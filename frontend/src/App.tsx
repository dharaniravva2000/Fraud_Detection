import { Routes, Route } from "react-router-dom";
import PageShell from "./components/layout/PageShell";
import Overview from "./pages/Overview";
import UploadPredict from "./pages/UploadPredict";
import AnalysisReport from "./pages/AnalysisReport";
import Models from "./pages/Models";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <PageShell>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/upload" element={<UploadPredict />} />
        <Route path="/analysis" element={<AnalysisReport />} />
        <Route path="/models" element={<Models />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageShell>
  );
};

export default App;
