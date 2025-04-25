import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Settings,
} from "lucide-react";

interface LogMessage {
  id: string;
  timestamp: string;
  type: "survey" | "system" | "warning" | "error" | "info";
  message: string;
  details?: string;
  data?: Record<string, any>;
}

interface MessageLogProps {
  messages?: LogMessage[];
  onFilterChange?: (filters: Record<string, boolean>) => void;
  onSearch?: (term: string) => void;
  onExport?: () => void;
  onClear?: () => void;
}

const MessageLog = ({
  messages = [],

  onFilterChange = () => {},
  onSearch = () => {},
  onExport = () => {},
  onClear = () => {},
}: MessageLogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    survey: true,
    system: true,
    warning: true,
    error: true,
    info: true,
  });

  const handleFilterChange = (filterType: string) => {
    const newFilters = {
      ...activeFilters,
      [filterType]: !activeFilters[filterType as keyof typeof activeFilters],
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "survey":
        return <Info className="h-4 w-4 text-blue-400" />;
      case "system":
        return <Settings className="h-4 w-4 text-gray-400" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getMessageBadgeColor = (type: string) => {
    switch (type) {
      case "survey":
        return "bg-blue-900/30 text-blue-400 border-blue-800";
      case "system":
        return "bg-gray-900/30 text-gray-400 border-gray-800";
      case "warning":
        return "bg-amber-900/30 text-amber-400 border-amber-800";
      case "error":
        return "bg-red-900/30 text-red-400 border-red-800";
      case "info":
        return "bg-green-900/30 text-green-400 border-green-800";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const filteredMessages = messages.filter(
    (msg) => activeFilters[msg.type as keyof typeof activeFilters],
  );

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden flex flex-col resizable">
      <CardHeader className="p-3 pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            WITS Message Log
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
              onClick={onClear}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-300 focus-visible:ring-blue-600"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-gray-800 hover:bg-gray-700"
          >
            <Search className="h-3.5 w-3.5 text-gray-400" />
          </Button>
        </form>

        <div className="flex gap-1 mt-2 flex-wrap">
          {Object.entries(activeFilters).map(([type, active]) => (
            <Badge
              key={type}
              variant="outline"
              className={`text-xs cursor-pointer ${active ? getMessageBadgeColor(type) : "bg-gray-900 text-gray-500 border-gray-800"}`}
              onClick={() => handleFilterChange(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <Tabs defaultValue="messages" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 h-8 bg-gray-800 mx-3 mb-0">
          <TabsTrigger value="messages" className="text-xs h-7">
            Messages
          </TabsTrigger>
          <TabsTrigger value="surveys" className="text-xs h-7">
            Surveys
          </TabsTrigger>
        </TabsList>

        <CardContent className="p-0 flex-1 overflow-hidden">
          <TabsContent
            value="messages"
            className="h-full m-0 data-[state=active]:flex flex-col"
          >
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2 rounded bg-gray-800/50 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getMessageIcon(msg.type)}
                        <Badge
                          variant="outline"
                          className={`text-xs ${getMessageBadgeColor(msg.type)}`}
                        >
                          {msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-1">{msg.message}</p>
                    {msg.details && (
                      <p className="text-xs text-gray-500">{msg.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="surveys"
            className="h-full m-0 data-[state=active]:flex flex-col"
          >
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {filteredMessages
                  .filter((msg) => msg.type === "survey")
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className="p-2 rounded bg-gray-800/50 border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getMessageIcon(msg.type)}
                          <Badge
                            variant="outline"
                            className={`text-xs ${getMessageBadgeColor(msg.type)}`}
                          >
                            Survey
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-1">
                        {msg.message}
                      </p>
                      {msg.details && (
                        <p className="text-xs text-gray-500">{msg.details}</p>
                      )}
                      {msg.data && (
                        <div className="mt-2 pt-2 border-t border-gray-800">
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(msg.data).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <p className="text-xs text-gray-500">{key}</p>
                                <p className="text-sm font-medium text-blue-400">
                                  {typeof value === "number"
                                    ? value.toFixed(1)
                                    : value}
                                  {key === "inclination" || key === "azimuth"
                                    ? "°"
                                    : ""}
                                  {key === "tvd" ? "m" : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default MessageLog;
