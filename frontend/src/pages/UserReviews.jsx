import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import api from '../utils/api';
import { RatingStars } from '../components/RatingStars';

export const UserReviews = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    try {
      const ratingRes = await api.get(`/ratings/user/${userId}`);
      setRating(ratingRes.data || { avg: 0, count: 0 });
      const reviewsRes = await api.get(`/reviews/user/${userId}`);
      setReviews(reviewsRes.data?.items || []);
    } catch (error) {
      setReviews([]);
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-orange-500">Avis revendeur</h1>
            <RatingStars rating={rating.avg || 0} count={rating.count || 0} />
          </div>
          <Button variant="outline" onClick={() => navigate('/mon-compte')}>
            Retour au profil
          </Button>
        </div>

        {reviews.length === 0 ? (
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

