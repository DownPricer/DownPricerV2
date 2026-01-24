import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Trash2, AlertTriangle, Users, Search, ShieldCheck, UserCog, Loader2, X, Hash } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const ALL_ROLES = [
  { value: 'CLIENT', label: 'Client', description: 'Peut créer des demandes' },
  { value: 'SELLER', label: 'Vendeur', description: 'Accès espace vendeur' },
  { value: 'SITE_PLAN_1', label: 'Mini-site 1€', description: 'Plan mini-site basique' },
  { value: 'SITE_PLAN_2', label: 'Mini-site 10€', description: 'Plan mini-site standard' },
  { value: 'SITE_PLAN_3', label: 'Mini-site 15€', description: 'Plan mini-site premium' },
  { value: 'S_PLAN_5', label: 'S-Plan 5€', description: 'Abonnement communauté 5€' },
  { value: 'S_PLAN_15', label: 'S-Plan 15€', description: 'Abonnement communauté 15€' },
  { value: 'ADMIN', label: 'Admin', description: 'Accès complet système' }
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
      toast.error('Erreur lors du chargement des comptes');
    }
    setLoading(false);
  };

  const openRolesDialog = (user) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    setShowRolesDialog(true);
  };

  const toggleRole = (roleValue) => {
    setSelectedRoles(prev => 
      prev.includes(roleValue) ? prev.filter(r => r !== roleValue) : [...prev, roleValue]
    );
  };

  const handleSaveRoles = async () => {
    const tid = toast.loading("Mise à jour des privilèges...");
    try {
      await api.put(`/admin/users/${selectedUser.id}/roles`, selectedRoles);
      toast.success('Rôles mis à jour', { id: tid });
      setShowRolesDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur de mise à jour', { id: tid });
    }
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      toast.success(`Compte ${selectedUser.email} révoqué`);
      setShowDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error('Échec de la suppression');
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
      <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header */}
        <div className="mb-10 max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <ShieldCheck className="h-3 w-3" /> Identity Provider
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Gestion <span className="text-orange-500">Utilisateurs</span>
          </h2>
        </div>

        {/* Search Bar OLED */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="relative group max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
            <Input
              placeholder="Rechercher par nom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#080808] border-white/5 pl-12 h-12 rounded-2xl focus:border-orange-500/50 focus:ring-orange-500/10 text-white placeholder:text-zinc-800"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="bg-[#080808] border-white/5 rounded-2xl hover:border-white/10 transition-all group overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-black border border-white/10 flex items-center justify-center text-zinc-600 group-hover:border-orange-500/30 group-hover:text-orange-500 transition-colors shrink-0">
                        <Users size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-orange-500 transition-colors truncate">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-center">
                      {user.roles?.map(role => (
                        <Badge key={role} className={`border rounded-full text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 ${
                          role === 'ADMIN' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-white/5 text-zinc-400 border-white/10'
                        }`}>
                          {role}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 border-t border-white/[0.03] pt-4 md:pt-0 md:border-t-0 justify-end">
                      <Button 
                        size="sm" variant="ghost"
                        onClick={() => openRolesDialog(user)}
                        className="bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase px-4"
                      >
                        <UserCog className="h-3.5 w-3.5 mr-2" /> Privilèges
                      </Button>
                      <Button 
                        size="icon" variant="ghost"
                        onClick={() => openDeleteDialog(user)}
                        className="bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl"
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

        {/* DIALOG: ROLES */}
        <Dialog open={showRolesDialog} onOpenChange={setShowRolesDialog}>
          <DialogContent className="bg-[#0A0A0A] border-white/10 text-white rounded-[2rem] p-6 sm:p-10 w-[95vw] max-w-xl max-h-[90vh] flex flex-col">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                <UserCog className="text-orange-500" /> ACL <span className="text-orange-500">Matrix</span>
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                Modification des accès pour {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar py-4">
              {ALL_ROLES.map((role) => (
                <div 
                  key={role.value} 
                  onClick={() => toggleRole(role.value)}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedRoles.includes(role.value) ? 'bg-orange-500/10 border-orange-500/20' : 'bg-black border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <Label className="font-black text-[11px] uppercase tracking-widest text-white cursor-pointer">{role.label}</Label>
                    <p className="text-[9px] font-medium text-zinc-600 uppercase">{role.description}</p>
                  </div>
                  <Checkbox 
                    checked={selectedRoles.includes(role.value)} 
                    onCheckedChange={() => toggleRole(role.value)}
                    className="border-white/20 data-[state=checked]:bg-orange-500"
                  />
                </div>
              ))}
            </div>

            <DialogFooter className="pt-6 flex flex-col sm:flex-row gap-3 border-t border-white/[0.03]">
              <Button variant="ghost" onClick={() => setShowRolesDialog(false)} className="rounded-xl text-zinc-500 font-bold uppercase text-[10px]">Annuler</Button>
              <Button onClick={handleSaveRoles} className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[10px] px-8 rounded-xl h-11">
                Synchroniser les Rôles
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG: DELETE (STRICT) */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-[#0A0A0A] border-red-500/20 text-white rounded-[2rem] p-6 sm:p-10 w-[95vw] max-w-lg shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <DialogHeader>
              <DialogTitle className="text-red-500 font-black uppercase tracking-tighter text-xl flex items-center gap-3">
                <AlertTriangle /> Révoquer l'accès
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Protocole d'effacement critique</p>
                <p className="text-xs font-medium text-zinc-400 leading-relaxed uppercase">
                  L'utilisateur <span className="text-white font-bold">{selectedUser?.email}</span> sera déconnecté et ses données seront purgées. Cette action est irréversible.
                </p>
              </div>
              
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">
                  Saisissez <span className="text-red-500">SUPPRIMER</span> pour authentifier
                </Label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="---"
                  className="bg-black border-red-500/20 h-12 rounded-xl text-center font-mono font-black tracking-[0.5em] focus:border-red-500"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} className="rounded-xl text-zinc-500 font-bold uppercase text-[10px]">Annuler</Button>
              <Button 
                onClick={handleDeleteUser} 
                disabled={deleteConfirmText !== 'SUPPRIMER' || deleting}
                className="bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] px-8 rounded-xl h-11 disabled:opacity-20"
              >
                {deleting ? 'Destruction...' : 'Confirmer l\'effacement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
};