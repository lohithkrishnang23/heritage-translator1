import { useState, useRef, useCallback } from "react";
import { Languages, Pen, Mic, ScanLine, ArrowRightLeft, X, ChevronDown, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";
import { supabase } from "@/integrations/supabase/client";
import { languages, langKeys, translateViaApi, LangKey } from "@/lib/translation";
import TranslationHistory from "@/components/TranslationHistory";

const Index = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [selectedLang, setSelectedLang] = useState<LangKey>("kannada");
  const [status, setStatus] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const doTranslate = useCallback(async (text: string, lang?: LangKey) => {
    const t = text.trim();
    if (!t) return;
    setIsTranslating(true);
    setStatus("Translating...");
    setOutput("");
    const usedLang = lang ?? selectedLang;
    try {
      const result = await translateViaApi(t, languages[usedLang].apiCode);
      setOutput(result);
      setStatus("");
      // Save to history
      await supabase.from("translations").insert({
        source_lang: languages[usedLang].label,
        source_text: t,
        translated_text: result,
      });
      setHistoryRefresh((n) => n + 1);
    } catch {
      setOutput("");
      setStatus("Unable to translate. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  }, [selectedLang]);

  const handleTranslate = () => doTranslate(input);

  const handleRecord = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus("Speech recognition not supported in this browser."); return; }
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); return; }
    const r = new SR();
    r.lang = languages[selectedLang].speechCode;
    r.interimResults = false;
    r.continuous = false;
    recognitionRef.current = r;
    r.onstart = () => { setIsListening(true); setStatus("Listening..."); };
    r.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setStatus(`Heard: "${transcript}" — translating...`);
      setIsListening(false);
      await doTranslate(transcript);
    };
    r.onerror = (e: any) => {
      setIsListening(false);
      setStatus(e.error === "not-allowed" ? "Microphone permission denied." : `Error: ${e.error}`);
    };
    r.onend = () => setIsListening(false);
    r.start();
  }, [isListening, selectedLang, doTranslate]);

  const openCamera = useCallback(async () => {
    setShowCamera(true); setStatus("Opening camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("Point at text and tap Capture.");
    } catch { setStatus("Camera permission denied."); setShowCamera(false); }
  }, []);

  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null; setShowCamera(false); setStatus("");
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    setIsScanning(true); setStatus("Scanning text...");
    try {
      const { data } = await Tesseract.recognize(c, "eng");
      const text = data.text.trim();
      if (text) {
        setInput(text);
        closeCamera();
        setIsScanning(false);
        await doTranslate(text);
      } else {
        setStatus("No text detected. Try again.");
        setIsScanning(false);
      }
    } catch {
      setStatus("OCR failed. Please try again.");
      setIsScanning(false);
      closeCamera();
    }
  }, [closeCamera, doTranslate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-foreground/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-card font-semibold">Scan Text</span>
              <button onClick={closeCamera} className="text-card"><X className="w-6 h-6" /></button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl" />
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={captureAndScan} disabled={isScanning}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg disabled:opacity-50">
              {isScanning ? "Scanning..." : "Capture"}
            </button>
          </div>
        </div>
      )}

      {showLangPicker && (
        <div className="fixed inset-0 z-40 bg-foreground/40 flex items-end justify-center p-4"
          onClick={() => setShowLangPicker(false)}>
          <div className="w-full max-w-md bg-card rounded-t-3xl rounded-b-2xl p-4 space-y-1 max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2">
              Select Heritage Language
            </p>
            {langKeys.map((key) => (
              <button key={key}
                onClick={() => { setSelectedLang(key); setShowLangPicker(false); setInput(""); setOutput(""); setStatus(""); }}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${
                  key === selectedLang ? "bg-primary text-primary-foreground" : "text-card-foreground hover:bg-secondary"
                }`}>
                {languages[key].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center justify-center gap-2 pt-2">
          <Languages className="w-7 h-7 text-accent-foreground" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Translator</h1>
        </div>
        <p className="text-center text-sm text-muted-foreground">AI Heritage Language Translator</p>

        {status && (
          <div className="rounded-2xl bg-card p-3 shadow-sm text-center text-sm font-medium text-card-foreground flex items-center justify-center gap-2">
            {(isTranslating || isListening) && <Loader2 className="w-4 h-4 animate-spin" />}
            {status}
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm">
          <button onClick={() => setShowLangPicker(true)}
            className="flex items-center gap-1 font-medium text-sm text-card-foreground hover:text-foreground transition-colors">
            {languages[selectedLang].label}
            <ChevronDown className="w-4 h-4" />
          </button>
          <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-sm text-card-foreground">English</span>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {languages[selectedLang].label}
          </label>
          <textarea
            className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground text-lg min-h-[100px]"
            placeholder={`Type in ${languages[selectedLang].label}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleTranslate())}
          />
        </div>

        <button onClick={handleTranslate} disabled={isTranslating}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-md hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {isTranslating && <Loader2 className="w-5 h-5 animate-spin" />}
          {isTranslating ? "Translating..." : "Translate"}
        </button>

        <div className="rounded-2xl bg-card p-4 shadow-sm space-y-2 min-h-[100px]">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">English</label>
          <p className="text-lg text-foreground whitespace-pre-wrap">
            {output || <span className="text-muted-foreground">Translation will appear here...</span>}
          </p>
        </div>

        <TranslationHistory refreshKey={historyRefresh} />

        <div className="flex justify-around pt-2 pb-4">
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><Pen className="w-5 h-5" /></div>
            <span className="text-xs font-medium">Write</span>
          </button>
          <button onClick={handleRecord} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isListening ? "bg-destructive text-destructive-foreground" : "bg-secondary"}`}>
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">{isListening ? "Stop" : "Record"}</span>
          </button>
          <button onClick={openCamera} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><ScanLine className="w-5 h-5" /></div>
            <span className="text-xs font-medium">Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
