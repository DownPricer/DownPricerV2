import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { ExternalLink, Share2, AlertCircle, ShoppingBag, Mail, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../utils/images';
import { RatingStars } from '../components/RatingStars';
import { AvatarCircle } from '../components/AvatarCircle';
import { Loader2 } from 'lucide-react';

export const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchArticle();
    fetchSettings();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      toast.error('Article non trouvé');
      navigate('/');
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      setSettings(response.data);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: article?.name || 'DownPricer',
      text: `Regarde cet article sur DownPricer : ${article?.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Lien copié dans le presse-papier !');
      }
    } catch (err) {
      console.error('Erreur de partage :', err);
    }
  };

  const calculateDiscount = () => {
    if (!article || !article.reference_price || article.reference_price === 0) return 0;
    return Math.round(((article.reference_price - article.price) / article.reference_price) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Chargement du produit...</p>
      </div>
    );
  }

  if (!article) return null;

  const vendor = article?.vendor;
  const vendorAvatar = vendor?.avatar_url || vendor?.logo_url;
  const vendorName = vendor?.seller_name || vendor?.minisite_name || 'Boutique';
  const discount = calculateDiscount();

  // CORRECTION ICI : On considère disponible si stock n'est pas strictement 0
  const isAvailable = article.stock !== 0; 

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30" data-testid="article-detail-page">
      
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        
        {/* Navigation Breadcrumb */}
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <div className="p-1 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Retour au catalogue
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* --- COLONNE GAUCHE : GALERIE --- */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Image */}
            <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/3] bg-[#050505] rounded-3xl overflow-hidden border border-white/5 flex items-center justify-center group">
              {(() => {
                const imageUrl = resolveImageUrl(article?.photos?.[currentPhotoIndex]);
                if (!imageUrl) {
                  return <div className="text-zinc-700 flex flex-col items-center gap-2"><ShoppingBag size={48} /><span className="text-xs font-bold uppercase tracking-widest">No Image</span></div>;
                }
                return (
                  <img
                    src={imageUrl}
                    alt={article?.name}
                    className="w-full h-full object-contain md:object-cover transition-transform duration-500"
                  />
                );
              })()}

              {/* Badges sur l'image */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount > 0 && (
                  <Badge className="bg-red-600 text-white border-none font-black text-sm px-3 py-1 shadow-lg">
                    -{discount}%
                  </Badge>
                )}
                {(article?.source === "minisite" || article?.is_third_party) && (
                  <Badge className="bg-black/80 backdrop-blur-md text-white border border-white/10 font-bold uppercase tracking-wider text-[10px]">
                    Vendeur tiers
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {article?.photos && article.photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {article.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex ? 'border-orange-500 opacity-100 ring-2 ring-orange-500/20' : 'border-white/5 opacity-60 hover:opacity-100 hover:border-white/20'
                    }`}
                  >
                    <img 
                      src={resolveImageUrl(photo)} 
                      alt={`Vue ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --- COLONNE DROITE : INFOS & BUY BOX --- */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Header Produit */}
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {article?.name}
                </h1>
                
                {/* Share action */}
                <div className="flex gap-2">
                  <button 
                    onClick={handleShare}
                    className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Partager cet article"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Vendor Info Inline */}
              {vendor && (
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/s/${vendor.minisite_slug}`)}>
                  <AvatarCircle src={vendorAvatar} name={vendorName} size={40} className="border border-white/10" />
                  <div>
                    <p className="text-xs text-zinc-400 font-medium">Vendu par</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors border-b border-transparent group-hover:border-orange-500/50">
                        {vendorName}
                      </span>
                      <div className="h-3 w-[1px] bg-zinc-700" />
                      <RatingStars rating={vendor.rating_avg || 0} count={vendor.rating_count || 0} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* --- BUY BOX (Zone d'achat) --- */}
            <div className="p-6 md:p-8 bg-[#080808] border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none -mt-20 -mr-20" />

              <div className="relative z-10 space-y-6">
                
                {/* Prix */}
                <div className="flex flex-col">
                  {article?.reference_price > article?.price && (
                    <span className="text-sm text-zinc-500 line-through font-medium">
                      Prix conseillé : {article.reference_price}€
                    </span>
                  )}
                  <div className="flex items-start gap-1 text-white">
                    <span className="text-2xl font-bold mt-1">€</span>
                    <span className="text-6xl font-black tracking-tighter leading-none">
                      {Math.floor(article?.price)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold leading-none mt-1">
                        {Math.round((article.price % 1) * 100).toString().padEnd(2, '0')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">TVA incluse (si applicable)</p>
                </div>

                {/* Stock Status - CORRIGÉ */}
                <div className="flex items-center gap-2 text-sm font-medium">
                  {isAvailable ? (
                    <>
                      <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      <span className="text-green-500">En stock, expédition rapide</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-red-500">Actuellement indisponible</span>
                    </>
                  )}
                </div>

                 {/* Boutons d'Action */}
                 <div className="space-y-3 pt-2">
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Achat / Expédition</p>
                   {/* Liens Vinted / Leboncoin / Autre */}
                  {article?.platform_links?.vinted && (
                    <Button
                      className="w-full h-14 rounded-xl bg-[#007782] hover:bg-[#006670] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#007782]/20 transition-all active:scale-[0.98]"
                      onClick={() => window.open(article.platform_links.vinted, '_blank')}
                    >
                      Acheter sur Vinted <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  {article?.platform_links?.leboncoin && (
                    <Button
                      className="w-full h-14 rounded-xl bg-[#FF6E14] hover:bg-[#E5600E] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#FF6E14]/20 transition-all active:scale-[0.98]"
                      onClick={() => window.open(article.platform_links.leboncoin, '_blank')}
                    >
                      Acheter sur Leboncoin <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                   {article?.platform_links?.other && (
                     <Button
                       className="w-full h-14 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wide transition-all active:scale-[0.98]"
                       onClick={() => window.open(article.platform_links.other, '_blank')}
                     >
                       Acheter <ExternalLink className="ml-2 h-4 w-4" />
                     </Button>
                   )}

                  {/* Main Propre */}
                  {article?.source !== "minisite" && !article?.is_third_party && (
                    <Button
                      className="w-full h-14 rounded-xl bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-[0.98]"
                      onClick={() => {
                        const subject = encodeURIComponent(`Hand Delivery: ${article?.name}`);
                        const body = encodeURIComponent(`Bonjour,\n\nJe suis intéressé par l'article : ${article?.name} (ID: ${article?.id}).\nMerci de me recontacter.`);
                        window.location.href = `mailto:${settings.contact_email || 'contact@downpricer.com'}?subject=${subject}&body=${body}`;
                      }}
                    >
                      <Truck className="mr-3 h-5 w-5" /> Remise en main propre
                    </Button>
                  )}

                  {/* Contact Vendeur Tiers */}
                   {(article?.source === "minisite" || article?.is_third_party) && article?.contact_email && (
                    <Button
                      variant="outline"
                      className="w-full h-14 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-sm"
                      onClick={() => window.location.href = `mailto:${article.contact_email}`}
                    >
                      <Mail className="mr-2 h-4 w-4" /> Contacter le vendeur
                    </Button>
                  )}
                </div>

                {/* Trust Elements */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-orange-500 h-5 w-5 shrink-0" />
                    <span className="text-[10px] font-medium text-zinc-400 leading-tight">Paiement Sécurisé via Plateforme</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-orange-500 h-5 w-5 shrink-0" />
                    <span className="text-[10px] font-medium text-zinc-400 leading-tight">Support Client 7j/7</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Description Block */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <div className="h-1 w-6 bg-orange-500 rounded-full" />
                Détails Techniques
              </h3>
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {article?.description || "Aucune description fournie pour cet article."}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};