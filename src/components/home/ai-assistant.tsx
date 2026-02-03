
"use client";

import { useState } from "react";
import { searchAssistant } from "@/ai/flows/search-assistant-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MessageSquare, X, Loader2, Search } from "lucide-react";
import { BusinessCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const categories: BusinessCategory[] = [
  'Food', 'Groceries', 'Retail', 'Electronics', 'Repairs', 'Services', 
  'Beauty', 'Health', 'Education', 'Automobile', 'Gifts', 'Home Decor', 
  'Clothing', 'Jewelry', 'Hardware', 'Pharmacy', 'Stationery', 'Others'
];

interface AIAssistantProps {
  onSuggest: (category: BusinessCategory | null, search: string) => void;
}

export function AIAssistant({ onSuggest }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);
    try {
      const res = await searchAssistant({ query, categories });
      setResponse(res.suggestion);
      
      if (res.recommendedCategories.length > 0) {
        onSuggest(res.recommendedCategories[0] as BusinessCategory, res.searchKeywords[0] || "");
      } else {
        onSuggest(null, res.searchKeywords[0] || query);
      }
    } catch (err: any) {
      console.error("AI Assistant Error:", err);
      toast({
        variant: "destructive",
        title: "AI Assistant Error",
        description: "Gemini API key check karein.",
      });
      setResponse("Sorry, main abhi apki madad nahi kar pa raha hoon. Kripya baad mein try karein.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {isOpen ? (
        <Card className="w-80 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between rounded-t-lg">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> LocalVyapar AI Helper
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {response && (
              <div className="bg-muted p-3 rounded-lg text-xs leading-relaxed border border-primary/10 flex gap-2">
                <div className="mt-0.5"><MessageSquare className="h-3 w-3 text-primary" /></div>
                <div>{response}</div>
              </div>
            )}
            <form onSubmit={handleAsk} className="flex gap-2">
              <Input 
                placeholder="Ex: Sasta mobile repair kahan hai?" 
                className="text-xs h-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
              />
              <Button size="sm" type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center">Aapka personal hyperlocal guide</p>
          </CardContent>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-xl hover:scale-110 transition-transform bg-primary"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
