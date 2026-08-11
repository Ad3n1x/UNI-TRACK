import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Auth from './components/auth/Auth';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

const App = () => {
  return (
    <Routes>
      {/* Home page */}
      <Route index element={<Homepage />} />

      {/* Auth routes */}
      <Route path="auth" element={<Auth />}>
        <Route path="login" element={<LoginForm />} />
        <Route path="register" element={<RegisterForm />} />
      </Route>

      {/* Wildcard route for 404 */}
      {/* <Route path="*" element={<Notfound />} /> */}
    </Routes>
  );
};

export default App;
