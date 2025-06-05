import React from 'react';
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
  );
}

export default App;