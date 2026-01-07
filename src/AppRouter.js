// src/AppRouter.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';

const PrivateRoute = ({ component: Component }) => {
    const token = localStorage.getItem('token');
    return token ? <Component /> : <Navigate to="/login" replace />;
};

function AppRouter() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<PrivateRoute component={Home} />} />
                <Route path="/analysis" element={<PrivateRoute component={Home} />} />
                <Route path="/user-management" element={<PrivateRoute component={UserManagement} />} />
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
        </Router>
    );
}

export default AppRouter;