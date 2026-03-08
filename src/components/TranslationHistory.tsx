import { useEffect, useState } from "react";
import { History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Translation {
  id: string;
  source_lang: string;
  source_text: string;
  translated_text: string;
  created_at: string;
}

interface Props {
  refreshKey: number;
}

const TranslationHistory = ({ refreshKey }: Props) => {
  const [history, setHistory] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    supabase
      .from("translations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHistory((data as Translation[]) || []);
        setLoading(false);
      });
  }, [show, refreshKey]);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <History className="w-4 h-4" />
        {show ? "Hide History" : "Translation History"}
      </button>

      {show && (
        <div className="rounded-2xl bg-card p-4 shadow-sm space-y-3 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No translations yet.</p>
          ) : (
            history.map((t) => (
              <div key={t.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-accent-foreground capitalize">{t.source_lang}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground">{t.source_text}</p>
                <p className="text-sm text-muted-foreground">→ {t.translated_text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TranslationHistory;
