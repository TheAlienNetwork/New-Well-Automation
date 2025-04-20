import React, { useState, useRef, useEffect, useCallback } from "react";
// Import the correct component path
import Header from "@/components/dashboard/Header";
import StatusBar from "@/components/dashboard/StatusBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useSurveys } from "@/context/SurveyContext";
import { useWits } from "@/context/WitsContext";
import { Label } from "@/components/ui/label";
import {
  Brain,
  Mic,
  Send,
  HelpCircle,
  AlertTriangle,
  Wrench,
  Zap,
  BookOpen,
  FileText,
  Lightbulb,
  Volume2,
  VolumeX,
  Settings,
  Download,
  BarChart3,
  X,
  Bell,
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
  spoken?: boolean;
}

// Email utility function to generate and send automated emails
const generateEmailContent = (survey, status) => {
  const subject =
    status === "warning"
      ? `Survey Warning - Depth ${survey.bitDepth.toFixed(1)} ft`
      : `CRITICAL: Survey Failure - Depth ${survey.bitDepth.toFixed(1)} ft`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: ${status === "warning" ? "#f59e0b" : "#ef4444"}; margin-top: 0;">
        ${status === "warning" ? "Survey Warning" : "CRITICAL: Survey Failure"}
      </h2>
      <p><strong>Timestamp:</strong> ${new Date(survey.timestamp).toLocaleString()}</p>
      <p><strong>Measured Depth:</strong> ${survey.bitDepth.toFixed(2)} ft</p>
      <p><strong>Issue:</strong> ${survey.qualityCheck?.message || "Unknown issue"}</p>
      <h3 style="margin-top: 20px;">Survey Details:</h3>
      <ul style="padding-left: 20px;">
        <li><strong>Inclination:</strong> ${survey.inclination?.toFixed(2)}°</li>
        <li><strong>Azimuth:</strong> ${survey.azimuth?.toFixed(2)}°</li>
        <li><strong>Tool Face:</strong> ${survey.toolFace?.toFixed(2)}°</li>
        <li><strong>Tool Temp:</strong> ${survey.toolTemp?.toFixed(2)}°F</li>
      </ul>
      <p style="margin-top: 20px; padding: 10px; background-color: ${status === "warning" ? "#fef3c7" : "#fee2e2"}; border-radius: 4px;">
        <strong>Action Required:</strong> Please review this survey data and take appropriate action.
      </p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
        This is an automated message from the MWD Surface Software. Do not reply to this email.
      </p>
    </div>
  `;

  return { subject, body };
};

const sendAutomatedEmail = (survey, status, recipients) => {
  const { subject, body } = generateEmailContent(survey, status);

  // In a real implementation, this would call an API to send the email
  console.log("Auto-sending email about survey issue", {
    survey,
    status,
    recipients,
    subject,
    bodyPreview: body.substring(0, 100) + "...",
  });

  // For demonstration purposes, we'll simulate opening an email client
  // This would be replaced with an actual API call in production
  try {
    const mailtoUrl = `mailto:${recipients.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/<[^>]*>/g, ""))}`;
    // In a real implementation, we would use a server-side API instead of mailto
    // window.open(mailtoUrl, '_blank');
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
};

const OppSupportPage = () => {
  const { toast } = useToast();
  const { surveys } = useSurveys();
  const {
    witsData,
    isConnected,
    isReceiving,
    connect,
    disconnect,
    connectionConfig,
    updateConfig,
  } = useWits();

  // TCP/IP Connection settings
  const [tcpIpSettings, setTcpIpSettings] = useState({
    ipAddress: connectionConfig.ipAddress,
    port: connectionConfig.port,
    protocol: connectionConfig.protocol,
    autoConnect: connectionConfig.autoConnect,
  });
  const [showConnectionSettings, setShowConnectionSettings] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      text: "Hello, I'm Opp Support, your AI drilling assistant. How can I help you today?",
      timestamp: new Date(),
      spoken: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(() => {
    // Try to load settings from localStorage
    const savedSettings = localStorage.getItem(
      "oppSupportNotificationSettings",
    );
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error("Failed to parse saved notification settings", e);
      }
    }
    // Default settings if nothing is saved
    return {
      notifyOnWarning: true,
      notifyOnFail: true,
      autoSendEmail: false,
      emailRecipients: ["operations@newwelltech.com"],
    };
  });
  const [surveyNotifications, setSurveyNotifications] = useState<
    {
      id: string;
      status: "warning" | "fail";
      message: string;
      timestamp: Date;
      acknowledged: boolean;
    }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Handle TCP/IP connection settings change
  const handleConnectionSettingChange = (setting: string, value: any) => {
    setTcpIpSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  // Apply TCP/IP connection settings
  const applyConnectionSettings = () => {
    updateConfig({
      ipAddress: tcpIpSettings.ipAddress,
      port: tcpIpSettings.port,
      protocol: tcpIpSettings.protocol,
      autoConnect: tcpIpSettings.autoConnect,
    });

    toast({
      title: "Connection Settings Updated",
      description: "WITS connection settings have been updated.",
    });

    setShowConnectionSettings(false);

    // Connect if not already connected
    if (!isConnected && tcpIpSettings.autoConnect) {
      connect();
    }
  };

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();
      // Set a more natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) => voice.name.includes("Daniel") || voice.name.includes("Male"),
      );
      if (preferredVoice) {
        speechSynthesisRef.current.voice = preferredVoice;
      }
      speechSynthesisRef.current.rate = voiceSpeed;
      speechSynthesisRef.current.volume = voiceVolume / 100;
    }

    // Speak welcome message
    if (voiceEnabled && messages.length === 1 && !messages[0].spoken) {
      speakText(messages[0].text);
      setMessages((prev) => [{ ...prev[0], spoken: true }, ...prev.slice(1)]);
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Monitor surveys for warnings and failures
  useEffect(() => {
    if (surveys.length === 0) return;

    // Check the most recent survey for warnings or failures
    const latestSurvey = surveys[0];

    if (!latestSurvey.qualityCheck) return;

    const { status, message } = latestSurvey.qualityCheck;

    // Only process warning or fail statuses
    if (status !== "warning" && status !== "fail") return;

    // Check if we already have a notification for this survey
    const existingNotification = surveyNotifications.find(
      (n) => n.id === latestSurvey.id,
    );
    if (existingNotification) return;

    // Add new notification
    const newNotification = {
      id: latestSurvey.id,
      status: status as "warning" | "fail",
      message,
      timestamp: new Date(latestSurvey.timestamp),
      acknowledged: false,
    };

    setSurveyNotifications((prev) => [newNotification, ...prev]);

    // Show toast notification
    if (
      (status === "warning" && notificationSettings.notifyOnWarning) ||
      (status === "fail" && notificationSettings.notifyOnFail)
    ) {
      toast({
        title: status === "warning" ? "Survey Warning" : "Survey Failure",
        description: message,
        variant: status === "warning" ? "default" : "destructive",
      });

      // Add AI message about the survey issue
      const aiMessage = {
        id: Date.now().toString(),
        type: "ai" as const,
        text: `Alert: ${status === "warning" ? "Warning" : "Critical issue"} detected in recent survey at depth ${latestSurvey.bitDepth.toFixed(1)} ft. ${message} Would you like me to analyze this further?`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Speak the alert if voice is enabled
      if (voiceEnabled) {
        speakText(aiMessage.text);
      }

      // Auto-send email if enabled and it's a failure or warning based on settings
      if (
        (status === "fail" &&
          notificationSettings.notifyOnFail &&
          notificationSettings.autoSendEmail) ||
        (status === "warning" &&
          notificationSettings.notifyOnWarning &&
          notificationSettings.autoSendEmail)
      ) {
        // Generate and send the email
        sendAutomatedEmail(
          latestSurvey,
          status,
          notificationSettings.emailRecipients,
        );
        toast({
          title: "Email Sent",
          description: `Notification email sent to ${notificationSettings.emailRecipients.join(", ")}`,
        });
      }
    }
  }, [surveys, notificationSettings, voiceEnabled]);

  // Update speech synthesis settings when they change
  useEffect(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.rate = voiceSpeed;
      speechSynthesisRef.current.volume = voiceVolume / 100;
    }
  }, [voiceSpeed, voiceVolume]);

  // Function to speak text
  const speakText = (text: string) => {
    if (!voiceEnabled || !speechSynthesisRef.current) return;

    // Cancel any ongoing speech
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      // Set the text and speak
      speechSynthesisRef.current.text = text;
      window.speechSynthesis.speak(speechSynthesisRef.current);
    }
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: inputText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Simulate AI thinking and responding
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.text);
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        text: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Speak the response
      speakText(aiResponse);

      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 1500);
  };

  // Generate AI response based on user input
  const generateAIResponse = (userText: string) => {
    const userTextLower = userText.toLowerCase();

    // If we have a real WITS connection, use real data in responses
    if (isConnected && isReceiving) {
      if (userTextLower.includes("vibration")) {
        return `The high vibration readings on the lateral sensor are currently at ${witsData.vibration.lateral.toFixed(1)}%, axial at ${witsData.vibration.axial.toFixed(1)}%, and torsional at ${witsData.vibration.torsional.toFixed(1)}%. This could be caused by several factors: 1) Improper stabilization in the BHA, 2) Formation changes causing stick-slip, or 3) Worn out shock subs. Based on the current data, I recommend reducing WOB by 10% and monitoring the response.`;
      } else if (
        userTextLower.includes("signal loss") ||
        userTextLower.includes("mwd signal")
      ) {
        return `To troubleshoot MWD signal loss, follow these steps: 1) Check surface equipment connections, 2) Verify mud pulse decoder settings, 3) Ensure adequate flow rate (current flow is ${witsData.flowRate.toFixed(0)} gpm, minimum recommended is 600 gpm), 4) Check for potential washout indicators. The current signal strength is ${witsData.signalQuality}%, which is ${witsData.signalQuality > 80 ? "good" : "concerning"}.`;
      } else if (
        userTextLower.includes("magnetometer") ||
        userTextLower.includes("calibrat")
      ) {
        return `For magnetometer recalibration, the recommended procedure is: 1) Pull out to a known non-magnetic environment, 2) Run the calibration sequence with the tool stationary for at least 5 minutes, 3) Verify readings against reference values. The current magnetic field strength is ${witsData.magneticField.toFixed(2)} μT, which is within expected range, but the dip angle variation of ±1.2° suggests recalibration may be beneficial.`;
      } else if (
        userTextLower.includes("tool failure") ||
        userTextLower.includes("prediction")
      ) {
        return `The current tool failure prediction shows a ${Math.round(100 - witsData.batteryLevel)}% risk with the MWD Battery having the highest risk factor at ${Math.round(100 - witsData.batteryLevel)}%. The estimated time to failure is approximately ${Math.round(witsData.batteryLevel / 2)} hours. I recommend scheduling a battery replacement during the next connection. The temperature trend shows a ${(witsData.toolTemp - 160).toFixed(1)}°F increase over the last 6 hours, which is contributing to the prediction.`;
      } else if (
        userTextLower.includes("magnetic interference") ||
        userTextLower.includes("formation")
      ) {
        return `The magnetic interference in the current formation is likely due to the high iron content in the shale layer you're currently drilling through (${witsData.bitDepth.toFixed(0)}-${(witsData.bitDepth - 500).toFixed(0)} ft). The gamma readings confirm this with values between ${(witsData.gamma - 10).toFixed(0)}-${(witsData.gamma + 10).toFixed(0)} API units. To mitigate this, I recommend: 1) Increase survey spacing to 90 ft, 2) Use multi-station analysis for surveys, 3) Apply the enhanced magnetic correction algorithm in the software settings.`;
      }
    }

    // Default responses if not connected or for other queries
    if (userTextLower.includes("vibration")) {
      return "The high vibration readings on the lateral sensor could be caused by several factors: 1) Improper stabilization in the BHA, 2) Formation changes causing stick-slip, or 3) Worn out shock subs. Based on the current data, I recommend reducing WOB by 10% and monitoring the response. The AI analytics show a 42% lateral vibration which is above the recommended threshold of 30%.";
    } else if (
      userTextLower.includes("signal loss") ||
      userTextLower.includes("mwd signal")
    ) {
      return "To troubleshoot MWD signal loss, follow these steps: 1) Check surface equipment connections, 2) Verify mud pulse decoder settings, 3) Ensure adequate flow rate (current flow is 650 gpm, minimum recommended is 600 gpm), 4) Check for potential washout indicators. The current signal strength is 85%, which is good, but noise filtering could be increased from 30% to 50% to improve signal clarity.";
    } else if (
      userTextLower.includes("magnetometer") ||
      userTextLower.includes("calibrat")
    ) {
      return "For magnetometer recalibration, the recommended procedure is: 1) Pull out to a known non-magnetic environment, 2) Run the calibration sequence with the tool stationary for at least 5 minutes, 3) Verify readings against reference values. The current magnetic field strength is 48.32 μT, which is within expected range, but the dip angle variation of ±1.2° suggests recalibration may be beneficial.";
    } else if (
      userTextLower.includes("tool failure") ||
      userTextLower.includes("prediction")
    ) {
      return "The current tool failure prediction shows a 23% risk with the MWD Battery having the highest risk factor at 42%. The estimated time to failure is approximately 48 hours. I recommend scheduling a battery replacement during the next connection. The temperature trend shows a 1.5°F increase over the last 6 hours, which is contributing to the prediction.";
    } else if (
      userTextLower.includes("magnetic interference") ||
      userTextLower.includes("formation")
    ) {
      return "The magnetic interference in the current formation is likely due to the high iron content in the shale layer you're currently drilling through (8000-7500 ft). The gamma readings confirm this with values between 80-120 API units. To mitigate this, I recommend: 1) Increase survey spacing to 90 ft, 2) Use multi-station analysis for surveys, 3) Apply the enhanced magnetic correction algorithm in the software settings.";
    } else if (
      userTextLower.includes("hey opp support") ||
      userTextLower.includes("hello") ||
      userTextLower.includes("hi")
    ) {
      return "Hello! I'm Opp Support, your AI drilling assistant. How can I help you with your MWD or directional drilling questions today?";
    } else if (
      userTextLower.includes("wits") ||
      userTextLower.includes("connection") ||
      userTextLower.includes("connected")
    ) {
      return `The WITS connection is currently ${isConnected ? "established" : "not established"}${isConnected ? (isReceiving ? " and receiving data" : " but not receiving data") : ""}. ${isConnected ? `Current connection: ${connectionConfig.ipAddress}:${connectionConfig.port} using ${connectionConfig.protocol} protocol.` : "You can establish a connection using the TCP/IP settings in the left panel."}`;
    } else {
      return (
        "I understand you're asking about " +
        userText.split(" ").slice(0, 3).join(" ") +
        "... Based on the current drilling parameters and survey data, I recommend checking the latest AI analytics for insights. Would you like me to provide specific information about tool performance, survey quality, or drilling parameters?"
      );
    }
  };

  // Simulate speech recognition
  const startListening = () => {
    setIsListening(true);
    // Simulate voice recognition after 2 seconds
    setTimeout(() => {
      const recognizedText = getRandomQuestion();
      setInputText(recognizedText);
      setIsListening(false);
    }, 2000);
  };

  // Get a random question for demo purposes
  const getRandomQuestion = () => {
    const questions = [
      "What could be causing the high vibration readings on the lateral sensor?",
      "How do I troubleshoot MWD signal loss?",
      "What's the recommended procedure for recalibrating the magnetometers?",
      "Can you explain the current tool failure prediction?",
      "What's causing the magnetic interference in the current formation?",
      "What's the status of our WITS connection?",
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  };

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Handle topic selection
  const handleTopicSelect = (topic: string) => {
    setActiveTopic(topic === activeTopic ? null : topic);
  };

  // Toggle voice output
  const toggleVoice = () => {
    if (
      voiceEnabled &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Handle acknowledging a notification
  const acknowledgeNotification = (id: string) => {
    setSurveyNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, acknowledged: true }
          : notification,
      ),
    );

    toast({
      title: "Notification Acknowledged",
      description: "The survey issue has been marked as acknowledged.",
    });
  };

  // Handle updating notification settings
  const updateNotificationSettings = useCallback(
    (setting: string, value: any) => {
      setNotificationSettings((prev) => {
        const newSettings = {
          ...prev,
          [setting]: value,
        };

        // Save to localStorage
        try {
          localStorage.setItem(
            "oppSupportNotificationSettings",
            JSON.stringify(newSettings),
          );
        } catch (e) {
          console.error("Failed to save notification settings", e);
        }

        return newSettings;
      });
    },
    [],
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Header />
      <StatusBar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar with topics */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden h-full">
              <CardHeader className="p-4 pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-lg font-medium text-gray-200">
                    Opp Support
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="ml-2 bg-purple-950/30 text-purple-400 border-purple-800"
                  >
                    AI
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* WITS Connection Status */}
                <div className="mb-4 p-3 rounded-md border flex flex-col gap-2 bg-gray-800/50 border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${isConnected ? (isReceiving ? "bg-green-500" : "bg-yellow-500") : "bg-red-500"}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-300">
                        WITS Connection
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-gray-800 border-gray-700 hover:bg-gray-700"
                      onClick={() =>
                        setShowConnectionSettings(!showConnectionSettings)
                      }
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>

                  {showConnectionSettings ? (
                    <div className="space-y-3 mt-2 pt-2 border-t border-gray-800">
                      <div className="space-y-1">
                        <Label
                          htmlFor="ip-address"
                          className="text-xs text-gray-400"
                        >
                          IP Address
                        </Label>
                        <Input
                          id="ip-address"
                          value={tcpIpSettings.ipAddress}
                          onChange={(e) =>
                            handleConnectionSettingChange(
                              "ipAddress",
                              e.target.value,
                            )
                          }
                          className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="port" className="text-xs text-gray-400">
                          Port
                        </Label>
                        <Input
                          id="port"
                          type="number"
                          value={tcpIpSettings.port}
                          onChange={(e) =>
                            handleConnectionSettingChange(
                              "port",
                              parseInt(e.target.value),
                            )
                          }
                          className="h-7 text-xs bg-gray-800 border-gray-700 text-gray-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor="protocol"
                          className="text-xs text-gray-400"
                        >
                          Protocol
                        </Label>
                        <select
                          id="protocol"
                          value={tcpIpSettings.protocol}
                          onChange={(e) =>
                            handleConnectionSettingChange(
                              "protocol",
                              e.target.value,
                            )
                          }
                          className="w-full h-7 text-xs bg-gray-800 border border-gray-700 text-gray-200 rounded-md px-2"
                        >
                          <option value="TCP">TCP</option>
                          <option value="UDP">UDP</option>
                          <option value="Serial">Serial</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="auto-connect"
                          className="text-xs text-gray-400"
                        >
                          Auto Connect
                        </Label>
                        <Switch
                          id="auto-connect"
                          checked={tcpIpSettings.autoConnect}
                          onCheckedChange={(checked) =>
                            handleConnectionSettingChange(
                              "autoConnect",
                              checked,
                            )
                          }
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                      <div className="flex justify-between gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs bg-gray-800 border-gray-700 hover:bg-gray-700"
                          onClick={() => setShowConnectionSettings(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                          onClick={applyConnectionSettings}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <div className="text-xs text-gray-400">
                        {isConnected ? (
                          <span>
                            Connected to {connectionConfig.ipAddress}:
                            {connectionConfig.port}
                            {isReceiving ? " (Receiving Data)" : " (No Data)"}
                          </span>
                        ) : (
                          <span>Not connected</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-6 text-xs ${isConnected ? "bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50" : "bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50"}`}
                        onClick={isConnected ? disconnect : connect}
                      >
                        {isConnected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-2">Topics</div>

                  <TopicButton
                    icon={<AlertTriangle className="h-4 w-4 text-yellow-400" />}
                    title="Troubleshooting"
                    isActive={activeTopic === "troubleshooting"}
                    onClick={() => handleTopicSelect("troubleshooting")}
                  />

                  <TopicButton
                    icon={<Wrench className="h-4 w-4 text-blue-400" />}
                    title="Maintenance"
                    isActive={activeTopic === "maintenance"}
                    onClick={() => handleTopicSelect("maintenance")}
                  />

                  <TopicButton
                    icon={<Zap className="h-4 w-4 text-cyan-400" />}
                    title="Performance"
                    isActive={activeTopic === "performance"}
                    onClick={() => handleTopicSelect("performance")}
                  />

                  <TopicButton
                    icon={<BookOpen className="h-4 w-4 text-green-400" />}
                    title="Manuals & Guides"
                    isActive={activeTopic === "manuals"}
                    onClick={() => handleTopicSelect("manuals")}
                  />

                  <TopicButton
                    icon={<FileText className="h-4 w-4 text-orange-400" />}
                    title="Reports"
                    isActive={activeTopic === "reports"}
                    onClick={() => handleTopicSelect("reports")}
                  />

                  <TopicButton
                    icon={<Lightbulb className="h-4 w-4 text-purple-400" />}
                    title="Best Practices"
                    isActive={activeTopic === "practices"}
                    onClick={() => handleTopicSelect("practices")}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  {/* Survey Notifications */}
                  {surveyNotifications.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400 mb-2">
                          Survey Alerts
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-red-900/30 text-red-400 border-red-800"
                        >
                          {
                            surveyNotifications.filter((n) => !n.acknowledged)
                              .length
                          }
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {surveyNotifications
                          .filter((n) => !n.acknowledged)
                          .slice(0, 3)
                          .map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-2 rounded-md border ${notification.status === "warning" ? "bg-yellow-900/20 border-yellow-800" : "bg-red-900/20 border-red-800"}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p
                                    className={`text-xs font-medium ${notification.status === "warning" ? "text-yellow-400" : "text-red-400"}`}
                                  >
                                    {notification.status === "warning"
                                      ? "Warning"
                                      : "Critical Issue"}
                                  </p>
                                  <p className="text-xs text-gray-300 mt-1">
                                    {notification.message}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() =>
                                    acknowledgeNotification(notification.id)
                                  }
                                >
                                  Ack
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          ))}
                        {surveyNotifications.filter((n) => !n.acknowledged)
                          .length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +
                            {surveyNotifications.filter((n) => !n.acknowledged)
                              .length - 3}{" "}
                            more alerts
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-400 mb-2">
                    Suggested Questions
                  </div>
                  <SuggestedQuestion
                    question="How do I troubleshoot MWD signal loss?"
                    onClick={() => {
                      setInputText("How do I troubleshoot MWD signal loss?");
                      setActiveTopic("troubleshooting");
                    }}
                  />
                  <SuggestedQuestion
                    question="What's causing the high vibration readings?"
                    onClick={() => {
                      setInputText(
                        "What's causing the high vibration readings?",
                      );
                      setActiveTopic("troubleshooting");
                    }}
                  />
                  <SuggestedQuestion
                    question="How to interpret the current AI predictions?"
                    onClick={() => {
                      setInputText(
                        "How to interpret the current AI predictions?",
                      );
                      setActiveTopic("performance");
                    }}
                  />
                  <SuggestedQuestion
                    question="What's the status of our WITS connection?"
                    onClick={() => {
                      setInputText("What's the status of our WITS connection?");
                      setActiveTopic("troubleshooting");
                    }}
                  />
                </div>

                {/* Notification Settings */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-sm text-gray-400 mb-2">
                    Notifications
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="notify-warning"
                        className="text-xs text-gray-400"
                      >
                        Notify on Warning
                      </Label>
                      <Switch
                        id="notify-warning"
                        checked={notificationSettings.notifyOnWarning}
                        onCheckedChange={(checked) =>
                          updateNotificationSettings("notifyOnWarning", checked)
                        }
                        className="data-[state=checked]:bg-yellow-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="notify-fail"
                        className="text-xs text-gray-400"
                      >
                        Notify on Failure
                      </Label>
                      <Switch
                        id="notify-fail"
                        checked={notificationSettings.notifyOnFail}
                        onCheckedChange={(checked) =>
                          updateNotificationSettings("notifyOnFail", checked)
                        }
                        className="data-[state=checked]:bg-red-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="auto-email"
                        className="text-xs text-gray-400"
                      >
                        Auto-send Email
                      </Label>
                      <Switch
                        id="auto-email"
                        checked={notificationSettings.autoSendEmail}
                        onCheckedChange={(checked) =>
                          updateNotificationSettings("autoSendEmail", checked)
                        }
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>

                    {notificationSettings.autoSendEmail && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <Input
                            placeholder="Add email recipient"
                            className="text-xs h-7 bg-gray-800 border-gray-700 text-gray-200"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.currentTarget.value) {
                                const email = e.currentTarget.value.trim();
                                if (
                                  email &&
                                  !notificationSettings.emailRecipients.includes(
                                    email,
                                  )
                                ) {
                                  updateNotificationSettings(
                                    "emailRecipients",
                                    [
                                      ...notificationSettings.emailRecipients,
                                      email,
                                    ],
                                  );
                                  e.currentTarget.value = "";
                                }
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {notificationSettings.emailRecipients.map(
                            (email, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between text-xs bg-gray-800/50 p-1 rounded"
                              >
                                <span className="text-gray-300">{email}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-gray-400 hover:text-red-400"
                                  onClick={() => {
                                    updateNotificationSettings(
                                      "emailRecipients",
                                      notificationSettings.emailRecipients.filter(
                                        (_, i) => i !== index,
                                      ),
                                    );
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Voice Settings */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">Voice Output</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                      onClick={toggleVoice}
                    >
                      {voiceEnabled ? (
                        <Volume2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>

                  {voiceEnabled && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                        onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Voice Settings
                      </Button>

                      {showVoiceSettings && (
                        <div className="mt-2 space-y-2 p-2 bg-gray-800/50 rounded-md">
                          <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Volume</span>
                              <span>{voiceVolume}%</span>
                            </div>
                            <Slider
                              value={[voiceVolume]}
                              min={0}
                              max={100}
                              step={5}
                              onValueChange={(value) =>
                                setVoiceVolume(value[0])
                              }
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Speed</span>
                              <span>{voiceSpeed.toFixed(1)}x</span>
                            </div>
                            <Slider
                              value={[voiceSpeed * 10]}
                              min={5}
                              max={20}
                              step={1}
                              onValueChange={(value) =>
                                setVoiceSpeed(value[0] / 10)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Analytics Button */}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main chat area */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden h-full flex flex-col">
              <CardHeader className="p-4 pb-2 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium text-gray-200">
                        Opp Support Assistant
                      </CardTitle>
                      <div className="text-xs text-gray-400">
                        AI-powered drilling operations support
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="ml-2 bg-green-900/30 text-green-400 border-green-800"
                    >
                      ONLINE
                    </Badge>
                    {voiceEnabled && (
                      <Badge
                        variant="outline"
                        className="ml-1 bg-blue-900/30 text-blue-400 border-blue-800"
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        VOICE
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                      onClick={() => {}}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-grow flex flex-col">
                {/* Messages area */}
                <ScrollArea className="flex-grow p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">
                              {message.type === "user" ? "You" : "Opp Support"}
                            </span>
                            {message.type === "ai" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mt-1 -mr-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                                onClick={() => speakText(message.text)}
                              >
                                <Volume2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.text}
                          </p>
                          <div className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input area */}
                <div className="p-4 border-t border-gray-800 bg-gray-900">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-10 w-10 ${isListening ? "bg-red-600 text-white border-red-700" : "bg-gray-800 border-gray-700 text-gray-300"}`}
                      onClick={startListening}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder={
                        isListening
                          ? "Listening..."
                          : "Type your question here..."
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-gray-800 border-gray-700 text-gray-200"
                      disabled={isListening}
                    />
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isListening}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    {isListening
                      ? "Listening for your question..."
                      : "Ask a question about drilling operations or MWD tools"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analytics Panel */}
        {isAnalyticsOpen && (
          <div className="mt-6">
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <CardTitle className="text-lg font-medium text-gray-200">
                      Conversation Analytics
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="topics">
                  <TabsList className="bg-gray-800 mb-4">
                    <TabsTrigger value="topics">Topics</TabsTrigger>
                    <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                  </TabsList>

                  <TabsContent value="topics" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <TopicAnalyticsCard
                        title="Troubleshooting"
                        count={4}
                        percentage={40}
                        color="yellow"
                      />
                      <TopicAnalyticsCard
                        title="Maintenance"
                        count={2}
                        percentage={20}
                        color="blue"
                      />
                      <TopicAnalyticsCard
                        title="Performance"
                        count={3}
                        percentage={30}
                        color="cyan"
                      />
                      <TopicAnalyticsCard
                        title="Manuals & Guides"
                        count={0}
                        percentage={0}
                        color="green"
                      />
                      <TopicAnalyticsCard
                        title="Reports"
                        count={1}
                        percentage={10}
                        color="orange"
                      />
                      <TopicAnalyticsCard
                        title="Best Practices"
                        count={0}
                        percentage={0}
                        color="purple"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="sentiment" className="space-y-4">
                    <div className="text-center p-8">
                      <p className="text-gray-400">
                        Sentiment analysis would be displayed here
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="usage" className="space-y-4">
                    <div className="text-center p-8">
                      <p className="text-gray-400">
                        Usage statistics would be displayed here
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

interface TopicButtonProps {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const TopicButton = ({ icon, title, isActive, onClick }: TopicButtonProps) => (
  <button
    className={`w-full flex items-center gap-2 p-2 rounded-md text-left ${isActive ? "bg-purple-900/30 text-purple-400 border border-purple-800" : "hover:bg-gray-800"}`}
    onClick={onClick}
  >
    {icon}
    <span className="text-sm">{title}</span>
  </button>
);

interface SuggestedQuestionProps {
  question: string;
  onClick: () => void;
}

const SuggestedQuestion = ({ question, onClick }: SuggestedQuestionProps) => (
  <button
    className="w-full text-left p-2 text-xs text-gray-400 hover:bg-gray-800 rounded-md hover:text-gray-300"
    onClick={onClick}
  >
    {question}
  </button>
);

interface TopicAnalyticsCardProps {
  title: string;
  count: number;
  percentage: number;
  color: string;
}

const TopicAnalyticsCard = ({
  title,
  count,
  percentage,
  color,
}: TopicAnalyticsCardProps) => {
  const getColorClass = () => {
    switch (color) {
      case "yellow":
        return "text-yellow-400";
      case "blue":
        return "text-blue-400";
      case "cyan":
        return "text-cyan-400";
      case "green":
        return "text-green-400";
      case "orange":
        return "text-orange-400";
      case "purple":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
      <h3 className={`text-sm font-medium ${getColorClass()} mb-1`}>{title}</h3>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Questions</span>
        <span className="text-sm text-gray-300 font-medium">{count}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">Percentage</span>
        <span className="text-sm text-gray-300 font-medium">{percentage}%</span>
      </div>
      <div className="mt-2 bg-gray-700 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full ${color === "yellow" ? "bg-yellow-500" : color === "blue" ? "bg-blue-500" : color === "cyan" ? "bg-cyan-500" : color === "green" ? "bg-green-500" : color === "orange" ? "bg-orange-500" : "bg-purple-500"}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default OppSupportPage;
