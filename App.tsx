
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import PostCard from './components/PostCard';
import { SocialNetwork, SocialPost, CompetitiveIntelligence, VisualType, PostStatus } from './types';
import { performCompetitiveVeille, generateSocialPosts } from './services/geminiService';
import { Icons, BAGRI_GREEN, BAGRI_ORANGE, BAGRI_LOGO } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [veilleData, setVeilleData] = useState<CompetitiveIntelligence[]>([]);
  const [loadingVeille, setLoadingVeille] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userBrief, setUserBrief] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Lundi', 'Mercredi', 'Vendredi']);
  
  // Filters state
  const [networkFilter, setNetworkFilter] = useState<SocialNetwork | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'ALL'>('ALL');

  // Simulation de base de données partagée
  useEffect(() => {
    const savedPosts = localStorage.getItem('bagri_shared_posts');
    const savedVeille = localStorage.getItem('bagri_shared_veille');
    
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedVeille) setVeilleData(JSON.parse(savedVeille));
    else fetchVeille();
  }, []);

  // Handle Veo API key selection
  useEffect(() => {
    const checkVeoKey = async () => {
      if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }
    };
    checkVeoKey();
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem('bagri_shared_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('bagri_shared_veille', JSON.stringify(veilleData));
  }, [veilleData]);

  const fetchVeille = async () => {
    setLoadingVeille(true);
    try {
      const data = await performCompetitiveVeille();
      setVeilleData(data);
    } catch (error) {
      console.error("Error fetching veille", error);
    } finally {
      setLoadingVeille(false);
    }
  };

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      const context = veilleData.map(v => `${v.institution}: ${v.trends.join(', ')}`).join('. ');
      const newPosts = await generateSocialPosts(
        [SocialNetwork.LINKEDIN, SocialNetwork.FACEBOOK, SocialNetwork.INSTAGRAM],
        selectedDays, // On envoie les jours sélectionnés pour générer des contenus variés
        context,
        userBrief
      );
      // Remplacer les anciens posts ou ajouter au flux
      setPosts(prev => [...newPosts, ...prev]);
      setActiveTab('calendar');
    } catch (error) {
      console.error("Error generating posts", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  const updatePost = (updatedPost: SocialPost) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const clearData = () => {
    if(window.confirm("Voulez-vous vraiment effacer le flux partagé ?")) {
      setPosts([]);
      localStorage.removeItem('bagri_shared_posts');
    }
  };

  // Filtered posts logic
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesNetwork = networkFilter === 'ALL' || post.network === networkFilter;
      const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
      return matchesNetwork && matchesStatus;
    });
  }, [posts, networkFilter, statusFilter]);

  const getStatusLabel = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PENDING: return "En attente";
      case PostStatus.APPROVED: return "Approuvé";
      case PostStatus.PUBLISHED: return "Publié";
      default: return status;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {activeTab === 'dashboard' && 'Dashboard Equipe BAGRI'}
              {activeTab === 'veille' && 'Veille Stratégique UEMOA'}
              {activeTab === 'calendar' && 'Calendrier Editorial'}
              {activeTab === 'generator' && 'Studio de Création'}
            </h1>
            <p className="text-gray-500 font-medium">Plateforme collaborative de gestion d'image de marque.</p>
          </div>
          <div className="flex space-x-3">
             <button 
                onClick={clearData}
                className="bg-white border border-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50 hover:text-red-500 transition-all"
              >
                Réinitialiser Flux
              </button>
              <button 
                onClick={handleGenerateAll}
                disabled={isGenerating}
                className="bg-bagri-orange hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyse & Création...
                  </span>
                ) : (
                  <>
                    <Icons.Plus />
                    <span>Lancer Nouvelle Campagne</span>
                  </>
                )}
              </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <p className="text-gray-400 text-xs font-bold uppercase">Posts en attente</p>
                   <p className="text-3xl font-black text-bagri-green">{posts.filter(p => p.status === PostStatus.PENDING).length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <p className="text-gray-400 text-xs font-bold uppercase">Veille active</p>
                   <p className="text-3xl font-black text-bagri-orange">{veilleData.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
                   <p className="text-gray-400 text-xs font-bold uppercase">Dernière activité équipe</p>
                   <p className="text-sm font-medium mt-1">Nouveaux contenus uniques générés pour {selectedDays.length} jours.</p>
                </div>
             </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <span className="p-2 bg-green-50 rounded-lg mr-3 text-bagri-green"><Icons.Trends /></span>
                  Tendances Réseaux Sociaux Niger
                </h2>
                <div className="space-y-4">
                  {veilleData.slice(0, 4).map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group">
                      <div>
                        <p className="font-bold text-gray-800 group-hover:text-bagri-orange">{v.institution}</p>
                        <p className="text-xs text-gray-500 italic">Dernier succès : {v.lastCampaigns}</p>
                      </div>
                      <div className="flex space-x-1">
                        {v.trends.slice(0,2).map((t, ti) => (
                           <span key={ti} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab('veille')} className="w-full text-center py-3 text-bagri-green font-bold text-sm hover:bg-green-50 rounded-xl transition">
                    Accéder à l'observatoire complet
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <span className="p-2 bg-orange-50 rounded-lg mr-3 text-bagri-orange"><Icons.Calendar /></span>
                  Planning de Diffusion
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                    <div 
                      key={day} 
                      onClick={() => toggleDay(day)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                        selectedDays.includes(day) 
                        ? 'border-bagri-orange bg-orange-50' 
                        : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <span className={`text-sm font-bold ${selectedDays.includes(day) ? 'text-bagri-orange' : 'text-gray-400'}`}>{day}</span>
                      {selectedDays.includes(day) && <div className="w-2 h-2 rounded-full bg-bagri-orange"></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'veille' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold text-bagri-green">Analyse Sectorielle Détaillée</h2>
               <button onClick={fetchVeille} className="text-sm text-bagri-orange font-bold hover:underline">Rafraîchir les données web</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {veilleData.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all border-t-4 border-t-bagri-green">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-extrabold text-gray-900">{item.institution}</h3>
                    <span className="text-[10px] bg-green-50 text-bagri-green px-2 py-1 rounded-lg font-bold uppercase tracking-widest">{item.category}</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Axes de communication</p>
                      <div className="flex flex-wrap gap-2">
                        {item.trends.map((t, ti) => (
                           <span key={ti} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl">
                      <p className="text-[10px] font-black text-bagri-orange uppercase mb-1">Observation CM</p>
                      <p className="text-xs text-gray-700 leading-tight">{item.lastCampaigns}</p>
                    </div>
                    {item.sources.length > 0 && (
                      <div className="pt-2 border-t border-gray-50">
                        <div className="flex flex-wrap gap-2">
                          {item.sources.slice(0, 3).map((s, si) => (
                            <a key={si} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 font-bold hover:bg-blue-50 px-2 py-1 rounded transition">
                              SOURCE {si + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Plateforme :</span>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  {['ALL', ...Object.values(SocialNetwork)].map(n => (
                    <button
                      key={n}
                      onClick={() => setNetworkFilter(n as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        networkFilter === n 
                        ? 'bg-white text-bagri-orange shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {n === 'ALL' ? 'Toutes' : n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Statut :</span>
                <div className="flex p-1 bg-gray-100 rounded-xl">
                  {['ALL', ...Object.values(PostStatus)].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statusFilter === s 
                        ? 'bg-white text-bagri-green shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {s === 'ALL' ? 'Tous' : getStatusLabel(s as PostStatus)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto text-xs text-gray-400 font-medium italic">
                {filteredPosts.length} post(s) au total
              </div>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-6">
                {selectedDays.map(day => {
                   const postsForThisDay = filteredPosts.filter(p => p.day === day || p.day?.toLowerCase().includes(day.toLowerCase().slice(0,3)));
                   return (
                  <div key={day} className="min-w-[350px] flex flex-col space-y-4">
                    <div className="bg-bagri-green text-white p-4 rounded-2xl font-black text-center shadow-md flex justify-between items-center">
                      <span>{day}</span>
                      <span className="text-[10px] bg-white/20 px-2 py-1 rounded-lg">PLANNING</span>
                    </div>
                    <div className="space-y-6">
                      {postsForThisDay.length > 0 ? (
                        postsForThisDay.map(post => (
                          <PostCard key={post.id} post={post} onUpdate={updatePost} />
                        ))
                      ) : (
                        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-full mb-3 flex items-center justify-center text-gray-300">
                             <Icons.Plus />
                          </div>
                          <p className="text-gray-400 text-sm font-medium">Aucun contenu unique pour {day}.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )})}
                {selectedDays.length === 0 && (
                  <div className="w-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                     <p className="text-gray-400 font-bold">Sélectionnez des jours dans le planning pour générer des contenus uniques.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <img src={BAGRI_LOGO} className="w-32 h-32" alt="BAGRI Background" />
              </div>
              <h2 className="text-2xl font-black mb-8 text-bagri-green flex items-center">
                <span className="mr-3 p-2 bg-green-50 rounded-xl"><Icons.Plus /></span>
                Brief Créatif & Strategie Unique
              </h2>
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Sujet de la Campagne Hebdomadaire</label>
                  <textarea 
                    value={userBrief}
                    onChange={(e) => setUserBrief(e.target.value)}
                    placeholder="L'IA va créer des contenus différents chaque jour basé sur ce sujet..."
                    className="w-full h-40 p-6 bg-gray-50 border-2 border-transparent focus:border-bagri-orange rounded-3xl outline-none transition-all text-lg font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-gray-50 rounded-3xl">
                    <label className="block text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Ecosystème Digital</label>
                    <div className="flex flex-col space-y-3">
                      {[
                        { id: 'fb', label: 'Facebook', icon: '🔵' },
                        { id: 'li', label: 'LinkedIn', icon: '💙' },
                        { id: 'ig', label: 'Instagram', icon: '🟣' }
                      ].map(net => (
                        <label key={net.id} className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" defaultChecked className="form-checkbox text-bagri-orange h-5 w-5 rounded-lg border-2 border-gray-300" />
                          <span className="text-sm font-bold text-gray-600 group-hover:text-bagri-orange transition-colors">{net.icon} {net.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50 rounded-3xl">
                    <label className="block text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Jours de Publication (Contenus Variés)</label>
                    <div className="flex flex-wrap gap-2">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => {
                        const fullNames: {[key: string]: string} = {
                          'Lun': 'Lundi', 'Mar': 'Mardi', 'Mer': 'Mercredi', 'Jeu': 'Jeudi', 'Ven': 'Vendredi', 'Sam': 'Samedi', 'Dim': 'Dimanche'
                        };
                        const fullName = fullNames[d];
                        const isSelected = selectedDays.includes(fullName);
                        return (
                          <button 
                            key={d} 
                            onClick={() => toggleDay(fullName)}
                            className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all ${
                              isSelected 
                              ? 'bg-bagri-orange text-white border-bagri-orange' 
                              : 'bg-white text-gray-400 border-gray-200 hover:border-bagri-orange hover:text-bagri-orange'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 italic">L'IA garantit un message différent pour chaque jour sélectionné.</p>
                  </div>
                </div>

                <div className="pt-6 flex justify-center">
                  <button 
                    onClick={handleGenerateAll}
                    disabled={isGenerating || !userBrief || selectedDays.length === 0}
                    className="bg-bagri-green text-white px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-green-100 disabled:opacity-50 flex items-center space-x-3"
                  >
                    {isGenerating ? (
                       <>
                         <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         <span>Réflexion Créative...</span>
                       </>
                    ) : 'GÉNÉRER LE CALENDRIER UNIQUE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
