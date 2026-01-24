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
  const [formData, setFormData] = useState({ name: '', slug: '', icon: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/categories', formData);
      toast.success('Catégorie créée avec succès');
      setFormData({ name: '', slug: '', icon: '' });
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-orange-500/30">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
              <FolderTree className="h-3 w-3" /> Taxonomy Manager
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Catégories <span className="text-orange-500">Catalogue</span>
            </h2>
          </div>

          <Button 
            onClick={() => setShowForm(!showForm)} 
            className={`rounded-full px-8 h-12 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${
              showForm ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : 'bg-white hover:bg-zinc-200 text-black shadow-xl shadow-white/5'
            }`}
          >
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2 stroke-[3px]" />}
            {showForm ? 'Annuler' : 'Nouvelle Catégorie'}
          </Button>
        </div>

        {/* Formulaire OLED */}
        {showForm && (
          <Card className="bg-[#080808] border-white/5 rounded-[2rem] overflow-hidden mb-12 animate-in slide-in-from-top-4 duration-300">
            <CardContent className="p-8 md:p-10">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Nom public</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Électronique"
                    required
                    className="bg-black border-white/10 h-12 rounded-xl focus:border-orange-500/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Slug URL</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder="ex: electronique"
                    required
                    className="bg-black border-white/10 h-12 rounded-xl focus:border-orange-500/50"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Icône (Emoji)</Label>
                  <div className="flex gap-4">
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      placeholder="Ex: ⚡"
                      className="bg-black border-white/10 h-12 rounded-xl focus:border-orange-500/50 flex-1"
                    />
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-black h-12 px-8 rounded-xl uppercase text-[10px] tracking-widest">
                      Créer
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Grid des catégories */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="bg-[#080808] border-white/5 rounded-2xl hover:border-white/10 transition-all group overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-black border border-white/10 flex items-center justify-center text-xl group-hover:border-orange-500/30 transition-colors">
                        {cat.icon || <Tag size={18} className="text-zinc-700" />}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-orange-500 transition-colors">{cat.name}</p>
                        <p className="text-[10px] font-black font-mono text-zinc-600 uppercase tracking-tighter">/{cat.slug}</p>
                      </div>
                    </div>
                    
                    <button className="p-2 text-zinc-800 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {categories.length === 0 && (
              <div className="col-span-full py-20 text-center bg-[#080808] border border-white/5 rounded-[2rem]">
                <Hash className="h-10 w-10 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Aucune catégorie répertoriée</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};