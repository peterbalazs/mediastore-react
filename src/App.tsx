import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MediaListPage from './pages/MediaListPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MediaListPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
