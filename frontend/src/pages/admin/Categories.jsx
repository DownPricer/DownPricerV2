import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, Trash2, Loader2, FolderTree, Tag, Hash, X } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

export const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', icon: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/categories', formData);
      toast.success('Catégorie créée avec succès');
      setFormData({ name: '', slug: '', icon: '' });
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Ajout : suppression (ton bouton poubelle ne faisait rien)
  const handleDelete = async (cat) => {
    const ok = window.confirm(`Supprimer la catégorie "${cat.name}" ?`);
    if (!ok) return;

    setDeletingId(cat.id);
    try {
      await api.delete(`/admin/categories/${cat.id}`);
      toast.success('Catégorie supprimée');
      fetchCategories();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      {/* Fond moins noir + gradient léger */}
      <div className="min-h-screen text-white p-4 sm:p-6 md:p-12 selection:bg-orange-500/30 bg-gradient-to-b from-[#090909] via-[#070707] to-black">
        {/* Header */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4">
              <FolderTree className="h-3 w-3" /> Taxonomy Manager
            </div>

            <h2
              className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Catégories <span className="text-orange-500">Catalogue</span>
            </h2>

            <p className="mt-2 text-zinc-500 text-[10px] sm:text-sm font-medium uppercase tracking-wider italic">
              Structure, slugs & icônes du catalogue
            </p>
          </div>

          <Button
            onClick={() => setShowForm(!showForm)}
            className={`rounded-full px-8 h-12 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${
              showForm
                ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                : 'bg-white hover:bg-zinc-200 text-black shadow-xl shadow-white/5'
            }`}
          >
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2 stroke-[3px]" />}
            {showForm ? 'Annuler' : 'Nouvelle Catégorie'}
          </Button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <Card className="max-w-7xl mx-auto bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden mb-8 md:mb-12 animate-in slide-in-from-top-4 duration-300">
            <CardContent className="p-6 sm:p-8 md:p-10">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                <div className="space-y-3">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    Nom public
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Électronique"
                    required
                    className="bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] h-12 rounded-xl text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    Slug URL
                  </Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="ex: electronique"
                    required
                    className="bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] h-12 rounded-xl text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                    Icône (Emoji)
                  </Label>

                  <div className="flex gap-4">
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Ex: ⚡"
                      className="bg-[#0B0B0B] border-white/10 ring-1 ring-white/[0.02] h-12 rounded-xl text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 flex-1"
                    />

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-orange-600 hover:bg-orange-500 text-white font-black h-12 px-8 rounded-xl uppercase text-[10px] tracking-widest active:scale-95"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Card
                  key={cat.id}
                  className="bg-[#0E0E0E] border-white/10 ring-1 ring-white/[0.03] rounded-2xl hover:border-white/15 hover:ring-white/[0.06] transition-all group overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-[#0B0B0B] border border-white/10 flex items-center justify-center text-xl group-hover:border-orange-500/30 transition-colors shrink-0">
                          {cat.icon ? cat.icon : <Tag size={18} className="text-zinc-600" />}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-white group-hover:text-orange-500 transition-colors truncate">
                            {cat.name}
                          </p>
                          <p className="text-[10px] font-black font-mono text-zinc-600 uppercase tracking-tighter truncate">
                            /{cat.slug}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={deletingId === cat.id}
                        className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all disabled:opacity-50"
                        title="Supprimer"
                      >
                        {deletingId === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {categories.length === 0 && (
                <div className="col-span-full py-16 sm:py-20 text-center bg-[#0E0E0E] border border-white/10 ring-1 ring-white/[0.03] rounded-2xl sm:rounded-[2rem]">
                  <Hash className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    Aucune catégorie répertoriée
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
