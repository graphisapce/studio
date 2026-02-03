
"use client";

import { useState } from "react";
import { BusinessGrid } from "@/components/home/business-grid";
import { AIAssistant } from "@/components/home/ai-assistant";
import { BusinessCategory } from "@/lib/types";

export default function HomePage() {
  const [filter, setFilter] = useState<{ category: BusinessCategory | null, search: string }>({
    category: null,
    search: ""
  });

  const handleAISuggestion = (category: BusinessCategory | null, search: string) => {
    setFilter({ category, search });
  };

  return (
    <main className="relative">
      <BusinessGrid 
        externalCategory={filter.category} 
        externalSearch={filter.search} 
      />
      <AIAssistant onSuggest={handleAISuggestion} />
    </main>
  );
}
