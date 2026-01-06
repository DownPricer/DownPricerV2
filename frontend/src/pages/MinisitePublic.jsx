import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ExternalLink, Loader2, AlertCircle, ShoppingBag, Star, ChevronRight } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import api from '../utils/api';

// ==========================================
// TEMPLATE COMPONENTS - Chaque template a un layout différent
// ==========================================

// Template 1: Grid classique (style e-commerce standard)
const TemplateModernGrid = ({ articles, minisite }) => (
  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {articles.map((article) => (
      <ArticleCardClassic key={article.id} article={article} minisite={minisite} />
    ))}
  </div>
);

// Template 2: Liste verticale (style YouTube/Reddit)
const TemplateClassicList = ({ articles, minisite }) => (
  <div className="space-y-4 max-w-3xl mx-auto">
    {articles.map((article) => (
      <Card key={article.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
            <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
          </div>
          <CardContent className="p-4 flex-1">
            <h3 className="font-bold text-lg text-white mb-2">{article.name}</h3>
            <p className="text-zinc-400 text-sm line-clamp-2 mb-3">{article.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
              <ArticleButtons article={article} minisite={minisite} />
            </div>
          </CardContent>
        </div>
      </Card>
    ))}
  </div>
);

// Template 3: Cards larges (style Spotify/Netflix)
const TemplateCardStack = ({ articles, minisite }) => (
  <div className="space-y-6">
    {articles.map((article, idx) => (
      <Card key={article.id} className={`bg-zinc-900 border-zinc-800 overflow-hidden ${idx % 2 === 0 ? '' : 'sm:flex-row-reverse'}`}>
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-1/2 h-64">
            <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
          </div>
          <CardContent className="p-6 sm:w-1/2 flex flex-col justify-center">
            <Badge className="w-fit mb-3" style={{ backgroundColor: minisite.primary_color }}>Disponible</Badge>
            <h3 className="font-bold text-2xl text-white mb-3">{article.name}</h3>
            <p className="text-zinc-400 mb-4">{article.description}</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
              {article.reference_price > article.price && (
                <span className="text-lg text-zinc-500 line-through">{article.reference_price}€</span>
              )}
            </div>
            <div className="mt-4">
              <ArticleButtons article={article} minisite={minisite} />
            </div>
          </CardContent>
        </div>
      </Card>
    ))}
  </div>
);

// Template 4: Minimaliste (clean, espaces)
const TemplateMinimalClean = ({ articles, minisite }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
    {articles.map((article) => (
      <div key={article.id} className="text-center">
        <div className="aspect-square mb-4 bg-zinc-800 rounded-2xl overflow-hidden">
          <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
        </div>
        <h3 className="font-medium text-white text-lg mb-1">{article.name}</h3>
        <p className="text-2xl font-bold mb-3" style={{ color: minisite.primary_color }}>{article.price}€</p>
        <ArticleButtons article={article} minisite={minisite} size="default" />
      </div>
    ))}
  </div>
);

// Template 5: Hero bold (gros visuels)
const TemplateBoldHero = ({ articles, minisite }) => (
  <div className="space-y-8">
    {articles.slice(0, 1).map((article) => (
      <Card key={article.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="relative h-96">
          <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <Badge className="mb-3" style={{ backgroundColor: minisite.primary_color }}>⭐ Recommandé</Badge>
            <h2 className="text-3xl font-bold text-white mb-2">{article.name}</h2>
            <p className="text-zinc-300 mb-4">{article.description}</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-white">{article.price}€</span>
              <ArticleButtons article={article} minisite={minisite} />
            </div>
          </div>
        </div>
      </Card>
    ))}
    <div className="grid sm:grid-cols-3 gap-4">
      {articles.slice(1).map((article) => (
        <ArticleCardClassic key={article.id} article={article} minisite={minisite} />
      ))}
    </div>
  </div>
);

// Template 6: Split élégant
const TemplateElegantSplit = ({ articles, minisite }) => (
  <div className="grid md:grid-cols-2 gap-6">
    {articles.map((article) => (
      <Card key={article.id} className="bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
        <div className="flex">
          <div className="w-1/3 min-h-[200px]">
            <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
          </div>
          <CardContent className="w-2/3 p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">{article.name}</h3>
              <p className="text-xs text-zinc-500 line-clamp-2">{article.description}</p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xl font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
              <Button size="sm" style={{ backgroundColor: minisite.primary_color }} onClick={() => window.open(article.platform_links?.vinted || article.platform_links?.leboncoin, '_blank')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    ))}
  </div>
);

// Template 7: Masonry (Pinterest style)
const TemplateMasonryFlow = ({ articles, minisite }) => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
    {articles.map((article, idx) => (
      <Card key={article.id} className="bg-zinc-900 border-zinc-800 break-inside-avoid overflow-hidden">
        <div style={{ height: `${200 + (idx % 3) * 50}px` }}>
          <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-white text-sm mb-1">{article.name}</h3>
          <span className="text-lg font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Template 8: Scroll horizontal
const TemplateSideScroll = ({ articles, minisite }) => (
  <div className="overflow-x-auto pb-4">
    <div className="flex gap-4 min-w-max px-4">
      {articles.map((article) => (
        <Card key={article.id} className="bg-zinc-900 border-zinc-800 w-72 flex-shrink-0 overflow-hidden">
          <div className="h-48">
            <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-white mb-2 truncate">{article.name}</h3>
            <span className="text-xl font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
            <div className="mt-3">
              <ArticleButtons article={article} minisite={minisite} size="sm" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Template 9: Full width
const TemplateFullWidth = ({ articles, minisite }) => (
  <div className="space-y-4">
    {articles.map((article) => (
      <Card key={article.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-2/3 h-64 lg:h-80">
            <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
          </div>
          <CardContent className="lg:w-1/3 p-6 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-white mb-3">{article.name}</h3>
            <p className="text-zinc-400 mb-4">{article.description}</p>
            <div className="text-3xl font-bold mb-4" style={{ color: minisite.primary_color }}>{article.price}€</div>
            <ArticleButtons article={article} minisite={minisite} />
          </CardContent>
        </div>
      </Card>
    ))}
  </div>
);

// Template 10: Compact tiles
const TemplateCompactTiles = ({ articles, minisite }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {articles.map((article) => (
      <Card key={article.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="aspect-square">
          <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
        </div>
        <CardContent className="p-2">
          <h3 className="font-medium text-white text-xs truncate">{article.name}</h3>
          <span className="text-sm font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Autres templates (11-20) - variations des précédents
const TemplateMagazineStyle = ({ articles, minisite }) => (
  <div className="grid lg:grid-cols-3 gap-4">
    {articles.slice(0, 1).map((article) => (
      <Card key={article.id} className="lg:col-span-2 lg:row-span-2 bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="h-full min-h-[300px] relative">
          <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black p-4">
            <h3 className="text-xl font-bold text-white">{article.name}</h3>
            <span className="text-2xl font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
          </div>
        </div>
      </Card>
    ))}
    {articles.slice(1, 5).map((article) => (
      <Card key={article.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="aspect-video">
          <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-full object-cover" />
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-white text-sm truncate">{article.name}</h3>
          <span className="font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
        </CardContent>
      </Card>
    ))}
  </div>
);

const TemplatePortfolioPro = TemplateMinimalClean;
const TemplateShowcaseXL = TemplateBoldHero;
const TemplateGalleryView = TemplateMasonryFlow;
const TemplateBusinessCard = TemplateElegantSplit;
const TemplateStoryteller = TemplateCardStack;
const TemplateProductFocus = TemplateFullWidth;
const TemplateDarkLuxe = TemplateModernGrid;
const TemplateBrightFresh = TemplateCompactTiles;
const TemplatePremiumElite = TemplateMagazineStyle;

// ==========================================
// COMPOSANTS RÉUTILISABLES
// ==========================================

const ArticleCardClassic = ({ article, minisite }) => {
  const discount = article.reference_price > article.price 
    ? Math.round(((article.reference_price - article.price) / article.reference_price) * 100) : 0;

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden">
      <div className="relative">
        <SafeImage src={article.photos?.[0]} alt={article.name} className="w-full h-48 object-cover" />
        {discount > 0 && <Badge className="absolute top-2 right-2 bg-green-600 text-white">-{discount}%</Badge>}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-2">{article.name}</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold" style={{ color: minisite.primary_color }}>{article.price}€</span>
          {discount > 0 && <span className="text-sm text-zinc-500 line-through">{article.reference_price}€</span>}
        </div>
        <ArticleButtons article={article} minisite={minisite} size="sm" />
      </CardContent>
    </Card>
  );
};

const ArticleButtons = ({ article, minisite, size = "sm" }) => (
  <div className="flex gap-2">
    {article.platform_links?.vinted && (
      <Button size={size} style={{ backgroundColor: minisite.primary_color }} onClick={() => window.open(article.platform_links.vinted, '_blank')}>
        <ExternalLink className="h-4 w-4 mr-1" />Vinted
      </Button>
    )}
    {article.platform_links?.leboncoin && (
      <Button size={size} variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800" onClick={() => window.open(article.platform_links.leboncoin, '_blank')}>
        <ExternalLink className="h-4 w-4 mr-1" />LBC
      </Button>
    )}
  </div>
);

// ==========================================
// MAP DES TEMPLATES
// ==========================================
const TEMPLATES = {
  'modern-grid': TemplateModernGrid,
  'classic-list': TemplateClassicList,
  'card-stack': TemplateCardStack,
  'minimal-clean': TemplateMinimalClean,
  'bold-hero': TemplateBoldHero,
  'elegant-split': TemplateElegantSplit,
  'masonry-flow': TemplateMasonryFlow,
  'side-scroll': TemplateSideScroll,
  'full-width': TemplateFullWidth,
  'compact-tiles': TemplateCompactTiles,
  'magazine-style': TemplateMagazineStyle,
  'portfolio-pro': TemplatePortfolioPro,
  'showcase-xl': TemplateShowcaseXL,
  'gallery-view': TemplateGalleryView,
  'business-card': TemplateBusinessCard,
  'storyteller': TemplateStoryteller,
  'product-focus': TemplateProductFocus,
  'dark-luxe': TemplateDarkLuxe,
  'bright-fresh': TemplateBrightFresh,
  'premium-elite': TemplatePremiumElite,
  // Fallbacks pour anciens noms
  'template1': TemplateModernGrid,
  'template2': TemplateClassicList,
  'template3': TemplateMinimalClean,
  'premium': TemplateBoldHero,
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export const MinisitePublic = () => {
  const { slug } = useParams();
  const [minisite, setMinisite] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMinisite();
  }, [slug]);

  const fetchMinisite = async () => {
    try {
      const response = await api.get(`/minisites/slug/${slug}`);
      const data = response.data;
      setMinisite(data);
      // Les articles sont dans articles_data depuis le backend
      setArticles(data.articles_data || []);
    } catch (err) {
      setError('Mini-site introuvable ou suspendu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !minisite) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Page introuvable</h1>
          <p className="text-zinc-400">{error}</p>
          <Button className="mt-6" onClick={() => window.location.href = '/'}>
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const TemplateComponent = TEMPLATES[minisite.template] || TemplateModernGrid;

  return (
    <div className="min-h-screen bg-zinc-950 text-white" style={{ fontFamily: minisite.font_family || 'system-ui' }}>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {minisite.logo_url ? (
              <img src={minisite.logo_url} alt={minisite.site_name} className="h-10 w-10 rounded-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: minisite.primary_color || '#FF5722' }}>
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold" style={{ color: minisite.primary_color || '#FF5722' }}>{minisite.site_name}</h1>
          </div>
          <Badge className="bg-zinc-800 text-zinc-300">{articles.length} articles</Badge>
        </div>
      </header>

      {/* Welcome */}
      {minisite.welcome_text && (
        <section className="container mx-auto px-4 py-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 text-center">
              <p className="text-lg text-zinc-300">{minisite.welcome_text}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Articles avec template */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: minisite.primary_color || '#FF5722' }}>
          {articles.length > 0 ? `Nos articles (${articles.length})` : 'Aucun article'}
        </h2>

        {articles.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <p className="text-zinc-400">Aucun article disponible pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          <TemplateComponent articles={articles} minisite={minisite} />
        )}
      </section>

      {/* Footer */}
      {minisite.plan_id === 'SITE_PLAN_1' && (
        <footer className="border-t border-zinc-800 py-4 text-center">
          <p className="text-xs text-zinc-500">
            Propulsé par <a href="/" className="text-orange-500 hover:underline">DownPricer</a>
          </p>
        </footer>
      )}
    </div>
  );
};
