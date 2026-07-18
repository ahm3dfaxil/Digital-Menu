import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import CustomerMenu from "./pages/CustomerMenu";

// Dashboard Pages
import DashboardOverview from "./pages/DashboardOverview";
import RestaurantDetails from "./pages/RestaurantDetails";
import CategoryManagement from "./pages/CategoryManagement";
import MenuManagement from "./pages/MenuManagement";
import QRCodePage from "./pages/QRCodePage";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Marketing/Auth Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Public Customer Restaurant Menu */}
            <Route path="/menu/:restaurantId" element={<CustomerMenu />} />

            {/* Protected Owner Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="restaurant" element={<RestaurantDetails />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="qr-code" element={<QRCodePage />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="settings" element={<Settings />} />
              {/* Fallback inside dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* General Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
