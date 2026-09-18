import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import SpaceList from './pages/SpaceList.jsx';
import SpaceDetail from './pages/SpaceDetail.jsx';
import ProjectDashboard from './pages/ProjectDashboard.jsx';
import Materials from './pages/Materials.jsx';
import Tutor from './pages/Tutor.jsx';
import Quiz from './pages/Quiz.jsx';
import Growth from './pages/Growth.jsx';
import ProjectAnalytics from './pages/ProjectAnalytics.jsx';
import GlobalAnalytics from './pages/GlobalAnalytics.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminUserDetail from './pages/admin/AdminUserDetail.jsx';
import AdminActivity from './pages/admin/AdminActivity.jsx';
import AdminAIUsage from './pages/admin/AdminAIUsage.jsx';
import AdminJobs from './pages/admin/AdminJobs.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/spaces" element={<SpaceList />} />
        <Route path="/spaces/:spaceId" element={<SpaceDetail />} />
        <Route path="/projects/:projectId" element={<ProjectDashboard />} />
        <Route path="/projects/:projectId/materials" element={<Materials />} />
        <Route path="/projects/:projectId/tutor" element={<Tutor />} />
        <Route path="/projects/:projectId/quiz" element={<Quiz />} />
        <Route path="/projects/:projectId/growth" element={<Growth />} />
        <Route path="/projects/:projectId/analytics" element={<ProjectAnalytics />} />
        <Route path="/analytics" element={<GlobalAnalytics />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminOverview />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:userId"
          element={
            <AdminRoute>
              <AdminUserDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/activity"
          element={
            <AdminRoute>
              <AdminActivity />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ai-usage"
          element={
            <AdminRoute>
              <AdminAIUsage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <AdminRoute>
              <AdminJobs />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
