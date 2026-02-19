
import { GoogleGenAI, Type } from "@google/genai";

// Inicialización según directrices
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
 * Se mantiene para información del estudio.
 */
export const fetchAlicanteWeather = async (): Promise<WeatherData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca la temperatura actual exacta en grados Celsius y el estado del cielo en la ciudad de Alicante, España. Responde exclusivamente con un objeto JSON válido con este formato: {\"temp\": \"XX°C\", \"condition\": \"Estado del cielo\"}",
      config: {
        tools: [{ googleSearch: {} }],
        // Usamos JSON mode para evitar errores de parseo
        responseMimeType: "application/json"
      },
    });
    
    const data = JSON.parse(response.text);
    return {
      temp: data.temp || "--°C",
      condition: data.condition || "Sincronizado"
    };
  } catch (error) {
    console.error("Error fetching Alicante weather:", error);
    return { temp: "--°C", condition: "Alicante" };
  }
};

/**
 * Obtiene las noticias más recientes sobre la RADIO EN ESPAÑA.
 * Actualización permanente mediante Google Search consultando multitud de fuentes.
 */
export const fetchRadioNews = async (): Promise<NewsItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca las últimas noticias de HOY sobre la industria de la radio en España. Incluye información sobre emisoras (SER, COPE, Onda Cero, RNE, esRadio, RAC1, Catalunya Ràdio, Los40, Dial, Rock FM), cambios en el dial FM/DAB+, fichajes de locutores, datos del EGM, podcasts de éxito y tecnología broadcast en España. Fuentes obligatorias: Gorka Zumeta (gorkazumeta.com), PRNoticias, El Español (sección medios), El Confidencial Digital, Dircomfidencial, Audiovisual451, Todo TV News, Panorama Audiovisual, Cine y Tele, El Mundo (comunicación), El País (medios).",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const newsItems: NewsItem[] = [];
    const seenUrls = new Set<string>();

    if (groundingChunks.length > 0) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title && !seenUrls.has(chunk.web.uri)) {
          seenUrls.add(chunk.web.uri);
          newsItems.push({
            title: chunk.web.title.replace(/ - .*$/, '').trim(),
            url: chunk.web.uri,
            source: new URL(chunk.web.uri).hostname.replace('www.', '').split('.')[0].toUpperCase()
          });
        }
      });
    }

    if (newsItems.length === 0) {
      return getFallbackNews('RADIO_ES');
    }

    return newsItems.slice(0, 12); // Más noticias para un teletipo más rico
  } catch (error) {
    console.error("Error fetching Radio Spain news:", error);
    return getFallbackNews('RADIO_ES');
  }
};

/**
 * Genera un nombre creativo para el mix utilizando Gemini 3 Flash.
 */
export const generateMixName = async (trackA: string, trackB: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `He creado un mix de radio uniendo: "${trackA}" y "${trackB}". Genera un título creativo y corto para el archivo de audio. Responde solo el título.`,
    });
    return response.text.trim();
  } catch (error) {
    return `Mix Alicante - ${new Date().toLocaleDateString()}`;
  }
};

const getFallbackNews = (type: 'RADIO_ES' | 'RADIO'): NewsItem[] => {
  return [
    { title: "Sintonizando la actualidad de la radio en España: SER, COPE, Onda Cero, RNE, esRadio y más...", url: "#", source: "RADIO_ES" },
    { title: "Gorka Zumeta: Análisis de la última hora en el sector radiofónico y podcasting nacional", url: "https://www.gorkazumeta.com", source: "ZUMETA" },
    { title: "PRNoticias: Fichajes, audiencias y movimientos en los grandes grupos de comunicación", url: "https://prnoticias.com", source: "PRNOTICIAS" },
    { title: "DAB+ en España: Expansión de la radio digital terrestre en nuevas provincias", url: "#", source: "BROADCAST" },
    { title: "EGM: Próxima oleada de audiencias y tendencias de consumo de audio digital", url: "#", source: "AUDIENCIA" }
  ];
};
