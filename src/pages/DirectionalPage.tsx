import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import RosebudCompass from "@/components/dashboard/RosebudCompass";
import CurveDataWidget from "@/components/dashboard/CurveDataWidget";
import WellTrajectory3DInteractive from "@/components/dashboard/WellTrajectory3DInteractive";
import AIAnalytics from "@/components/dashboard/AIAnalytics";
import SurveyTable from "@/components/dashboard/SurveyTable";
import NudgeProjectionControls from "@/components/dashboard/NudgeProjectionControls";
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

import { ErrorBoundary } from "@/components/ui/error-boundary";

const DirectionalPage = () => {
  // Get survey data from context
  const { surveys } = useSurveys();
  // Get WITS data
  const { isConnected, isReceiving, witsData } = useWits();

  // Get the latest survey for calculations
  const [latestSurvey, setLatestSurvey] = useState<SurveyData | null>(null);
  // Add error state to track and handle errors
  const [hasError, setHasError] = useState<boolean>(false);

  // Reset error state when surveys change
  useEffect(() => {
    setHasError(false);
  }, [surveys]);

  // Update latest survey when surveys change
  useEffect(() => {
    try {
      if (!surveys) {
        console.log("No surveys available");
        setLatestSurvey(null);
        return;
      }

      if (!Array.isArray(surveys)) {
        console.error("Surveys is not an array:", surveys);
        setLatestSurvey(null);
        return;
      }

      if (surveys.length > 0) {
        // Validate surveys before sorting
        const validSurveys = surveys.filter((survey) => {
          try {
            return (
              survey &&
              typeof survey === "object" &&
              survey.timestamp &&
              new Date(survey.timestamp).getTime() > 0
            );
          } catch (e) {
            console.warn("Invalid survey detected:", survey, e);
            return false;
          }
        });

        if (validSurveys.length === 0) {
          console.warn("No valid surveys found after filtering");
          setLatestSurvey(null);
          return;
        }

        // Sort surveys by timestamp (newest first)
        const sortedSurveys = [...validSurveys].sort((a, b) => {
          try {
            return (
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          } catch (sortError) {
            console.error("Error comparing survey dates:", sortError);
            return 0; // Keep original order if comparison fails
          }
        });

        // Validate the latest survey before setting it
        const latest = sortedSurveys[0];
        if (latest && typeof latest === "object") {
          setLatestSurvey(latest);
        } else {
          console.warn("Latest survey is invalid:", latest);
          setLatestSurvey(null);
        }
      } else {
        setLatestSurvey(null);
      }
    } catch (error) {
      console.error("Error updating latest survey:", error);
      setLatestSurvey(null);
    }
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

  // State for manual curve data values
  const [manualSlideSeen, setManualSlideSeen] = useState<number | null>(null);
  const [manualSlideAhead, setManualSlideAhead] = useState<number | null>(null);
  const [manualMotorYield, setManualMotorYield] = useState<number | null>(null);
  const [manualDoglegNeeded, setManualDoglegNeeded] = useState<number | null>(
    null,
  );
  const [manualProjectedInc, setManualProjectedInc] = useState<number | null>(
    null,
  );
  const [manualProjectedAz, setManualProjectedAz] = useState<number | null>(
    null,
  );

  // Create a single object with all manual curve data values for easier passing to components
  const manualCurveData = {
    slideSeen: manualSlideSeen,
    slideAhead: manualSlideAhead,
    motorYield: manualMotorYield,
    doglegNeeded: manualDoglegNeeded,
    projectedInc: manualProjectedInc,
    projectedAz: manualProjectedAz,
  };

  // Default empty arrays for trajectory data
  const [offsetWells, setOffsetWells] = useState([
    {
      name: "Alpha-122",
      color: "#ff0088",
      surveys: [],
    },
    {
      name: "Alpha-124",
      color: "#00ff88",
      surveys: [],
    },
  ]);

  // Calculate dogleg needed based on target line and current position
  const calculateDoglegNeeded = () => {
    try {
      // Default value to return in case of any issues
      const defaultValue = 3.2;

      // Early returns for missing data
      if (!isConnected || !isReceiving) return defaultValue;
      if (!surveys) return defaultValue;
      if (!Array.isArray(surveys)) {
        console.error("Surveys is not an array:", surveys);
        return defaultValue;
      }
      if (surveys.length === 0) return defaultValue;

      // Use the already calculated latestSurvey instead of re-sorting
      if (!latestSurvey) {
        console.warn("No latest survey available for dogleg calculation");
        return defaultValue;
      }

      // Validate survey data thoroughly
      if (
        typeof latestSurvey !== "object" ||
        typeof latestSurvey.bitDepth !== "number" ||
        isNaN(latestSurvey.bitDepth) ||
        !isFinite(latestSurvey.bitDepth) ||
        typeof latestSurvey.inclination !== "number" ||
        isNaN(latestSurvey.inclination) ||
        !isFinite(latestSurvey.inclination)
      ) {
        console.error("Invalid latest survey data for dogleg calculation:", {
          bitDepth: latestSurvey.bitDepth,
          inclination: latestSurvey.inclination,
        });
        return defaultValue;
      }

      // Validate target values
      if (
        typeof targetTVD !== "number" ||
        isNaN(targetTVD) ||
        !isFinite(targetTVD) ||
        typeof targetVS !== "number" ||
        isNaN(targetVS) ||
        !isFinite(targetVS) ||
        typeof targetInclination !== "number" ||
        isNaN(targetInclination) ||
        !isFinite(targetInclination)
      ) {
        console.error("Invalid target values for dogleg calculation:", {
          targetTVD,
          targetVS,
          targetInclination,
        });
        return defaultValue;
      }

      // Calculate current position
      const currentTVD =
        latestSurvey.bitDepth *
        Math.cos((latestSurvey.inclination * Math.PI) / 180);
      const horizontalDistance =
        latestSurvey.bitDepth *
        Math.sin((latestSurvey.inclination * Math.PI) / 180);
      const currentVS = horizontalDistance;

      // Validate calculated values
      if (
        isNaN(currentTVD) ||
        !isFinite(currentTVD) ||
        isNaN(currentVS) ||
        !isFinite(currentVS)
      ) {
        console.error("Invalid calculated position values:", {
          currentTVD,
          currentVS,
        });
        return defaultValue;
      }

      // Calculate distance to target
      const verticalDistance = targetTVD - currentTVD;
      const horizontalDistanceToTarget = targetVS - currentVS;
      const distanceToTarget = Math.sqrt(
        verticalDistance * verticalDistance +
          horizontalDistanceToTarget * horizontalDistanceToTarget,
      );

      // Validate distance calculation
      if (isNaN(distanceToTarget) || !isFinite(distanceToTarget)) {
        console.error("Invalid distance calculation:", {
          verticalDistance,
          horizontalDistanceToTarget,
          distanceToTarget,
        });
        return defaultValue;
      }

      // Avoid division by zero
      if (distanceToTarget <= 0) {
        console.warn(
          "Distance to target is zero or negative:",
          distanceToTarget,
        );
        return defaultValue;
      }

      // Calculate angle change needed
      const angleChangeNeeded = Math.abs(
        targetInclination - latestSurvey.inclination,
      );

      // Validate angle change
      if (isNaN(angleChangeNeeded) || !isFinite(angleChangeNeeded)) {
        console.error("Invalid angle change calculation:", {
          targetInclination,
          surveyInclination: latestSurvey.inclination,
          angleChangeNeeded,
        });
        return defaultValue;
      }

      // Calculate dogleg needed (simplified)
      const doglegNeeded = (angleChangeNeeded / distanceToTarget) * 100;

      // Final validation
      if (isNaN(doglegNeeded) || !isFinite(doglegNeeded)) {
        console.error("Invalid dogleg calculation result:", doglegNeeded);
        return defaultValue;
      }

      return Math.min(Math.max(doglegNeeded, 0.5), 5.0); // Limit between 0.5 and 5.0 degrees/100ft
    } catch (error) {
      console.error("Error calculating dogleg needed:", error);
      return 3.2; // Default value
    }
  };

  // Calculate above/below and left/right based on target line
  useEffect(() => {
    try {
      // Validate required data
      if (!targetLineUpdated) {
        return; // Target line not updated yet
      }

      if (!surveys) {
        console.warn("No surveys available for target line calculations");
        return;
      }

      if (!Array.isArray(surveys)) {
        console.error(
          "Surveys is not an array for target line calculations:",
          surveys,
        );
        return;
      }

      if (surveys.length === 0) {
        console.warn("Empty surveys array for target line calculations");
        return;
      }

      // Use the already calculated latestSurvey instead of taking surveys[0]
      if (!latestSurvey) {
        console.warn("No latest survey available for target line calculations");
        return;
      }

      // Validate survey data
      if (
        typeof latestSurvey !== "object" ||
        typeof latestSurvey.bitDepth !== "number" ||
        isNaN(latestSurvey.bitDepth) ||
        !isFinite(latestSurvey.bitDepth) ||
        typeof latestSurvey.inclination !== "number" ||
        isNaN(latestSurvey.inclination) ||
        !isFinite(latestSurvey.inclination) ||
        typeof latestSurvey.azimuth !== "number" ||
        isNaN(latestSurvey.azimuth) ||
        !isFinite(latestSurvey.azimuth)
      ) {
        console.error(
          "Invalid latest survey data for target line calculations:",
          {
            bitDepth: latestSurvey.bitDepth,
            inclination: latestSurvey.inclination,
            azimuth: latestSurvey.azimuth,
          },
        );
        return;
      }

      // Validate target values
      if (
        typeof targetTVD !== "number" ||
        isNaN(targetTVD) ||
        !isFinite(targetTVD) ||
        typeof targetVS !== "number" ||
        isNaN(targetVS) ||
        !isFinite(targetVS) ||
        typeof targetAzimuth !== "number" ||
        isNaN(targetAzimuth) ||
        !isFinite(targetAzimuth)
      ) {
        console.error("Invalid target values for target line calculations:", {
          targetTVD,
          targetVS,
          targetAzimuth,
        });
        return;
      }

      // Calculate angles in radians with validation
      const incRad = (latestSurvey.inclination * Math.PI) / 180;
      const azRad = (latestSurvey.azimuth * Math.PI) / 180;
      const targetAzRad = (targetAzimuth * Math.PI) / 180;

      if (
        isNaN(incRad) ||
        !isFinite(incRad) ||
        isNaN(azRad) ||
        !isFinite(azRad) ||
        isNaN(targetAzRad) ||
        !isFinite(targetAzRad)
      ) {
        console.error("Invalid angle calculations for target line:", {
          incRad,
          azRad,
          targetAzRad,
        });
        return;
      }

      // Calculate current position
      const currentTVD = latestSurvey.bitDepth * Math.cos(incRad);
      const horizontalDistance = latestSurvey.bitDepth * Math.sin(incRad);

      if (
        isNaN(currentTVD) ||
        !isFinite(currentTVD) ||
        isNaN(horizontalDistance) ||
        !isFinite(horizontalDistance)
      ) {
        console.error("Invalid position calculations for target line:", {
          currentTVD,
          horizontalDistance,
        });
        return;
      }

      // Calculate above/below (vertical difference)
      const aboveBelow = targetTVD - currentTVD;
      if (isNaN(aboveBelow) || !isFinite(aboveBelow)) {
        console.error("Invalid above/below calculation:", aboveBelow);
        return;
      }
      setAboveBelow(aboveBelow);

      // Calculate left/right (horizontal difference)
      const currentNS = horizontalDistance * Math.cos(azRad);
      const currentEW = horizontalDistance * Math.sin(azRad);
      const targetNS = targetVS * Math.cos(targetAzRad);
      const targetEW = targetVS * Math.sin(targetAzRad);

      if (
        isNaN(currentNS) ||
        !isFinite(currentNS) ||
        isNaN(currentEW) ||
        !isFinite(currentEW) ||
        isNaN(targetNS) ||
        !isFinite(targetNS) ||
        isNaN(targetEW) ||
        !isFinite(targetEW)
      ) {
        console.error("Invalid NS/EW calculations for target line:", {
          currentNS,
          currentEW,
          targetNS,
          targetEW,
        });
        return;
      }

      // Calculate perpendicular distance to target line
      const leftRight = Math.sqrt(
        Math.pow(targetNS - currentNS, 2) + Math.pow(targetEW - currentEW, 2),
      );

      if (isNaN(leftRight) || !isFinite(leftRight)) {
        console.error("Invalid left/right calculation:", leftRight);
        return;
      }

      setLeftRight(leftRight);
    } catch (error) {
      console.error("Error calculating target line metrics:", error);
      // Don't update state on error to keep previous valid values
    }
  }, [
    targetLineUpdated,
    surveys,
    latestSurvey,
    targetTVD,
    targetVS,
    targetInclination,
    targetAzimuth,
  ]);

  // Convert SurveyData to trajectory format for visualization
  useEffect(() => {
    try {
      // Reset error state at the beginning of processing
      setHasError(false);

      // Validate surveys array
      if (!surveys) {
        console.log("No surveys available for trajectory calculation");
        setTrajectoryData([]);
        return;
      }

      if (!Array.isArray(surveys)) {
        console.error(
          "Surveys is not an array for trajectory calculation:",
          surveys,
        );
        setTrajectoryData([]);
        return;
      }

      if (surveys.length === 0) {
        console.log("Empty surveys array for trajectory calculation");
        setTrajectoryData([]);
        return;
      }

      // Map survey data to trajectory format with enhanced validation
      const trajectoryPoints = [];

      for (let i = 0; i < surveys.length; i++) {
        try {
          const survey = surveys[i];

          // Skip invalid surveys
          if (!survey || typeof survey !== "object") {
            console.warn(`Survey at index ${i} is invalid:`, survey);
            continue;
          }

          // Validate required numeric fields
          if (
            typeof survey.bitDepth !== "number" ||
            isNaN(survey.bitDepth) ||
            !isFinite(survey.bitDepth) ||
            typeof survey.inclination !== "number" ||
            isNaN(survey.inclination) ||
            !isFinite(survey.inclination) ||
            typeof survey.azimuth !== "number" ||
            isNaN(survey.azimuth) ||
            !isFinite(survey.azimuth)
          ) {
            console.warn(`Survey at index ${i} has invalid numeric fields:`, {
              bitDepth: survey.bitDepth,
              inclination: survey.inclination,
              azimuth: survey.azimuth,
            });
            continue;
          }

          // Calculate TVD (simplified) with validation
          const incRad = (survey.inclination * Math.PI) / 180;
          if (isNaN(incRad) || !isFinite(incRad)) {
            console.warn(
              `Invalid inclination radian value for survey ${i}:`,
              incRad,
            );
            continue;
          }

          const tvd = survey.bitDepth * Math.cos(incRad);
          if (isNaN(tvd) || !isFinite(tvd)) {
            console.warn(`Invalid TVD calculation for survey ${i}:`, tvd);
            continue;
          }

          // Calculate NS/EW (simplified) with validation
          const horizontalDistance = survey.bitDepth * Math.sin(incRad);
          if (isNaN(horizontalDistance) || !isFinite(horizontalDistance)) {
            console.warn(
              `Invalid horizontal distance for survey ${i}:`,
              horizontalDistance,
            );
            continue;
          }

          const azRad = (survey.azimuth * Math.PI) / 180;
          if (isNaN(azRad) || !isFinite(azRad)) {
            console.warn(
              `Invalid azimuth radian value for survey ${i}:`,
              azRad,
            );
            continue;
          }

          const ns = horizontalDistance * Math.cos(azRad);
          const ew = horizontalDistance * Math.sin(azRad);

          if (isNaN(ns) || !isFinite(ns) || isNaN(ew) || !isFinite(ew)) {
            console.warn(`Invalid NS/EW calculation for survey ${i}:`, {
              ns,
              ew,
            });
            continue;
          }

          // Add valid point to trajectory data
          trajectoryPoints.push({
            md: survey.bitDepth,
            inc: survey.inclination,
            az: survey.azimuth,
            tvd,
            ns,
            ew,
          });
        } catch (pointError) {
          console.error(`Error processing survey at index ${i}:`, pointError);
          // Continue to next survey instead of failing the entire operation
          continue;
        }
      }

      console.log(
        `Processed ${trajectoryPoints.length} valid trajectory points out of ${surveys.length} surveys`,
      );
      setTrajectoryData(trajectoryPoints);
    } catch (error) {
      console.error(
        "Error converting survey data to trajectory format:",
        error,
      );
      setHasError(true);
      setTrajectoryData([]);
    }
  }, [surveys]);

  // Helper functions for curve data calculations
  const calculateMotorYield = (slideDistance, bendAngle, bitToBendDistance) => {
    return (bendAngle / slideDistance) * 100;
  };

  const calculateSlideSeen = (motorYield, slideDistance) => {
    return (motorYield * slideDistance) / 100;
  };

  const calculateSlideAhead = (
    motorYield,
    slideDistance,
    bitToBendDistance,
  ) => {
    return (motorYield * bitToBendDistance) / 100;
  };

  const calculateProjectedInclination = (
    currentInclination,
    buildRate,
    distance,
  ) => {
    return currentInclination + (buildRate * distance) / 100;
  };

  const calculateProjectedAzimuth = (currentAzimuth, turnRate, distance) => {
    return currentAzimuth + (turnRate * distance) / 100;
  };

  // Get parameter values based on connection status
  const getParameterValue = (value: number) => {
    return isConnected && isReceiving ? value : 0;
  };

  // Safe render function to prevent white screen
  const safeRender = () => {
    try {
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
                  WITS Connection Not Established
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
                    <label className="text-sm text-gray-400">
                      Target TVD (ft)
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        value={targetTVD}
                        onChange={(e) =>
                          setTargetTVD(parseFloat(e.target.value))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">
                      Target VS (ft)
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        value={targetVS}
                        onChange={(e) =>
                          setTargetVS(parseFloat(e.target.value))
                        }
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
                        Target line settings will be used to calculate curve
                        data and above/below/left/right values based on current
                        surveys.
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
                    <div className="text-sm text-gray-400 mb-1">
                      Above/Below
                    </div>
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
                    <div className="text-sm text-gray-400 mb-1">
                      Dogleg Needed
                    </div>
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
                  <RosebudCompass isActive={isConnected && isReceiving} />
                </div>

                {/* Curve Data Widget */}
                <div className="h-[250px]">
                  <CurveDataWidget
                    motorYield={
                      manualMotorYield !== null
                        ? manualMotorYield
                        : latestSurvey &&
                            typeof latestSurvey.inclination === "number"
                          ? calculateMotorYield(30, 2.0, 5)
                          : getParameterValue(witsData.motorYield)
                    }
                    doglegNeeded={
                      manualDoglegNeeded !== null
                        ? manualDoglegNeeded
                        : calculateDoglegNeeded()
                    }
                    slideSeen={
                      manualSlideSeen !== null
                        ? manualSlideSeen
                        : latestSurvey &&
                            typeof latestSurvey.inclination === "number"
                          ? calculateSlideSeen(
                              calculateMotorYield(30, 2.0, 5),
                              30,
                              typeof witsData?.rotaryRpm === "number"
                                ? witsData.rotaryRpm > 5
                                : false,
                            )
                          : getParameterValue(witsData.slideSeen)
                    }
                    slideAhead={
                      manualSlideAhead !== null
                        ? manualSlideAhead
                        : latestSurvey &&
                            typeof latestSurvey.inclination === "number"
                          ? calculateSlideAhead(
                              calculateMotorYield(30, 2.0, 5),
                              30,
                              5,
                              typeof witsData?.rotaryRpm === "number"
                                ? witsData.rotaryRpm > 5
                                : false,
                            )
                          : getParameterValue(witsData.slideAhead)
                    }
                    projectedInc={
                      manualProjectedInc !== null
                        ? manualProjectedInc
                        : latestSurvey &&
                            typeof latestSurvey.inclination === "number"
                          ? calculateProjectedInclination(
                              latestSurvey.inclination,
                              2.5,
                              100,
                            )
                          : targetInclination
                    }
                    projectedAz={
                      manualProjectedAz !== null
                        ? manualProjectedAz
                        : latestSurvey &&
                            typeof latestSurvey.azimuth === "number"
                          ? calculateProjectedAzimuth(
                              latestSurvey.azimuth,
                              1.8,
                              100,
                            )
                          : targetAzimuth
                    }
                    isRealtime={isConnected && isReceiving}
                    slideDistance={30}
                    bendAngle={2.0}
                    bitToBendDistance={5}
                    targetInc={targetInclination}
                    targetAz={targetAzimuth}
                    distance={100}
                    onSlideSeenChange={(value) => setManualSlideSeen(value)}
                    onSlideAheadChange={(value) => setManualSlideAhead(value)}
                    onMotorYieldChange={(value) => setManualMotorYield(value)}
                    onDoglegNeededChange={(value) =>
                      setManualDoglegNeeded(value)
                    }
                    onProjectedIncChange={(value) =>
                      setManualProjectedInc(value)
                    }
                    onProjectedAzChange={(value) => setManualProjectedAz(value)}
                  />
                  {/* Add debug logging to help identify data discrepancies */}
                  {console.log("DirectionalPage - CurveDataWidget props:", {
                    motorYield:
                      latestSurvey &&
                      typeof latestSurvey.inclination === "number"
                        ? calculateMotorYield(30, 2.0, 5)
                        : getParameterValue(witsData.motorYield),
                    doglegNeeded: calculateDoglegNeeded(),
                    slideSeen:
                      manualSlideSeen !== null
                        ? manualSlideSeen
                        : latestSurvey &&
                            typeof latestSurvey.inclination === "number"
                          ? calculateSlideSeen(
                              calculateMotorYield(30, 2.0, 5),
                              30,
                              typeof witsData?.rotaryRpm === "number"
                                ? witsData.rotaryRpm > 5
                                : false,
                            )
                          : getParameterValue(witsData.slideSeen),
                    slideAhead:
                      manualSlideAhead !== null
                        ? manualSlideAhead
                        : latestSurvey &&
                            typeof latestSurvey.inclination === "number"
                          ? calculateSlideAhead(
                              calculateMotorYield(30, 2.0, 5),
                              30,
                              5,
                              typeof witsData?.rotaryRpm === "number"
                                ? witsData.rotaryRpm > 5
                                : false,
                            )
                          : getParameterValue(witsData.slideAhead),
                    projectedInc:
                      latestSurvey &&
                      typeof latestSurvey.inclination === "number"
                        ? calculateProjectedInclination(
                            latestSurvey.inclination,
                            2.5,
                            100,
                          )
                        : targetInclination,
                    projectedAz:
                      latestSurvey && typeof latestSurvey.azimuth === "number"
                        ? calculateProjectedAzimuth(
                            latestSurvey.azimuth,
                            1.8,
                            100,
                          )
                        : targetAzimuth,
                    isRealtime: isConnected && isReceiving,
                    rotaryRpm: witsData?.rotaryRpm,
                    isRotating:
                      typeof witsData?.rotaryRpm === "number"
                        ? witsData.rotaryRpm > 5
                        : false,
                    latestSurveyData: latestSurvey
                      ? {
                          inclination: latestSurvey.inclination,
                          azimuth: latestSurvey.azimuth,
                        }
                      : null,
                    manualSlideSeen,
                    manualSlideAhead,
                  })}
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
                        <span className="text-xs text-gray-500">
                          Build Rate
                        </span>
                        <span className="text-sm font-medium text-blue-400">
                          {getParameterValue(witsData.motorYield).toFixed(1)}
                          °/100ft
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
                <NudgeProjectionControls
                  currentInclination={
                    latestSurvey && typeof latestSurvey.inclination === "number"
                      ? latestSurvey.inclination
                      : getParameterValue(witsData.inclination)
                  }
                  currentAzimuth={
                    latestSurvey && typeof latestSurvey.azimuth === "number"
                      ? latestSurvey.azimuth
                      : getParameterValue(witsData.azimuth)
                  }
                  witsData={{
                    toolFace: getParameterValue(witsData.toolFace),
                    motorYield: getParameterValue(witsData.motorYield),
                    slideDistance: getParameterValue(
                      witsData.slideDistance || 30,
                    ),
                    projectedInc: getParameterValue(witsData.projectedInc),
                    projectedAz: getParameterValue(witsData.projectedAz),
                  }}
                  isWitsConnected={isConnected && isReceiving}
                />
              </div>

              {/* Middle Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* 3D Trajectory */}
                <div className="h-[500px] bg-gray-900 border border-gray-800 rounded-md overflow-hidden">
                  <ErrorBoundary>
                    <WellTrajectory3DInteractive
                      trajectoryData={trajectoryData}
                      offsetWells={offsetWells}
                      targetTVD={targetTVD}
                      targetVS={targetVS}
                      targetAzimuth={targetAzimuth}
                      showTargetLine={targetLineUpdated}
                      manualCurveData={manualCurveData}
                    />
                  </ErrorBoundary>
                </div>

                {/* AI Analytics */}
                <div className="h-[400px]">
                  <AIAnalytics
                    isConnected={isConnected}
                    isReceiving={isReceiving}
                    witsData={witsData}
                    surveys={surveys}
                    manualCurveData={manualCurveData}
                  />
                </div>
              </div>

              {/* Survey Table */}
              <div className="mt-6">
                <SurveyTable
                  surveys={surveys || []}
                  onEditSurvey={() => {}}
                  onDeleteSurvey={() => {}}
                  onExportSurveys={() => {}}
                  onSelectSurveys={() => {}}
                  selectedSurveys={[]}
                  onEmailSurveys={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error in render:", error);
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="bg-red-900/30 border border-red-800 rounded-md p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Rendering Error
            </h2>
            <p className="text-gray-300 mb-4">
              There was a problem rendering the directional drilling dashboard.
              Please try refreshing the page.
            </p>
            <pre className="bg-gray-900 p-3 rounded text-sm text-gray-400 overflow-auto max-h-40">
              {error.toString()}
            </pre>
          </div>
        </div>
      );
    }
  };

  return safeRender();
};

export default DirectionalPage;
