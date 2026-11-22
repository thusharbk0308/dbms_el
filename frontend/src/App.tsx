import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AssetRegisterPage } from '@/pages/AssetRegisterPage';
import { AssetsListPage } from '@/pages/AssetsListPage';
import { AssetDetailPage } from '@/pages/AssetDetailPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { LicensesPage } from '@/pages/LicensesPage';
import { DisputesPage } from '@/pages/DisputesPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with standard top Navbar & Footer */}
          <Route element={<AppLayout withSidebar={false} />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>

          {/* Authenticated Workspace Routes with Sidebar */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout withSidebar={true} />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/assets/new"
              element={
                <ProtectedRoute allowedRoles={['CREATOR', 'ADMINISTRATOR']}>
                  <AssetRegisterPage />
                </ProtectedRoute>
              }
            />
            <Route path="/assets" element={<AssetsListPage />} />
            <Route path="/assets/:id" element={<AssetDetailPage />} />
            <Route path="/licenses" element={<LicensesPage />} />
            <Route path="/disputes" element={<DisputesPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all 404 */}
          <Route element={<AppLayout withSidebar={false} />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
