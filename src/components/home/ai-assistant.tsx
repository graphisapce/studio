
"use client";

import { useState } from "react";
import { supportAssistant } from "@/ai/flows/search-assistant-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, MessageSquare, X, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AIAssistant({ onSuggest }: { onSuggest: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const { toast } = useToast();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await supportAssistant({ query: userMsg });
      setMessages(prev => [...prev, { role: 'bot', text: res.reply }]);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Support Offline",
        description: err.message,
      });
      setMessages(prev => [...prev, { role: 'bot', text: "Maaf kijiye, main abhi offline hoon. Aap baad mein try kar sakte hain." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {isOpen ? (
        <Card className="w-80 md:w-96 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border-2 border-white/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-white/10 text-white"><Headphones className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm font-bold">LocalVyapar Support</CardTitle>
                <p className="text-[10px] opacity-70">Always here to help</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30">
              {messages.length === 0 && (
                <div className="text-center py-10 opacity-50 space-y-2">
                  <MessageSquare className="h-8 w-8 mx-auto" />
                  <p className="text-xs">Namaste! Main LocalVyapar Support AI hoon. <br/>Main apki kaise madad kar sakta hoon?</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-white border rounded-tl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleAsk} className="p-3 border-t bg-background flex gap-2">
              <Input 
                placeholder="Ask anything about the app..." 
                className="text-xs h-10 rounded-full"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
              />
              <Button size="icon" type="submit" className="rounded-full shrink-0" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-xl hover:scale-110 transition-transform bg-primary"
        >
          <Headphones className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
          </span>
        </Button>
      )}
    </div>
  );
}
