import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Trash2, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const ALL_ROLES = [
  { value: 'CLIENT', label: 'Client', description: 'Peut créer des demandes' },
  { value: 'SELLER', label: 'Vendeur', description: 'Accès espace vendeur' },
  { value: 'SITE_PLAN_1', label: 'Mini-site 1€', description: 'Plan mini-site basique' },
  { value: 'SITE_PLAN_10', label: 'Mini-site 10€', description: 'Plan mini-site standard' },
  { value: 'SITE_PLAN_15', label: 'Mini-site 15€', description: 'Plan mini-site premium' },
  { value: 'S_PLAN_5', label: 'S-Plan 5€', description: 'Abonnement communauté 5€' },
  { value: 'S_PLAN_15', label: 'S-Plan 15€', description: 'Abonnement communauté 15€' },
  { value: 'ADMIN', label: 'Admin', description: 'Accès complet admin' }
];

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const openRolesDialog = (user) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    setShowRolesDialog(true);
  };

  const toggleRole = (roleValue) => {
    if (selectedRoles.includes(roleValue)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleValue));
    } else {
      setSelectedRoles([...selectedRoles, roleValue]);
    }
  };

  const handleSaveRoles = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}/roles`, selectedRoles);
      toast.success('Rôles mis à jour');
      setShowRolesDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      toast.error('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      toast.success(`Utilisateur ${selectedUser.email} supprimé définitivement`);
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 md:mb-6">Utilisateurs</h2>

        <Card className="bg-white border-slate-200 mb-4 md:mb-6">
          <CardContent className="p-3 md:p-4">
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12"><p className="text-slate-500">Chargement...</p></div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="bg-white border-slate-200">
                <CardContent className="p-3 md:p-4">
                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openRolesDialog(user)}
                          className="text-xs flex-shrink-0"
                        >
                          Rôles
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openDeleteDialog(user)}
                          className="text-xs flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles?.slice(0, 3).map(role => (
                        <Badge key={role} className="bg-blue-100 text-blue-800 text-xs">{role}</Badge>
                      ))}
                      {user.roles?.length > 3 && (
                        <Badge className="bg-slate-100 text-slate-600 text-xs">+{user.roles.length - 3}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      {user.phone && <p className="text-sm text-slate-500">{user.phone}</p>}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {user.roles?.map(role => (
                          <Badge key={role} className="bg-blue-100 text-blue-800 text-xs">{role}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openRolesDialog(user)}
                        data-testid={`manage-roles-btn-${user.id}`}
                      >
                        Gérer rôles
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDeleteDialog(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showRolesDialog} onOpenChange={setShowRolesDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Gérer les rôles de {selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-slate-600">
                Les rôles sont cumulables. Sélectionnez tous les rôles que l'utilisateur doit avoir.
              </p>
              {ALL_ROLES.map((role) => (
                <div key={role.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50">
                  <Checkbox
                    id={role.value}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={role.value} className="font-medium cursor-pointer">
                      {role.label}
                    </Label>
                    <p className="text-xs text-slate-500">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveRoles} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => setShowRolesDialog(false)}>
                Annuler
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Supprimer définitivement un compte
              </DialogTitle>
              <DialogDescription>
                Cette action est irréversible et supprimera toutes les données associées à cet utilisateur.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 mb-2">
                  ⚠️ Attention : Action irréversible
                </p>
                <p className="text-sm text-red-800 mb-2">
                  L'utilisateur <strong>{selectedUser?.email}</strong> sera définitivement supprimé ainsi que :
                </p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Tous ses mini-sites et articles</li>
                  <li>Toutes ses demandes</li>
                  <li>Toutes ses ventes vendeur</li>
                  <li>Tous ses abonnements</li>
                  <li>Toutes ses demandes d'accès vendeur</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm" className="text-slate-700">
                  Tapez <strong className="text-red-600">SUPPRIMER</strong> pour confirmer :
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleDeleteUser}
                disabled={deleteConfirmText !== 'SUPPRIMER' || deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};
