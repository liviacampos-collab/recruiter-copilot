import { Navigate, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/pages/HomePage";
import { ResultsPage } from "@/pages/ResultsPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/input" element={<Navigate to="/" replace />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </AppShell>
  );
}
