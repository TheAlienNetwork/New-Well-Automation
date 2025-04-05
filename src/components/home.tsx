import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "./layout/Navbar";
import Header from "./dashboard/Header";
import RosebudCompass from "./dashboard/RosebudCompass";
import HorizontalDecoder from "./dashboard/HorizontalDecoder";
import MessageLog from "./dashboard/MessageLog";
import WidgetGrid from "./dashboard/WidgetGrid";
import AIAnalytics from "./dashboard/AIAnalytics";
import ControlPanel from "./dashboard/ControlPanel";
import StatusBar from "./dashboard/StatusBar";
import GammaPlot from "./dashboard/GammaPlot";
import SurveyPopup, { SurveyData } from "./dashboard/SurveyPopup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useWits } from "@/context/WitsContext";
import { useUser } from "@/context/UserContext";
import { useSurveys } from "@/context/SurveyContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Settings,
  Rewind,
  FastForward,
  Save,
  User,
  AlertTriangle,
} from "lucide-react";

const Home = () => {
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [noiseFilterLevel, setNoiseFilterLevel] = useState(30);
  const [aiFilterEnabled, setAiFilterEnabled] = useState(true);
  const [showSurveyPopup, setShowSurveyPopup] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState<SurveyData | null>(null);
  const [showReplayStand, setShowReplayStand] = useState(false);
  const [pulseHeight, setPulseHeight] = useState(50);
  const [pulseWidth, setPulseWidth] = useState(50);
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentPulseIndex, setCurrentPulseIndex] = useState(0);
  const replayIntervalRef = useRef<number | null>(null);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);

  // Get real-time WITS data
  const { isConnected, isReceiving, witsData } = useWits();

  // Get user profile data
  const { userProfile } = useUser();

  // Get survey data
  const { surveys, addSurvey } = useSurveys();

  // Handle menu toggle
  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  // No longer need to listen for profile updates as we're using the UserContext

  // Handle recording toggle
  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
  };

  // Handle noise filter change
  const handleNoiseFilterChange = (value: number) => {
    setNoiseFilterLevel(value);
  };

  // Handle AI filter toggle
  const handleAiFilterToggle = (enabled: boolean) => {
    setAiFilterEnabled(enabled);
  };

  // Generate surveys based on WITS data
  useEffect(() => {
    if (isRecording && isReceiving && isConnected) {
      const surveyInterval = setInterval(() => {
        // 10% chance to generate a survey when recording and receiving WITS data
        if (Math.random() < 0.1) {
          generateNewSurvey();
        }
      }, 5000);

      return () => clearInterval(surveyInterval);
    }
  }, [isRecording, isReceiving, isConnected, witsData]);

  // Generate a new survey using WITS data
  const generateNewSurvey = () => {
    // Only generate surveys if we have a valid WITS connection
    if (!isConnected || !isReceiving) {
      console.warn("Cannot generate survey: No active WITS connection");
      toast({
        title: "Survey Generation Failed",
        description: "Cannot generate survey: No active WITS connection",
        variant: "destructive",
      });
      return;
    }

    // Create a new survey with current WITS data plus some random variation
    const newSurvey: SurveyData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      bitDepth: witsData.bitDepth + Math.random() * 10,
      inclination: witsData.inclination + (Math.random() - 0.5) * 2,
      azimuth: witsData.azimuth + (Math.random() - 0.5) * 3,
      toolFace: witsData.toolFace + (Math.random() - 0.5) * 5,
      bTotal: witsData.magneticField + (Math.random() - 0.5) * 0.5,
      aTotal: witsData.gravity + (Math.random() - 0.5) * 0.02,
      dip: witsData.dip + (Math.random() - 0.5) * 1,
      toolTemp: witsData.toolTemp + Math.random() * 5,
      qualityCheck: determineQualityCheck(),
    };

    setCurrentSurvey(newSurvey);
    setShowSurveyPopup(true);
  };

  // Determine quality check status and message
  const determineQualityCheck = () => {
    const rand = Math.random();
    if (rand > 0.8) {
      return {
        status: "warning" as const,
        message: "Magnetic interference detected. Verify readings.",
      };
    } else if (rand > 0.95) {
      return {
        status: "fail" as const,
        message: "Survey failed quality check. Excessive tool motion detected.",
      };
    } else {
      return {
        status: "pass" as const,
        message: "All parameters within acceptable ranges",
      };
    }
  };

  // Handle saving a survey
  const handleSaveSurvey = (survey: SurveyData) => {
    // Add to global survey context
    addSurvey(survey);
    setShowSurveyPopup(false);
    setCurrentSurvey(null);
  };

  // Handle replay stand controls
  const toggleReplayStand = () => {
    setShowReplayStand(!showReplayStand);
  };

  const startReplay = () => {
    setIsReplaying(true);
    setCurrentPulseIndex(0);

    // Clear any existing interval
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
    }

    // Set up new interval for replay
    replayIntervalRef.current = window.setInterval(() => {
      setCurrentPulseIndex((prev) => {
        if (prev >= 100) {
          clearInterval(replayIntervalRef.current!);
          setIsReplaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 100);
  };

  const stopReplay = () => {
    setIsReplaying(false);
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
    }
  };

  const handlePulseHeightChange = (value: number[]) => {
    setPulseHeight(value[0]);
  };

  const handlePulseWidthChange = (value: number[]) => {
    setPulseWidth(value[0]);
  };

  const handleAIResync = () => {
    // Simulate AI resyncing
    setIsReplaying(true);
    setTimeout(() => {
      setIsReplaying(false);
      // Simulate successful survey after AI resync
      generateNewSurvey();
    }, 3000);
  };

  // Get parameter values based on connection status
  const getParameterValue = (value: number) => {
    return isConnected && isReceiving ? value : 0;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200">
      {/* Navbar */}
      <Navbar />
      {/* Status Bar */}
      <StatusBar />

      {/* WITS Connection Status */}
      {!isConnected && (
        <div className="bg-red-900/30 border-b border-red-800 px-4 py-2 text-center">
          <p className="text-red-400 text-sm font-medium flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            WITS Connection Not Established - Data shown is simulated
            <Button
              variant="outline"
              size="sm"
              className="ml-2 h-7 bg-red-900/50 border-red-800 hover:bg-red-800 text-red-300"
              onClick={() => {
                toast({
                  title: "Connecting to WITS",
                  description: "Attempting to establish WITS connection...",
                });
              }}
            >
              Connect
            </Button>
          </p>
        </div>
      )}
      {/* Drilling Parameters */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
        <div className="grid grid-cols-7 gap-2">
          <ParameterCard
            title="ROP"
            value={getParameterValue(witsData.rop)}
            unit="ft/hr"
            color="green"
          />
          <ParameterCard
            title="WOB"
            value={getParameterValue(witsData.wob)}
            unit="klbs"
            color="yellow"
          />
          <ParameterCard
            title="RPM"
            value={getParameterValue(witsData.rpm)}
            unit="rpm"
            color="blue"
          />
          <ParameterCard
            title="Torque"
            value={getParameterValue(witsData.torque)}
            unit="kft-lbs"
            color="cyan"
          />
          <ParameterCard
            title="SPP"
            value={getParameterValue(witsData.spp)}
            unit="psi"
            color="red"
          />
          <ParameterCard
            title="Flow"
            value={getParameterValue(witsData.flowRate)}
            unit="gpm"
            color="purple"
          />
          <ParameterCard
            title="Hook Load"
            value={getParameterValue(witsData.hookLoad)}
            unit="klbs"
            color="orange"
          />
        </div>
      </div>
      {/* Header */}
      <Header
        onMenuToggle={handleMenuToggle}
        menuOpen={menuOpen}
        systemStatus="online"
        notificationCount={3}
        profileImage={userProfile.profileImage}
        userName={`${userProfile.firstName} ${userProfile.lastName}`}
      />
      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            onClick={() => setShowCustomizeDialog(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize Dashboard
          </Button>
        </div>
        <div className="grid grid-cols-12 gap-4">
          {/* Left column */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
            {/* Rosebud Compass */}
            <div className="grow h-[400px]">
              <RosebudCompass
                toolFace={getParameterValue(witsData.toolFace)}
                inclination={getParameterValue(witsData.inclination)}
                azimuth={getParameterValue(witsData.azimuth)}
                magneticField={getParameterValue(witsData.magneticField)}
                gravity={getParameterValue(witsData.gravity)}
                depth={getParameterValue(witsData.bitDepth)}
                isActive={isRecording && isReceiving}
              />
            </div>

            {/* Control Panel - Made smaller */}
            <div className="grow h-[400px]">
              <ControlPanel
                isRecording={isRecording}
                noiseLevel={noiseFilterLevel}
                filterLevel={70}
                onToggleRecording={handleRecordingToggle}
                onAdjustNoise={handleNoiseFilterChange}
                signalStrength={
                  isConnected && isReceiving ? witsData.signalQuality : 0
                }
                batteryLevel={
                  isConnected && isReceiving ? witsData.batteryLevel : 0
                }
                wifiStrength={isConnected ? 90 : 0}
              />
            </div>

            {/* Message Log */}
            <div className="flex-1">
              <MessageLog />
            </div>
          </div>

          {/* Middle column */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
            {/* Horizontal Decoder - Larger height */}
            <div className="w-[16px] h-[33px]"></div>
            <div className="relative h-[-500px-] h-[-450px-] h-[475px] h-[-450px-] bottom-[3.00rem]">
              <HorizontalDecoder
                isLive={isRecording && isReceiving}
                noiseLevel={noiseFilterLevel}
                aiFilterEnabled={aiFilterEnabled}
                onFilterChange={handleAiFilterToggle}
                onNoiseFilterChange={handleNoiseFilterChange}
              />
              <Button
                className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 h-auto left-auto"
                onClick={toggleReplayStand}
              >
                Replay Stand
              </Button>
            </div>
            {/* Gamma Plot */}
            <div className="h-[600px]">
              <GammaPlot className="h-[400px]" />
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-[-1604px-]">
            {/* AI Analytics - Made larger */}
            <div className="w-[360] h-[-1100px-] h-[-2000px-] h-[-1700px-] h-[-1700px-] h-[1700px]">
              <AIAnalytics className="h-[700px]" />
            </div>
          </div>
        </div>
      </div>
      {/* Survey Popup */}
      {showSurveyPopup && currentSurvey && (
        <SurveyPopup
          isOpen={showSurveyPopup}
          onClose={() => setShowSurveyPopup(false)}
          onSave={handleSaveSurvey}
          surveyData={currentSurvey}
        />
      )}
      {/* Replay Stand Dialog */}
      <Dialog open={showReplayStand} onOpenChange={setShowReplayStand}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-200 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-200 flex items-center gap-2">
              Pulse Decoder Replay Stand
              {isReplaying && (
                <Badge
                  variant="outline"
                  className="bg-green-900/30 text-green-400 border-green-800 animate-pulse"
                >
                  REPLAYING
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Pulse Decoder Visualization */}
            <div className="h-[200px] bg-gray-950 rounded-md border border-gray-800 relative overflow-hidden">
              {/* Pulse visualization */}
              <div className="absolute inset-0">
                <svg width="100%" height="100%" viewBox="0 0 1000 200">
                  <line
                    x1="0"
                    y1="100"
                    x2="1000"
                    y2="100"
                    stroke="#374151"
                    strokeWidth="2"
                  />

                  {/* Generate pulses based on current settings */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const xPos = i * 100 + 50;
                    const height = (pulseHeight / 100) * 80;
                    const width = (pulseWidth / 100) * 40;
                    const isHighlighted =
                      isReplaying && i === Math.floor(currentPulseIndex / 10);
                    const isPosOrNeg = i % 2 === 0;

                    return (
                      <g key={i}>
                        {/* Pulse rectangle */}
                        <rect
                          x={xPos - width / 2}
                          y={isPosOrNeg ? 100 - height : 100}
                          width={width}
                          height={isPosOrNeg ? height : height}
                          fill={
                            isPosOrNeg
                              ? isHighlighted
                                ? "#00ffaa"
                                : "#00aa77"
                              : isHighlighted
                                ? "#ff00aa"
                                : "#aa0077"
                          }
                          filter={
                            isHighlighted
                              ? "drop-shadow(0 0 8px #00ffaa80)"
                              : undefined
                          }
                        />

                        {/* Transition lines */}
                        <line
                          x1={xPos - width * 2}
                          y1="100"
                          x2={xPos - width / 2}
                          y2={isPosOrNeg ? 100 - height : 100 + height}
                          stroke={
                            isPosOrNeg
                              ? isHighlighted
                                ? "#00ffaa"
                                : "#00aa77"
                              : isHighlighted
                                ? "#ff00aa"
                                : "#aa0077"
                          }
                          strokeWidth="2"
                        />
                        <line
                          x1={xPos + width / 2}
                          y1={isPosOrNeg ? 100 - height : 100 + height}
                          x2={xPos + width * 2}
                          y2="100"
                          stroke={
                            isPosOrNeg
                              ? isHighlighted
                                ? "#00ffaa"
                                : "#00aa77"
                              : isHighlighted
                                ? "#ff00aa"
                                : "#aa0077"
                          }
                          strokeWidth="2"
                        />

                        {/* Pulse labels */}
                        <text
                          x={xPos}
                          y={isPosOrNeg ? 100 - height - 10 : 100 + height + 20}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="12"
                        >
                          {isPosOrNeg ? "1" : "0"}
                        </text>
                      </g>
                    );
                  })}

                  {/* Playhead indicator */}
                  {isReplaying && (
                    <line
                      x1={currentPulseIndex * 10}
                      y1="0"
                      x2={currentPulseIndex * 10}
                      y2="200"
                      stroke="#ff0000"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                </svg>
              </div>

              {/* Grid overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-10 grid-rows-4">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="border border-gray-800/30"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Pulse Height</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[pulseHeight]}
                      min={10}
                      max={100}
                      step={1}
                      onValueChange={handlePulseHeightChange}
                    />
                    <span className="text-sm text-gray-300 w-8">
                      {pulseHeight}%
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-400">Pulse Width</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[pulseWidth]}
                      min={10}
                      max={100}
                      step={1}
                      onValueChange={handlePulseWidthChange}
                    />
                    <span className="text-sm text-gray-300 w-8">
                      {pulseWidth}%
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-400">Noise Filter</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[noiseFilterLevel]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) =>
                        handleNoiseFilterChange(value[0])
                      }
                    />
                    <span className="text-sm text-gray-300 w-8">
                      {noiseFilterLevel}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Pulse Type</Label>
                  <Select defaultValue="eclipse">
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                      <SelectValue placeholder="Select pulse type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="eclipse">Eclipse</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="enhanced">Enhanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-gray-400">
                    Decoding Algorithm
                  </Label>
                  <Select defaultValue="ai">
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                      <SelectValue placeholder="Select algorithm" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="ai">AI-Enhanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full bg-cyan-900/30 text-cyan-400 border-cyan-800 hover:bg-cyan-800/30"
                    onClick={handleAIResync}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    AI Resync & Troubleshoot
                  </Button>
                </div>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-gray-800 border-gray-700"
              >
                <Rewind className="h-5 w-5" />
              </Button>

              {isReplaying ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 bg-red-900/30 text-red-400 border-red-800 hover:bg-red-800/30"
                  onClick={stopReplay}
                >
                  <span className="h-5 w-5 block bg-red-400"></span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 bg-green-900/30 text-green-400 border-green-800 hover:bg-green-800/30"
                  onClick={startReplay}
                >
                  <Play className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-gray-800 border-gray-700"
              >
                <FastForward className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" className="bg-gray-800 border-gray-700">
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>

              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Export Decoded Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Parameter Card Component for the top drilling parameters bar
interface ParameterCardProps {
  title: string;
  value: number;
  unit: string;
  color: string;
}

const ParameterCard = ({ title, value, unit, color }: ParameterCardProps) => {
  const getColorClass = () => {
    switch (color) {
      case "green":
        return "text-green-400";
      case "yellow":
        return "text-yellow-400";
      case "blue":
        return "text-blue-400";
      case "cyan":
        return "text-cyan-400";
      case "red":
        return "text-red-400";
      case "purple":
        return "text-purple-400";
      case "orange":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-md p-1 flex flex-col items-center">
      <div className="text-xs text-gray-400">{title}</div>
      <div className={`text-sm font-bold ${getColorClass()}`}>
        {value.toFixed(2)}{" "}
        <span className="text-xs font-normal text-gray-500">{unit}</span>
      </div>
    </div>
  );
};

export default Home;
