// ========== MAIN APP COMPONENT ==========
// Route configuration with protected dashboard & authentication pages
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import { useState } from 'react';
import PricingPage from './pages/Pricingpage';
import SuccessPage from './pages/SuccessPage';

// ========== APP ROUTER & AUTH STATE ==========
// Token stored in localStorage, protected routes redirect to login
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  return(
    <BrowserRouter>
      {/* ========== ROUTE DEFINITIONS ========== */}
      {/* Dashboard protected: requires valid token */}
      <Routes>
          <Route path="/login" element={<LoginPage setToken={setToken} />} />
          <Route path="/register" element={<RegisterPage setToken={setToken} />} />
          <Route path="/dashboard" element={token ? <Dashboard token={token} logout={logout} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;