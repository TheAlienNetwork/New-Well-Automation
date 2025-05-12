import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { OppSupportAI } from "./OppSupportAI";

export const OppSupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="fixed top-65 right-0 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white border-purple-500 rounded-r-none rounded-l-md px-3 py-6 transform -rotate-90 origin-bottom-right shadow-lg z-50 transition-all duration-200 hover:shadow-xl"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquareText className="h-4 w-4 mr-2" />
        <span>Opp Support</span>
      </Button>

      <OppSupportAI isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
