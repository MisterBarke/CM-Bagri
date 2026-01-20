
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { SocialNetwork, VisualType, SocialPost, CompetitiveIntelligence, PostStatus } from "../types";

// Always use a named parameter for apiKey and create instance inside functions to ensure latest key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function performCompetitiveVeille(): Promise<CompetitiveIntelligence[]> {
  const ai = getAI();
  const prompt = `En tant qu'expert Marketing pour la BAGRI (Banque Agricole du Niger), effectue une veille concurrentielle stratégique.
  Analyse les institutions suivantes au Niger et dans l'UEMOA : SONIBANK, BOBI, Orabank, Ecobank, Coris Bank, ainsi que les Fintechs (Wave, Orange Money) et services de transfert (Al Izza, Nita).
  Focus particulier : Banques Agricoles de la sous-région.
  Identifie les thématiques fortes (campagnes de récolte, digitalisation, inclusion financière, entrepreneuriat féminin).
  Retourne un JSON structuré.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            institution: { type: Type.STRING },
            category: { type: Type.STRING },
            trends: { type: Type.ARRAY, items: { type: Type.STRING } },
            lastCampaigns: { type: Type.STRING },
          },
          required: ["institution", "category", "trends", "lastCampaigns"]
        }
      }
    },
  });

  const raw = response.text || "[]";
  const items = JSON.parse(raw);
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return items.map((it: any) => ({
    ...it,
    sources: sources.map((s: any) => s.web).filter(Boolean)
  }));
}

export async function generateSocialPosts(
  networks: SocialNetwork[], 
  days: string[],
  context: string, 
  userBrief?: string
): Promise<SocialPost[]> {
  const ai = getAI();
  const prompt = `Tu es le DIRECTEUR DE CRÉATION de la BAGRI (Banque Agricole du Niger).
  MISSION : Créer un calendrier éditorial UNIQUE pour les jours suivants : ${days.join(', ')}.
  RÉSEAUX : ${networks.join(', ')}.

  DIRECTIVES CRUCIALES :
  1. ZÉRO REDONDANCE : Chaque jour doit avoir un angle d'attaque différent.
  2. ADAPTATION RÉSEAU : LinkedIn (Analytique), Facebook (Familial), Instagram (Esthétique).
  3. CONTEXTE : ${context}
  4. BRIEF : ${userBrief || "Promotion générale des services de la BAGRI."}

  Génère 1 post par jour par réseau demandé. Assure une diversité totale.
  VISUELS : Suggère IMAGE (Africains au Niger), VIDEO ou SPEECH.
  RETOURNE UN JSON STRICT.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING, description: "Le jour de la semaine concerné" },
            network: { type: Type.STRING },
            content: { type: Type.STRING },
            suggestedVisual: { type: Type.STRING, description: "IMAGE, VIDEO, or SPEECH" }
          },
          required: ["day", "network", "content", "suggestedVisual"]
        }
      }
    },
  });

  const raw = JSON.parse(response.text || "[]");
  return raw.map((it: any, idx: number) => ({
    id: `${Date.now()}-${idx}`,
    day: it.day,
    network: it.network as SocialNetwork,
    content: it.content,
    suggestedVisual: it.suggestedVisual as VisualType,
    status: PostStatus.PENDING,
  }));
}

export async function generateVisualImage(promptText: string): Promise<string> {
  const ai = getAI();
  const finalPrompt = `Photographie professionnelle haute définition pour la BAGRI (Banque Agricole du Niger). 
  Scène : ${promptText}. 
  DIRECTIVE CRUCIALE : NE GÉNÈRE AUCUN TEXTE, AUCUN LOGO ET AUCUN SYMBOLE DANS L'IMAGE. 
  Composition : Laisse délibérément le coin supérieur droit vide et propre pour l'incrustation officielle du logo BAGRI.
  Personnes : Uniquement des Nigériens (Africains de l'Ouest), fiers, rayonnants, en situation réelle au Niger (champs verdoyants, bureaux modernes à Niamey, marchés). 
  Couleurs : Respecte la charte BAGRI avec des touches de VERT (#008B45) et ORANGE (#F36F21). 
  Style : Authentique, chaleureux, institutionnel.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: finalPrompt }] },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("Erreur image");
}

export async function generateVisualVideo(promptText: string): Promise<string> {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Vidéo cinématographique pour la BAGRI Niger. Une personne africaine nigérienne souriante. Scène de vie au Niger. Qualité 1080p. INTERDICTION de générer des logos ou du texte. Composition aérée pour permettre l'ajout de logos en post-production.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
}

export async function generateSpeech(text: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Voix radio professionnelle du Niger, ton chaleureux et rassurant : ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return base64Audio;
}
