import React, { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSurveys } from "@/context/SurveyContext";
import { useWits } from "@/context/WitsContext";
import {
  MessageSquareText,
  Send,
  AlertCircle,
  CheckCircle,
  User,
  Bot,
  Loader2,
} from "lucide-react";

interface OppSupportAIProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export const OppSupportAI = ({ isOpen, onClose }: OppSupportAIProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your Opp Support AI assistant. How can I help you with your drilling operations today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { surveys } = useSurveys();
  const { witsData, isConnected } = useWits();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate AI response based on user input and context
  const generateResponse = async (userMessage: string) => {
    setIsLoading(true);

    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let response = "";

    // Check for survey-related questions
    if (userMessage.toLowerCase().includes("survey")) {
      if (surveys && surveys.length > 0) {
        const latestSurvey = [...surveys].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )[0];

        response = `Based on the latest survey data (${new Date(latestSurvey.timestamp).toLocaleString()}), 
          the bit depth is ${latestSurvey.bitDepth.toFixed(2)} ft, 
          inclination is ${latestSurvey.inclination.toFixed(2)}°, 
          and azimuth is ${latestSurvey.azimuth.toFixed(2)}°. 
          The quality check status is ${latestSurvey.qualityCheck?.status || "unknown"}.`;
      } else {
        response =
          "I don't see any survey data available. Would you like me to help you take a new survey?";
      }
    }
    // Check for WITS-related questions
    else if (
      userMessage.toLowerCase().includes("wits") ||
      userMessage.toLowerCase().includes("connection")
    ) {
      if (isConnected) {
        response =
          "The WITS connection is currently active. Real-time data is being received.";
        if (witsData) {
          response += ` Current bit depth is ${witsData.bitDepth?.toFixed(2) || "unknown"} ft, 
            ROP is ${witsData.rop?.toFixed(2) || "unknown"} ft/hr, 
            and WOB is ${witsData.wob?.toFixed(2) || "unknown"} klbs.`;
        }
      } else {
        response =
          "The WITS connection is currently inactive. Would you like help setting up a connection?";
      }
    }
    // Check for directional drilling questions
    else if (
      userMessage.toLowerCase().includes("directional") ||
      userMessage.toLowerCase().includes("steering") ||
      userMessage.toLowerCase().includes("trajectory")
    ) {
      response =
        "For directional drilling operations, I recommend monitoring your toolface orientation and dogleg severity closely. ";
      if (surveys && surveys.length > 1) {
        response +=
          "Based on recent surveys, your build rate and turn rate appear to be within normal parameters. ";
      }
      response += "Would you like me to analyze your current trajectory plan?";
    }
    // Default response for other queries
    else {
      response =
        "I'm here to help with your drilling operations. I can provide information about surveys, WITS data, directional drilling, and more. What specific information are you looking for?";
    }

    setIsLoading(false);

    return response;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Generate AI response
    const aiResponse = await generateResponse(input);

    // Add AI message
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: aiResponse,
      sender: "ai",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-[400px] sm:w-[540px] bg-gray-900 border-gray-800 text-gray-200 p-0 overflow-hidden"
        side="right"
      >
        <SheetHeader className="p-4 border-b border-gray-800">
          <SheetTitle className="text-gray-200 flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-blue-400" />
            Opp Support AI
            <Badge
              variant="outline"
              className="ml-2 bg-blue-900/30 text-blue-400 border-blue-800"
            >
              Beta
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-10rem)]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4 text-blue-400" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-200 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-400" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs opacity-70">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-gray-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about surveys, WITS data, or drilling operations..."
                className="flex-1 bg-gray-800 border-gray-700 text-gray-200"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
