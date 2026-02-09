
import { GoogleGenAI } from "@google/genai";

// Inicialización según directrices
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Genera un nombre creativo para el mix utilizando Gemini 3 Flash.
 */
export const generateMixName = async (trackA: string, trackB: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `He creado un mix de radio uniendo: "${trackA}" y "${trackB}". 
      Genera un título creativo y corto para el archivo de audio resultante. 
      Devuelve SOLO el texto del título, sin comillas, máximo 5 palabras.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating mix name:", error);
    return `Mix Alicante - ${new Date().toLocaleDateString()}`;
  }
};

export interface NewsItem {
  title: string;
  url: string;
  source: string;
}

export interface WeatherData {
  temp: string;
  condition: string;
}

/**
 * Obtiene el clima actual de Alicante usando Google Search Grounding.
 */
export const fetchAlicanteWeather = async (): Promise<WeatherData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Dime la temperatura actual exacta en grados Celsius en Alicante, España, y el estado del cielo (despejado, nublado, etc.). Responde solo con JSON: {\"temp\": \"XX°C\", \"condition\": \"Estado\"}",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching Alicante weather:", error);
    return { temp: "--°C", condition: "Despejado" };
  }
};

/**
 * Obtiene las noticias más recientes de Alicante usando Google Search Grounding.
 */
export const fetchAlicanteNews = async (): Promise<NewsItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca las 6 noticias más importantes y recientes de hoy en Alicante ciudad y provincia. Proporciona titulares breves y las fuentes originales.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    if (groundingChunks.length > 0) {
      const newsItems: NewsItem[] = [];
      const seenUrls = new Set<string>();

      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && !seenUrls.has(chunk.web.uri)) {
          seenUrls.add(chunk.web.uri);
          newsItems.push({
            title: chunk.web.title || "Noticia de actualidad en Alicante",
            url: chunk.web.uri,
            source: new URL(chunk.web.uri).hostname.replace('www.', '').split('.')[0].toUpperCase()
          });
        }
      });

      return newsItems.length > 0 ? newsItems : getFallbackNews('ALICANTE');
    }

    return getFallbackNews('ALICANTE');
  } catch (error) {
    console.error("Error fetching Alicante news:", error);
    return getFallbackNews('ALICANTE');
  }
};

/**
 * Obtiene noticias sobre el mundo de la radio y tecnología broadcast.
 */
export const fetchRadioNews = async (): Promise<NewsItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca las 6 noticias más relevantes sobre emisoras de radio, tecnología broadcast, radio digital (DAB+) y podcasts en España y el mundo.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    if (groundingChunks.length > 0) {
      const newsItems: NewsItem[] = [];
      const seenUrls = new Set<string>();

      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && !seenUrls.has(chunk.web.uri)) {
          seenUrls.add(chunk.web.uri);
          newsItems.push({
            title: chunk.web.title || "Actualidad Radio / Broadcast",
            url: chunk.web.uri,
            source: new URL(chunk.web.uri).hostname.replace('www.', '').split('.')[0].toUpperCase()
          });
        }
      });

      return newsItems.length > 0 ? newsItems : getFallbackNews('RADIO');
    }

    return getFallbackNews('RADIO');
  } catch (error) {
    console.error("Error fetching Radio news:", error);
    return getFallbackNews('RADIO');
  }
};

// Noticias de reserva en caso de error de conexión
const getFallbackNews = (type: 'ALICANTE' | 'RADIO'): NewsItem[] => {
  if (type === 'ALICANTE') {
    return [
      { title: "Sintonizando la actualidad de Alicante en directo...", url: "#", source: "SISTEMA" },
      { title: "Previsión meteorológica: Cielos despejados en la Costa Blanca", url: "https://www.aemet.es", source: "AEMET" },
      { title: "Agenda cultural: Consulta los eventos en el ADDA y el Principal", url: "https://www.alicante.es", source: "AYTO" }
    ];
  } else {
    return [
      { title: "Monitorizando el espectro radiofónico internacional...", url: "#", source: "BROADCAST" },
      { title: "El futuro de la radio digital DAB+ en Europa", url: "https://www.worlddab.org", source: "WORLDDAB" },
      { title: "Innovación en equipos de transmisión y mezcla digital", url: "https://www.nabshow.com", source: "NAB" }
    ];
  }
};
