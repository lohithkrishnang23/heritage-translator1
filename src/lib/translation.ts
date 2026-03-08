export type LangKey = "kannada" | "tamil" | "telugu" | "malayalam" | "hindi" | "marathi" | "bengali" | "gujarati" | "punjabi" | "odia";

export interface LangConfig {
  label: string;
  speechCode: string;
  apiCode: string;
}

export const languages: Record<LangKey, LangConfig> = {
  kannada:   { label: "Kannada",   speechCode: "kn-IN", apiCode: "kn" },
  tamil:     { label: "Tamil",     speechCode: "ta-IN", apiCode: "ta" },
  telugu:    { label: "Telugu",    speechCode: "te-IN", apiCode: "te" },
  malayalam: { label: "Malayalam", speechCode: "ml-IN", apiCode: "ml" },
  hindi:     { label: "Hindi",     speechCode: "hi-IN", apiCode: "hi" },
  marathi:   { label: "Marathi",   speechCode: "mr-IN", apiCode: "mr" },
  bengali:   { label: "Bengali",   speechCode: "bn-IN", apiCode: "bn" },
  gujarati:  { label: "Gujarati",  speechCode: "gu-IN", apiCode: "gu" },
  punjabi:   { label: "Punjabi",   speechCode: "pa-IN", apiCode: "pa" },
  odia:      { label: "Odia",      speechCode: "or-IN", apiCode: "or" },
};

export const langKeys = Object.keys(languages) as LangKey[];

export async function translateViaApi(text: string, langCode: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langCode}|en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API request failed");
  const data = await res.json();
  if (data.responseStatus !== 200 && data.responseStatus !== "200") {
    throw new Error(data.responseDetails || "Translation failed");
  }
  return data.responseData.translatedText;
}
