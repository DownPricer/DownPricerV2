import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, DollarSign, Loader } from 'lucide-react';
import api from '../../utils/api';

export const ProPortfolio = () => {
  const [data, setData] = useState({
    transactions: [],
    articles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, articlesRes] = await Promise.all([
        api.get('/pro/transactions'),
        api.get('/pro/articles-light')
      ]);

      setData({
        transactions: transactionsRes.data,
        articles: articlesRes.data
      });
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 403) {
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Calculs locaux
  const totalPurchases = data.transactions
    .filter(t => t.type === 'achat')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSales = data.transactions
    .filter(t => t.type === 'vente')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalSales - totalPurchases;

  const potentialRevenue = data.articles
    .filter(a => a.status === 'À vendre')
    .reduce((sum, a) => sum + a.estimated_sale_price, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mon portefeuille</h1>
        <p className="mt-2 text-gray-600">Suivi de vos achats et revenus</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <TrendingUp className="h-6 w-6 text-red-600 transform rotate-180" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Achats</p>
              <p className="text-xl font-bold text-red-600">-{totalPurchases.toFixed(2)}€</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenus</p>
              <p className="text-xl font-bold text-green-600">+{totalSales.toFixed(2)}€</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Wallet className={`h-6 w-6 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Solde Net</p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance >= 0 ? '+' : ''}{balance.toFixed(2)}€
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Potentiel</p>
              <p className="text-xl font-bold text-blue-600">+{potentialRevenue.toFixed(2)}€</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transactions récentes</h3>
        </div>
        
        {data.transactions.length > 0 ? (
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {data.transactions.slice(0, 50).map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.type === 'achat' ? 'bg-red-100 text-red-800' :
                    transaction.type === 'vente' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.type}
                  </span>
                  <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}€
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune transaction</p>
          </div>
        )}
      </div>

      {/* Info sur la logique */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Logique du portefeuille</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Achats</strong> : Montants négatifs (investissements)</li>
          <li>• <strong>Revenus</strong> : Montants positifs (ventes réalisées)</li>
          <li>• <strong>Solde</strong> : Revenus - Achats = Bénéfice net</li>
          <li>• <strong>Potentiel</strong> : Revenus estimés des articles à vendre</li>
        </ul>
      </div>
    </div>
  );
};

