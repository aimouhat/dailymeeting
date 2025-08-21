import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ActionForm from './pages/ActionForm';
import { ActionProvider } from './context/ActionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import ActionHistoryPage from './pages/ActionHistory';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ActionProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/form" element={<PrivateRoute><ActionForm /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><ActionHistoryPage /></PrivateRoute>} />
          </Routes>
        </Router>
      </ActionProvider>
    </AuthProvider>
=======
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ActionForm from './pages/ActionForm';
import { ActionProvider } from './context/ActionContext';

function App() {
  return (
    <ActionProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/form" element={<ActionForm />} />
        </Routes>
      </Router>
    </ActionProvider>
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
  );
}

export default App;