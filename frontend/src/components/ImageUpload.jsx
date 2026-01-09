import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, Link as LinkIcon, X, Loader2, ImageIcon } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { resolveImageUrl } from '../utils/images';

export const ImageUpload = ({ 
  images = [], 
  onChange, 
  maxImages = 5,
  label = "Images",
  placeholder = "https://exemple.com/image.jpg"
}) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadMode, setUploadMode] = useState('upload');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          uploadedUrls.push(response.data.url);
        }
      }

      onChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploadée(s)`);
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
      console.error('Upload error:', error);
    }

    setUploading(false);
    e.target.value = '';
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) {
      toast.error('Veuillez entrer une URL');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    // Validation basique de l'URL
    try {
      new URL(urlInput);
    } catch {
      toast.error('URL invalide');
      return;
    }

    onChange([...images, urlInput.trim()]);
    setUrlInput('');
    toast.success('Image ajoutée');
  };

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  // Composant pour afficher une image avec fallback
  const ImagePreview = ({ url, index }) => {
    const [imgError, setImgError] = useState(false);
    const [imgLoading, setImgLoading] = useState(true);

    // Résoudre l'URL de l'image
    const resolvedUrl = resolveImageUrl(url);

    if (!resolvedUrl || imgError) {
      return (
        <div className="w-full h-24 flex items-center justify-center bg-red-900/30 rounded-lg border border-red-600">
          <div className="flex flex-col items-center text-red-400 text-xs">
            <ImageIcon className="h-6 w-6 mb-1" />
            <span>Erreur chargement</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-24">
        {imgLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 rounded-lg border border-zinc-600 animate-pulse">
            <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
          </div>
        )}
        <img
          src={resolvedUrl}
          alt={`Image ${index + 1}`}
          className={`w-full h-24 object-cover rounded-lg border-2 border-green-500 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
          onError={(e) => {
            console.error(`ImagePreview: Error loading image ${index}:`, resolvedUrl, e);
            setImgError(true);
            setImgLoading(false);
          }}
          onLoad={() => {
            console.log(`ImagePreview: Loaded image ${index}:`, resolvedUrl);
            setImgLoading(false);
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Label className="text-zinc-300">{label}</Label>
      
      <Tabs value={uploadMode} onValueChange={setUploadMode} className="w-full">
        <TabsList className="bg-zinc-800 border-zinc-700 grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Upload className="h-4 w-4 mr-2" />
            Upload fichier
          </TabsTrigger>
          <TabsTrigger value="url" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <LinkIcon className="h-4 w-4 mr-2" />
            URL externe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-3">
          <div className="border-2 border-dashed border-zinc-600 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors bg-zinc-800/30">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading || images.length >= maxImages}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              className={`cursor-pointer ${uploading || images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <Loader2 className="h-10 w-10 text-orange-500 mx-auto mb-2 animate-spin" />
              ) : (
                <div className="mx-auto w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center mb-2">
                  <Upload className="h-6 w-6 text-zinc-300" />
                </div>
              )}
              <p className="text-sm text-zinc-300 font-medium">
                {uploading ? 'Upload en cours...' : 'Cliquez pour uploader'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                PNG, JPG, WebP jusqu'à 10MB (optimisé auto)
              </p>
            </label>
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-3">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder={placeholder}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
              disabled={images.length >= maxImages}
              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
            />
            <Button
              type="button"
              onClick={handleUrlAdd}
              disabled={images.length >= maxImages || !urlInput.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Ajouter
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <ImagePreview url={url} index={index} />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-500 italic">
        {images.length === 0 
          ? "Aucune image ajoutée. Les images seront optimisées automatiquement."
          : `${images.length}/${maxImages} image(s) ajoutée(s)`
        }
      </p>
    </div>
  );
};
