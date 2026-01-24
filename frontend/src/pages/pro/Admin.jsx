import React, { useState, useEffect } from 'react';
import { User, Package, TrendingUp, DollarSign, Loader, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { getUser, hasRole } from '../../utils/auth';

export const ProAdmin = () => {
  const [data, setData] = useState({
    stats: {},
    users: []
  });
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!hasRole('ADMIN')) {
      return;
    }
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/pro/admin/stats'),
        api.get('/pro/admin/users')
      ]);

      setData({
        stats: statsRes.data,
        users: usersRes.data
      });
    } catch (error) {
      console.error('Erreur admin:', error);
      if (error.response?.status === 403) {
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('ADMIN')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800">Accès refusé</h1>
          <p className="text-red-600">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Administration Pro</h1>
        <p className="mt-2 text-gray-600">Statistiques globales du module Achat/Revente</p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Utilisateurs</p>
              <p className="text-xl font-bold text-blue-600">{data.stats.total_users || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Articles</p>
              <p className="text-xl font-bold text-green-600">{data.stats.total_articles || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-xl font-bold text-purple-600">{data.stats.total_transactions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">CA Total</p>
              <p className="text-xl font-bold text-yellow-600">
                {(data.stats.total_revenue || 0).toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Articles</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">À vendre</span>
              <span className="font-medium text-blue-600">{data.stats.articles_for_sale || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Vendus</span>
              <span className="font-medium text-green-600">{data.stats.articles_sold || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Perdus</span>
              <span className="font-medium text-red-600">{data.stats.articles_lost || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Finances</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Investissement total</span>
              <span className="font-medium text-red-600">-{(data.stats.total_invested || 0).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenus totaux</span>
              <span className="font-medium text-green-600">+{(data.stats.total_earned || 0).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Marge nette</span>
              <span className={`font-medium ${(data.stats.current_margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(data.stats.current_margin || 0) >= 0 ? '+' : ''}{(data.stats.current_margin || 0).toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Potentiel</span>
              <span className="font-medium text-blue-600">+{(data.stats.potential_revenue || 0).toFixed(2)}€</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alertes</h3>
          <div className="space-y-3">
            {data.stats.alerts_count > 0 ? (
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm text-gray-600">
                  {data.stats.alerts_count} retour(s) imminent(s)
                </span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Aucune alerte</div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Utilisateurs ({data.users.length})</h3>
          <p className="text-sm text-gray-600">Utilisateurs ayant utilisé le module Pro</p>
        </div>

        {data.users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        u.is_admin ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.is_admin ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.articles_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.transactions_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur</p>
          </div>
        )}
      </div>
    </div>
  );
};

