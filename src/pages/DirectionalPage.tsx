import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import RosebudCompass from "@/components/dashboard/RosebudCompass";
import CurveDataWidget from "@/components/dashboard/CurveDataWidget";
import WellTrajectory3DInteractive from "@/components/dashboard/WellTrajectory3DInteractive";
import AIAnalytics from "@/components/dashboard/AIAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSurveys } from "@/context/SurveyContext";
import { useWits } from "@/context/WitsContext";
import { SurveyData } from "@/components/dashboard/SurveyPopup";
import {
  Layers,
  Download,
  Settings,
  Compass,
  ArrowUp,
  Activity,
  AlertTriangle,
} from "lucide-react";

const DirectionalPage = () => {
  // Get survey data from context
  const { surveys } = useSurveys();
  // Get WITS data
  const { isConnected, isReceiving, witsData } = useWits();

  // Log surveys from context to verify they're being loaded correctly
  useEffect(() => {
    console.log("Surveys from context in DirectionalPage:", surveys);
  }, [surveys]);

  // State for trajectory visualization and target line
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [targetTVD, setTargetTVD] = useState(8000);
  const [targetVS, setTargetVS] = useState(1500);
  const [targetInclination, setTargetInclination] = useState(35);
  const [targetAzimuth, setTargetAzimuth] = useState(275);
  const [showTargetInputs, setShowTargetInputs] = useState(false);
  const [targetLineUpdated, setTargetLineUpdated] = useState(false);
  const [aboveBelow, setAboveBelow] = useState(0);
  const [leftRight, setLeftRight] = useState(0);

  // Generate dummy survey data for visualization
  const generateDummySurveys = (
    nsOffset = 0,
    ewOffset = 0,
    randomFactor = 10,
  ) => {
    const dummySurveys = [];
    let tvd = 0;
    let ns = nsOffset;
    let ew = ewOffset;
    let inc = 0;
    let az = 90;

    for (let md = 0; md <= 8500; md += 100) {
      // Gradually build angle for first 2000ft
      if (md < 2000) {
        inc = (md / 2000) * 30;
      }
      // Hold angle for next 3000ft
      else if (md < 5000) {
        inc = 30 + (Math.random() - 0.5) * 2;
      }
      // Build more angle and turn for production zone
      else {
        inc = Math.min(inc + (Math.random() - 0.3) * 0.5, 45);
        az = (az + (Math.random() - 0.4) * 1) % 360;
      }

      // Calculate position
      const radInc = (inc * Math.PI) / 180;
      const radAz = (az * Math.PI) / 180;

      if (md > 0) {
        const courseLength = 100; // Distance between surveys
        tvd += courseLength * Math.cos(radInc);
        const horizontalDistance = courseLength * Math.sin(radInc);
        ns +=
          horizontalDistance * Math.cos(radAz) +
          (Math.random() - 0.5) * randomFactor;
        ew +=
          horizontalDistance * Math.sin(radAz) +
          (Math.random() - 0.5) * randomFactor;
      }

      dummySurveys.push({
        md,
        inc,
        az,
        tvd,
        ns,
        ew,
      });
    }

    return dummySurveys;
  };

  // Generate trajectory data for visualization
  const dummySurveys = generateDummySurveys();
  const offsetWells = [
    {
      name: "Alpha-122",
      color: "#ff0088",
      surveys: generateDummySurveys(200, 50, 30),
    },
    {
      name: "Alpha-124",
      color: "#00ff88",
      surveys: generateDummySurveys(-150, -80, 20),
    },
  ];

  // Calculate dogleg needed based on target line and current position
  const calculateDoglegNeeded = () => {
    if (!isConnected || !isReceiving) return 0;
    if (surveys.length === 0) return 3.2; // Default value

    // Get the most recent survey
    const latestSurvey = surveys[0];

    // Calculate current position
    const currentTVD =
      latestSurvey.bitDepth *
      Math.cos((latestSurvey.inclination * Math.PI) / 180);
    const horizontalDistance =
      latestSurvey.bitDepth *
      Math.sin((latestSurvey.inclination * Math.PI) / 180);
    const currentVS = horizontalDistance;

    // Calculate distance to target
    const verticalDistance = targetTVD - currentTVD;
    const horizontalDistanceToTarget = targetVS - currentVS;
    const distanceToTarget = Math.sqrt(
      verticalDistance * verticalDistance +
        horizontalDistanceToTarget * horizontalDistanceToTarget,
    );

    // Calculate angle change needed
    const angleChangeNeeded = Math.abs(
      targetInclination - latestSurvey.inclination,
    );

    // Calculate dogleg needed (simplified)
    const doglegNeeded = (angleChangeNeeded / distanceToTarget) * 100;

    return Math.min(Math.max(doglegNeeded, 0.5), 5.0); // Limit between 0.5 and 5.0 degrees/100ft
  };

  // Calculate above/below and left/right based on target line
  useEffect(() => {
    if (targetLineUpdated && surveys.length > 0) {
      // Get the most recent survey
      const latestSurvey = surveys[0];

      // Calculate current position
      const currentTVD =
        latestSurvey.bitDepth *
        Math.cos((latestSurvey.inclination * Math.PI) / 180);
      const horizontalDistance =
        latestSurvey.bitDepth *
        Math.sin((latestSurvey.inclination * Math.PI) / 180);

      // Calculate above/below (vertical difference)
      const aboveBelow = targetTVD - currentTVD;
      setAboveBelow(aboveBelow);

      // Calculate left/right (horizontal difference)
      // This is a simplified calculation - in a real app, you'd need to account for azimuth
      const currentNS =
        horizontalDistance * Math.cos((latestSurvey.azimuth * Math.PI) / 180);
      const currentEW =
        horizontalDistance * Math.sin((latestSurvey.azimuth * Math.PI) / 180);
      const targetNS = targetVS * Math.cos((targetAzimuth * Math.PI) / 180);
      const targetEW = targetVS * Math.sin((targetAzimuth * Math.PI) / 180);

      // Calculate perpendicular distance to target line
      const leftRight = Math.sqrt(
        Math.pow(targetNS - currentNS, 2) + Math.pow(targetEW - currentEW, 2),
      );
      setLeftRight(leftRight);
    }
  }, [
    targetLineUpdated,
    surveys,
    targetTVD,
    targetVS,
    targetInclination,
    targetAzimuth,
  ]);

  // Convert SurveyData to trajectory format for visualization
  useEffect(() => {
    if (surveys.length > 0) {
      // Map survey data to trajectory format
      const trajectoryPoints = surveys.map((survey) => {
        // Calculate TVD (simplified)
        const tvd =
          survey.bitDepth * Math.cos((survey.inclination * Math.PI) / 180);

        // Calculate NS/EW (simplified)
        const horizontalDistance =
          survey.bitDepth * Math.sin((survey.inclination * Math.PI) / 180);
        const ns =
          horizontalDistance * Math.cos((survey.azimuth * Math.PI) / 180);
        const ew =
          horizontalDistance * Math.sin((survey.azimuth * Math.PI) / 180);

        return {
          md: survey.bitDepth,
          inc: survey.inclination,
          az: survey.azimuth,
          tvd,
          ns,
          ew,
        };
      });

      setTrajectoryData(trajectoryPoints);
    } else {
      // Use dummy data if no surveys exist
      setTrajectoryData(dummySurveys);
    }
  }, [surveys]);

  // Get parameter values based on connection status
  const getParameterValue = (value: number) => {
    return isConnected && isReceiving ? value : 0;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />
      <StatusBar />
      <div className="container mx-auto px-4 py-6">
        {/* WITS Connection Status */}
        {!isConnected && (
          <div className="bg-red-900/30 border-b border-red-800 px-4 py-2 text-center mb-6">
            <p className="text-red-400 text-sm font-medium flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              WITS Connection Not Established - Data shown is simulated
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Directional Drilling</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
              onClick={() => setShowTargetInputs(!showTargetInputs)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Target Line
            </Button>
          </div>
        </div>

        {showTargetInputs && (
          <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-md">
            <h2 className="text-lg font-medium text-gray-200 mb-4">
              Target Line Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Target TVD (ft)</label>
                <div className="flex">
                  <input
                    type="number"
                    value={targetTVD}
                    onChange={(e) => setTargetTVD(parseFloat(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Target VS (ft)</label>
                <div className="flex">
                  <input
                    type="number"
                    value={targetVS}
                    onChange={(e) => setTargetVS(parseFloat(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  Target Inclination (°)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={targetInclination}
                    onChange={(e) =>
                      setTargetInclination(parseFloat(e.target.value))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  Target Azimuth (°)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={targetAzimuth}
                    onChange={(e) =>
                      setTargetAzimuth(parseFloat(e.target.value))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setTargetLineUpdated(true);
                    setShowTargetInputs(false);
                  }}
                >
                  Update Target Line
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-md">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-blue-400 mt-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <div>
                  <p className="text-sm text-gray-300">
                    Target line settings will be used to calculate curve data
                    and above/below/left/right values based on current surveys.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {targetLineUpdated && (
          <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-md">
            <h2 className="text-lg font-medium text-gray-200 mb-4">
              Target Line Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Above/Below</div>
                <div
                  className={`text-xl font-bold ${aboveBelow > 0 ? "text-red-400" : "text-green-400"}`}
                >
                  {aboveBelow > 0 ? "Below" : "Above"}{" "}
                  {Math.abs(aboveBelow).toFixed(1)} ft
                </div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Left/Right</div>
                <div className="text-xl font-bold text-yellow-400">
                  {leftRight.toFixed(1)} ft
                </div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">
                  Distance to Target
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {Math.sqrt(
                    aboveBelow * aboveBelow + leftRight * leftRight,
                  ).toFixed(1)}{" "}
                  ft
                </div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-md border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Dogleg Needed</div>
                <div className="text-xl font-bold text-purple-400">
                  {calculateDoglegNeeded().toFixed(2)}°/100ft
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Rosebud Compass */}
            <div className="h-[400] h-[350] h-96">
              <RosebudCompass
                toolFace={getParameterValue(witsData.toolFace)}
                inclination={getParameterValue(witsData.inclination)}
                azimuth={getParameterValue(witsData.azimuth)}
                magneticField={getParameterValue(witsData.magneticField)}
                gravity={getParameterValue(witsData.gravity)}
                depth={getParameterValue(witsData.bitDepth)}
                isActive={isConnected && isReceiving}
              />
            </div>

            {/* Curve Data Widget */}
            <div className="h-[250px]">
              <CurveDataWidget
                motorYield={getParameterValue(witsData.motorYield)}
                doglegNeeded={calculateDoglegNeeded()}
                slideSeen={getParameterValue(witsData.slideSeen)}
                slideAhead={getParameterValue(witsData.slideAhead)}
                projectedInc={targetInclination}
                projectedAz={targetAzimuth}
                isRealtime={isConnected && isReceiving}
              />
            </div>

            {/* Directional Metrics */}
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-blue-400" />
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Directional Metrics
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-md flex flex-col">
                    <span className="text-xs text-gray-500">Build Rate</span>
                    <span className="text-sm font-medium text-blue-400">
                      {getParameterValue(witsData.motorYield).toFixed(1)}°/100ft
                    </span>
                  </div>
                  <div className="p-2 bg-gray-800/50 rounded-md flex flex-col">
                    <span className="text-xs text-gray-500">Turn Rate</span>
                    <span className="text-sm font-medium text-purple-400">
                      {getParameterValue(1.5).toFixed(1)}°/100ft
                    </span>
                  </div>
                  <div className="p-2 bg-gray-800/50 rounded-md flex flex-col">
                    <span className="text-xs text-gray-500">
                      Dogleg Severity
                    </span>
                    <span className="text-sm font-medium text-yellow-400">
                      {getParameterValue(witsData.dls).toFixed(1)}°/100ft
                    </span>
                  </div>
                  <div className="p-2 bg-gray-800/50 rounded-md flex flex-col">
                    <span className="text-xs text-gray-500">
                      Toolface Offset
                    </span>
                    <span className="text-sm font-medium text-green-400">
                      +{getParameterValue(1.2).toFixed(1)}°
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slide Performance */}
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-cyan-400" />
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Slide Performance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Slide Grade</span>
                      <span className="text-green-400">A-</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-full"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>DLS Grade</span>
                      <span className="text-yellow-400">B+</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full"
                        style={{ width: "78%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Toolface Control</span>
                      <span className="text-blue-400">A</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-full"
                        style={{ width: "92%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Nudge Efficiency</span>
                      <span className="text-cyan-400">A+</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full"
                        style={{ width: "95%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nudge Projection */}
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Nudge Projection
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="p-2 bg-gray-800/50 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Current Inc/Az
                      </span>
                      <span className="text-sm font-medium text-gray-300">
                        {getParameterValue(witsData.inclination).toFixed(1)}° /{" "}
                        {getParameterValue(witsData.azimuth).toFixed(1)}°
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-gray-800/50 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Target Inc/Az
                      </span>
                      <span className="text-sm font-medium text-gray-300">
                        {targetInclination.toFixed(1)}° /{" "}
                        {targetAzimuth.toFixed(1)}°
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-purple-900/20 border border-purple-800 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">
                        Recommended Nudge
                      </span>
                      <span className="text-sm font-medium text-purple-400">
                        +{getParameterValue(2.5).toFixed(1)}° / +
                        {getParameterValue(2.7).toFixed(1)}°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Estimated 30 ft slide @{" "}
                      {getParameterValue(witsData.toolFace).toFixed(0)}°
                      toolface
                    </div>
                  </div>

                  <div className="p-2 bg-cyan-900/20 border border-cyan-800 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">
                        AI Recommendation
                      </span>
                      <span className="text-sm font-medium text-cyan-400">
                        {isConnected && isReceiving ? "Slide Now" : "No Data"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {isConnected && isReceiving
                        ? "Optimal window for course correction"
                        : "Connect to WITS for recommendations"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - 3D Wellbore */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D Wellbore Visualization */}
            <div className="h-[800px]">
              <WellTrajectory3DInteractive
                surveys={
                  trajectoryData.length > 0 ? trajectoryData : dummySurveys
                }
                offsetWells={offsetWells}
              />
            </div>

            {/* Directional Tabs */}
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    <CardTitle className="text-lg font-medium text-gray-200">
                      Directional Analysis
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 text-[#6e7075]">
                <Tabs defaultValue="surveys">
                  <TabsList className="w-full bg-gray-800/50 rounded-none border-b border-gray-800 p-0">
                    <TabsTrigger
                      value="surveys"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Survey Data
                    </TabsTrigger>
                    <TabsTrigger
                      value="analysis"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Inclination Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="ai"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      AI Insights
                    </TabsTrigger>
                    <TabsTrigger
                      value="gamma"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Gamma Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="vibration"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Vibration
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="surveys" className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-800/50 border-b border-gray-800">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              MD (ft)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Inc (°)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Az (°)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              TVD (ft)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              NS (ft)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              EW (ft)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {surveys.length > 0
                            ? // Display actual survey data from SurveyContext
                              surveys.slice(0, 10).map((survey, index) => {
                                // Calculate TVD (simplified)
                                const tvd =
                                  survey.bitDepth *
                                  Math.cos(
                                    (survey.inclination * Math.PI) / 180,
                                  );

                                // Calculate NS/EW (simplified)
                                const horizontalDistance =
                                  survey.bitDepth *
                                  Math.sin(
                                    (survey.inclination * Math.PI) / 180,
                                  );
                                const ns =
                                  horizontalDistance *
                                  Math.cos((survey.azimuth * Math.PI) / 180);
                                const ew =
                                  horizontalDistance *
                                  Math.sin((survey.azimuth * Math.PI) / 180);

                                return (
                                  <tr
                                    key={survey.id}
                                    className="hover:bg-gray-800/30"
                                  >
                                    <td className="px-4 py-2 text-sm">
                                      {survey.bitDepth.toFixed(1)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {survey.inclination.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {survey.azimuth.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {tvd.toFixed(1)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {ns.toFixed(1)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {ew.toFixed(1)}
                                    </td>
                                  </tr>
                                );
                              })
                            : // Display dummy data if no surveys exist
                              dummySurveys.slice(0, 10).map((survey, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-800/30"
                                >
                                  <td className="px-4 py-2 text-sm">
                                    {survey.md.toFixed(1)}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {survey.inc.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {survey.az.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {survey.tvd.toFixed(1)}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {survey.ns.toFixed(1)}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {survey.ew.toFixed(1)}
                                  </td>
                                </tr>
                              ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="analysis" className="p-4">
                    <div className="text-center p-8">
                      <p className="text-gray-400">
                        Inclination analysis visualization would be displayed
                        here
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="p-0">
                    <div className="h-[300px]">
                      <AIAnalytics />
                    </div>
                  </TabsContent>

                  <TabsContent value="gamma" className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-300">
                          Gamma Ray Analysis
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-pink-900/30 text-pink-400 border-pink-800"
                        >
                          High Gamma Zone Detected
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Current Gamma
                          </div>
                          <div className="text-2xl font-bold text-pink-400">
                            {getParameterValue(witsData.gamma).toFixed(1)} API
                          </div>
                          <div className="text-xs text-gray-500">
                            {isConnected && isReceiving
                              ? "Shale formation detected"
                              : "No data available"}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Formation Type
                          </div>
                          <div className="text-xl font-bold text-cyan-400">
                            {isConnected && isReceiving ? "Shale" : "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isConnected && isReceiving
                              ? "High clay content"
                              : "Connect to WITS for data"}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Predicted Ahead
                          </div>
                          <div className="text-xl font-bold text-green-400">
                            {isConnected && isReceiving
                              ? "Sandstone"
                              : "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isConnected && isReceiving
                              ? "Expected in ~50 ft"
                              : "Connect to WITS for data"}
                          </div>
                        </div>
                      </div>

                      <div className="h-[200px] bg-gray-800/30 rounded-md border border-gray-800 flex items-center justify-center">
                        <p className="text-gray-400">
                          Gamma ray log visualization would display here
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="vibration" className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-300">
                          Vibration Analysis
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-yellow-900/30 text-yellow-400 border-yellow-800"
                        >
                          {isConnected && isReceiving
                            ? "Moderate Vibration"
                            : "No Data"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Lateral
                          </div>
                          <div className="text-2xl font-bold text-yellow-400">
                            {getParameterValue(
                              witsData.vibration.lateral,
                            ).toFixed(0)}
                            %
                          </div>
                          <div className="text-xs text-gray-500">
                            {isConnected && isReceiving
                              ? "Above threshold (30%)"
                              : "No data available"}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Axial
                          </div>
                          <div className="text-xl font-bold text-green-400">
                            {getParameterValue(
                              witsData.vibration.axial,
                            ).toFixed(0)}
                            %
                          </div>
                          <div className="text-xs text-gray-500">
                            {isConnected && isReceiving
                              ? "Within normal range"
                              : "No data available"}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Torsional
                          </div>
                          <div className="text-xl font-bold text-green-400">
                            {getParameterValue(
                              witsData.vibration.torsional,
                            ).toFixed(0)}
                            %
                          </div>
                          <div className="text-xs text-gray-500">
                            {isConnected && isReceiving
                              ? "Within normal range"
                              : "No data available"}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Activity className="h-4 w-4 text-yellow-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-yellow-400 mb-1">
                              Recommendation
                            </div>
                            <div className="text-sm text-gray-300">
                              {isConnected && isReceiving
                                ? "Reduce WOB by 10% and monitor lateral vibration response. Consider adding a shock sub if vibration persists."
                                : "Connect to WITS for vibration recommendations"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-[150px] bg-gray-800/30 rounded-md border border-gray-800 flex items-center justify-center">
                        <p className="text-gray-400">
                          Vibration trend visualization would display here
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectionalPage;
