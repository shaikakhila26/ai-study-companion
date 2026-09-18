import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import Loading from '../../components/Loading.jsx';
import ErrorBanner from '../../components/ErrorBanner.jsx';
import AdminNav from './AdminNav.jsx';

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/admin/users')
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Users</h1>
      <AdminNav />
      <ErrorBanner message={error} />
      {!users ? (
        <Loading />
      ) : (
        <table className="w-full text-sm card">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Role</th>
              <th className="pb-2">Projects</th>
              <th className="pb-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-slate-100">
                <td className="py-2">
                  <Link to={`/admin/users/${u._id}`} className="text-brand-600 font-medium">
                    {u.name}
                  </Link>
                </td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">{u.projectCount}</td>
                <td className="py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
