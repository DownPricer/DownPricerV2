import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CreditCard, Globe, Star, Users } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminAbonnementsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsResponse, usersResponse] = await Promise.all([
        api.get('/admin/subscriptions'),
        api.get('/admin/users')
      ]);
      setSubscriptions(subsResponse.data || []);
      setUsers(usersResponse.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const miniSiteSubscriptions = subscriptions.filter(s => s.product === 'minisite');
  const miniSiteUsers = users.filter(u => 
    u.roles.includes('SITE_PLAN_1') || u.roles.includes('SITE_PLAN_10') || u.roles.includes('SITE_PLAN_15')
  );
  const sPlanUsers = users.filter(u => 
    u.roles.includes('S_PLAN_5') || u.roles.includes('S_PLAN_15')
  );

  const getPlanBadge = (roles) => {
    if (roles.includes('SITE_PLAN_15')) return <Badge className="bg-purple-100 text-purple-800">Mini-site 15€</Badge>;
    if (roles.includes('SITE_PLAN_10')) return <Badge className="bg-blue-100 text-blue-800">Mini-site 10€</Badge>;
    if (roles.includes('SITE_PLAN_1')) return <Badge className="bg-green-100 text-green-800">Mini-site 1€</Badge>;
    if (roles.includes('S_PLAN_15')) return <Badge className="bg-orange-100 text-orange-800">S-Plan 15€</Badge>;
    if (roles.includes('S_PLAN_5')) return <Badge className="bg-yellow-100 text-yellow-800">S-Plan 5€</Badge>;
    return null;
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Gestion des abonnements</h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Mini-sites actifs</p>
                  <p className="text-3xl font-bold">{miniSiteUsers.length}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">S-Plan actifs</p>
                  <p className="text-3xl font-bold">{sPlanUsers.length}</p>
                </div>
                <Star className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total abonnés</p>
                  <p className="text-3xl font-bold">{miniSiteUsers.length + sPlanUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Revenus mensuels</p>
                  <p className="text-3xl font-bold text-green-600">
                    {miniSiteUsers.filter(u => u.roles.includes('SITE_PLAN_1')).length * 1 +
                     miniSiteUsers.filter(u => u.roles.includes('SITE_PLAN_10')).length * 10 +
                     miniSiteUsers.filter(u => u.roles.includes('SITE_PLAN_15')).length * 15 +
                     sPlanUsers.filter(u => u.roles.includes('S_PLAN_5')).length * 5 +
                     sPlanUsers.filter(u => u.roles.includes('S_PLAN_15')).length * 15}€
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <p className="text-slate-500">Chargement...</p>
        ) : (
          <Tabs defaultValue="mini-sites">
            <TabsList>
              <TabsTrigger value="mini-sites">
                <Globe className="h-4 w-4 mr-2" />
                Mini-sites ({miniSiteUsers.length})
              </TabsTrigger>
              <TabsTrigger value="s-plan">
                <Star className="h-4 w-4 mr-2" />
                S-Plan ({sPlanUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mini-sites" className="mt-6">
              {miniSiteSubscriptions.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-500">Aucun abonnement Mini-site actif</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {miniSiteSubscriptions.map((sub) => {
                    const getStatusBadge = (status) => {
                      const statusMap = {
                        active: { className: "bg-green-100 text-green-800", label: "Actif" },
                        trialing: { className: "bg-blue-100 text-blue-800", label: "Essai" },
                        canceled: { className: "bg-gray-100 text-gray-800", label: "Annulé" },
                        past_due: { className: "bg-yellow-100 text-yellow-800", label: "En retard" },
                        unpaid: { className: "bg-red-100 text-red-800", label: "Impayé" }
                      };
                      const config = statusMap[status] || { className: "bg-gray-100 text-gray-800", label: status };
                      return <Badge className={config.className}>{config.label}</Badge>;
                    };
                    
                    const getPlanLabel = (plan) => {
                      const planMap = {
                        starter: "Starter (1€/mois)",
                        standard: "Standard (10€/mois)",
                        premium: "Premium (15€/mois)"
                      };
                      return planMap[plan] || plan;
                    };
                    
                    const formatDate = (dateStr) => {
                      if (!dateStr) return "N/A";
                      return new Date(dateStr).toLocaleDateString('fr-FR');
                    };
                    
                    return (
                      <Card key={sub.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{sub.user_name || sub.user_email}</h3>
                              <p className="text-sm text-slate-500">{sub.user_email}</p>
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <Badge className="bg-blue-100 text-blue-800">{getPlanLabel(sub.plan)}</Badge>
                                {getStatusBadge(sub.status)}
                              </div>
                              {sub.current_period_end && (
                                <p className="text-xs text-slate-400 mt-2">
                                  Prochaine échéance : {formatDate(sub.current_period_end)}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">ID Stripe</p>
                              <p className="text-xs font-mono text-slate-400">{sub.stripe_subscription_id?.substring(0, 20)}...</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="s-plan" className="mt-6">
              {sPlanUsers.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-500">Aucun abonné S-Plan</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sPlanUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-lg">{user.first_name} {user.last_name}</h3>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                          {getPlanBadge(user.roles)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};