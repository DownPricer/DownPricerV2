import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import api from '../utils/api';
import { RatingStars } from '../components/RatingStars';

export const MinisiteReviews = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [minisite, setMinisite] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetchMinisiteAndReviews();
  }, [slug]);

  const fetchMinisiteAndReviews = async () => {
    try {
      const siteRes = await api.get(`/minisites/slug/${slug}`);
      setMinisite(siteRes.data);
      const reviewsRes = await api.get(`/reviews/minisite/${siteRes.data.id}`);
      setReviews(reviewsRes.data?.items || []);
      setHidden(reviewsRes.data?.hidden || false);
    } catch (error) {
      setMinisite(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Chargement...</p>
      </div>
    );
  }

  if (!minisite) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800 p-6 text-center">
          <CardHeader>
            <CardTitle>Boutique introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-orange-500">{minisite.site_name}</h1>
            <RatingStars rating={minisite.rating_avg || 0} count={minisite.rating_count || 0} />
          </div>
          <Button variant="outline" onClick={() => navigate(`/s/${minisite.slug}`)}>
            Voir la boutique
          </Button>
        </div>

        {hidden ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 text-center text-zinc-400">
              Les avis de cette boutique sont masqués.
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 text-center text-zinc-400">
              Aucun avis pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-zinc-400">{review.from_user?.name || 'Utilisateur'}</p>
                    <RatingStars rating={review.rating} count={0} showCount={false} />
                  </div>
                  {review.comment && (
                    <p className="text-zinc-300 text-sm">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

