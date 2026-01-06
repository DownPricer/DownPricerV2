import React, { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import api from '../utils/api';

export const DiscordCTA = ({ variant = 'banner' }) => {
  const [visible, setVisible] = useState(true);
  const [discordLink, setDiscordLink] = useState('');
  const [ctaText, setCtaText] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      const settings = response.data;
      setDiscordLink(settings.discord_invite_url || settings.discord_link || '');
      setCtaText(settings.discord_cta_text || 'Rejoignez notre communauté et gagnez plus d\'argent !');
    } catch (error) {
      // Ne pas afficher si pas de lien configuré
      setDiscordLink('');
      setCtaText('Rejoignez notre communauté et gagnez plus d\'argent !');
    }
  };

  if (!visible || !discordLink) return null;

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{ctaText}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold hover:bg-indigo-100 transition-colors flex-shrink-0"
            >
              Rejoindre
            </a>
            <button
              onClick={() => setVisible(false)}
              className="p-1 hover:bg-white/20 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Variant compact pour le sidebar vendeur
  if (variant === 'compact') {
    return (
      <a
        href={discordLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">Rejoindre la communauté</p>
            <p className="text-xs opacity-80 truncate">Gagnez plus d'argent !</p>
          </div>
        </div>
      </a>
    );
  }

  return null;
};

export default DiscordCTA;
