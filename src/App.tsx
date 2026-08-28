import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Browser from './pages/Browser';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Browser />} />
      </Routes>
    </BrowserRouter>
  );
}
