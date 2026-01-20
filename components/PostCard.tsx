
import React, { useState, useRef } from 'react';
import { SocialPost, VisualType, SocialNetwork, PostStatus } from '../types';
import { generateVisualImage, generateVisualVideo, generateSpeech } from '../services/geminiService';
import { BAGRI_LOGO } from '../constants';

interface PostCardProps {
  post: SocialPost;
  onUpdate: (updatedPost: SocialPost) => void;
}

// Helper functions for raw PCM audio decoding as per Gemini guidelines
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleGenerateVisual = async (type: VisualType) => {
    setLoading(true);
    setError(null);
    try {
      let url = "";
      if (type === VisualType.IMAGE) {
        url = await generateVisualImage(post.content);
      } else if (type === VisualType.VIDEO) {
        url = await generateVisualVideo(post.content);
      } else if (type === VisualType.SPEECH) {
        url = await generateSpeech(post.content);
      }
      onUpdate({ ...post, visualUrl: url, suggestedVisual: type });
    } catch (err) {
      setError("Erreur lors de la génération du visuel.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (status: PostStatus) => {
    onUpdate({ ...post, status });
  };

  const playPCM = async () => {
    if (!post.visualUrl) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const data = decodeBase64(post.visualUrl);
      const buffer = await decodeAudioData(data, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.error("Audio playback error", err);
      setError("Erreur de lecture audio.");
    }
  };

  const getNetworkIcon = (network: SocialNetwork) => {
    switch (network) {
      case SocialNetwork.FACEBOOK: return "🔵 Facebook";
      case SocialNetwork.INSTAGRAM: return "🟣 Instagram";
      case SocialNetwork.LINKEDIN: return "💙 LinkedIn";
      default: return "";
    }
  };

  const getStatusBadgeClass = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PENDING: return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case PostStatus.APPROVED: return "bg-green-100 text-green-700 border-green-200";
      case PostStatus.PUBLISHED: return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PENDING: return "En attente";
      case PostStatus.APPROVED: return "Approuvé";
      case PostStatus.PUBLISHED: return "Publié";
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full group transition-all hover:shadow-md">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <span className="font-bold text-xs uppercase tracking-wider text-gray-500">
          {getNetworkIcon(post.network)}
        </span>
        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusBadgeClass(post.status)}`}>
          {getStatusLabel(post.status)}
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>
        
        {post.visualUrl && (
          <div className="rounded-lg overflow-hidden border border-gray-200 bg-black min-h-[250px] flex items-center justify-center relative">
            
            {/* LOGO BAGRI OFFICIEL - INCUSTATION PRIORITAIRE */}
            <div className="absolute top-4 right-4 z-20 bg-white p-2 rounded-lg shadow-xl border border-gray-200 transform hover:scale-105 transition-transform">
               <img src={BAGRI_LOGO} alt="Logo Officiel BAGRI" className="h-8 md:h-10 object-contain" />
            </div>

            {/* BADGE RESEAU SOCIAL */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 bg-white/20 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/30 shadow-2xl">
               <span className="text-[10px] text-white font-black tracking-widest uppercase">{post.network}</span>
            </div>

            {/* OVERLAY CHARTE GRAPHIQUE (Dégradé subtil vert/orange sur les bords si besoin) */}
            <div className="absolute inset-0 pointer-events-none border-[6px] border-white/10 rounded-lg"></div>

            {post.suggestedVisual === VisualType.IMAGE && (
               <div className="relative w-full h-full overflow-hidden">
                  <img src={post.visualUrl} alt="BAGRI Content" className="w-full h-full object-cover" />
               </div>
            )}
            {post.suggestedVisual === VisualType.VIDEO && (
               <video src={post.visualUrl} controls className="w-full h-full object-cover" />
            )}
            {post.suggestedVisual === VisualType.SPEECH && (
               <div className="p-12 w-full text-center bg-gradient-to-br from-bagri-green to-bagri-orange">
                  <div className="mb-6 opacity-80">
                    <img src={BAGRI_LOGO} className="h-16 mx-auto brightness-0 invert" alt="logo white" />
                  </div>
                  <p className="text-white text-xs font-bold mb-4 tracking-widest uppercase">Audio Marketing BAGRI</p>
                  <button 
                    onClick={playPCM}
                    className="bg-white text-bagri-green px-8 py-3 rounded-full font-black text-sm hover:scale-105 transition-all shadow-xl"
                  >
                    Lancer la Voix Off
                  </button>
               </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50 space-y-4">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Workflow d'approbation</p>
          <div className="flex gap-1">
            {Object.values(PostStatus).map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`flex-1 text-[9px] font-black py-1.5 px-1 rounded transition-all border ${
                  post.status === s 
                  ? 'bg-bagri-green text-white border-bagri-green shadow-lg' 
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                {getStatusLabel(s).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Générer Visuel Officiel (Logo inclus)</p>
          <div className="flex flex-wrap gap-2">
            <button 
              disabled={loading}
              onClick={() => handleGenerateVisual(VisualType.IMAGE)}
              className="flex-1 text-xs font-black py-2.5 px-3 rounded-xl bg-white border-2 border-gray-100 text-gray-700 hover:border-bagri-orange hover:text-bagri-orange disabled:opacity-50 transition-all active:scale-95 shadow-sm"
            >
              Image AI
            </button>
            <button 
              disabled={loading}
              onClick={() => handleGenerateVisual(VisualType.VIDEO)}
              className="flex-1 text-xs font-black py-2.5 px-3 rounded-xl bg-white border-2 border-gray-100 text-gray-700 hover:border-bagri-orange hover:text-bagri-orange disabled:opacity-50 transition-all active:scale-95 shadow-sm"
            >
              Vidéo Veo
            </button>
            <button 
              disabled={loading}
              onClick={() => handleGenerateVisual(VisualType.SPEECH)}
              className="flex-1 text-xs font-black py-2.5 px-3 rounded-xl bg-white border-2 border-gray-100 text-gray-700 hover:border-bagri-orange hover:text-bagri-orange disabled:opacity-50 transition-all active:scale-95 shadow-sm"
            >
              Voix Radio
            </button>
          </div>
        </div>
        
        {loading && (
          <div className="flex items-center space-x-2 text-bagri-orange font-black text-[10px] animate-pulse">
            <div className="w-2 h-2 rounded-full bg-bagri-orange animate-ping"></div>
            <span>INTÉGRATION DU LOGO ET VALIDATION DE LA CHARTE...</span>
          </div>
        )}
        {error && <p className="text-[10px] text-red-600 mt-2 font-black">{error.toUpperCase()}</p>}
      </div>
    </div>
  );
};

export default PostCard;
