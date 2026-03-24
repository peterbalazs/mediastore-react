import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MediaListPage from './pages/MediaListPage';
import ImportJobsPage from './pages/ImportJobsPage';
import MusicPage from './pages/MusicPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MediaListPage />} />
        <Route path="/import-jobs" element={<ImportJobsPage />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
