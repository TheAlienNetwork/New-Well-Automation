import React, { useState, useEffect } from "react";
import { useSurveys } from "@/context/SurveyContext";
import { useWits } from "@/context/WitsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Ruler,
  ArrowUp,
  RotateCw,
  Zap,
  Activity,
  Target,
  GitBranch,
} from "lucide-react";
import {
  calculateMotorYield,
  calculateDoglegNeeded,
  calculateSlideSeen,
  calculateSlideAhead,
  calculateProjectedInclination,
  calculateProjectedAzimuth,
} from "@/utils/directionalCalculations";

interface DirectionalMetricsPanelProps {
  slideDistance?: number;
  bendAngle?: number;
  bitToBendDistance?: number;
  targetInc?: number;
  targetAz?: number;
  targetDistance?: number;
  toolFace?: number;
  buildRate?: number;
  turnRate?: number;
  isRealtime?: boolean;
  wellInfo?: {
    wellName: string;
    rigName: string;
    sensorOffset: number;
  };
}

const DirectionalMetricsPanel: React.FC<DirectionalMetricsPanelProps> = ({
  slideDistance = 30,
  bendAngle = 2.0,
  bitToBendDistance = 5,
  targetInc = 90,
  targetAz = 270,
  targetDistance = 100,
  toolFace,
  buildRate = 2.5,
  turnRate = 1.8,
  isRealtime: propIsRealtime,
  wellInfo,
}) => {
  const { surveys } = useSurveys();
  const { witsData, isReceiving } = useWits();
  const [latestSurvey, setLatestSurvey] = useState<any>(null);

  // Get the latest survey data
  useEffect(() => {
    try {
      if (surveys && Array.isArray(surveys) && surveys.length > 0) {
        // Sort surveys by timestamp (newest first)
        const sortedSurveys = [...surveys].sort((a, b) => {
          try {
            return (
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          } catch (dateError) {
            console.error("Error sorting survey timestamps:", dateError);
            return 0; // Return 0 to maintain original order if date comparison fails
          }
        });

        // Validate the survey data before setting it
        const latestSurvey = sortedSurveys[0];
        if (latestSurvey && typeof latestSurvey === "object") {
          console.log("Setting latest survey:", latestSurvey);
          setLatestSurvey(latestSurvey);
        } else {
          console.warn("Latest survey is invalid:", latestSurvey);
          setLatestSurvey(null);
        }
      } else {
        console.log("No surveys available or surveys is not an array");
        setLatestSurvey(null);
      }
    } catch (error) {
      console.error(
        "Error updating latest survey in DirectionalMetricsPanel:",
        error,
      );
      setLatestSurvey(null);
    }
  }, [surveys]);

  // Get the current toolface from WITS data if not provided as prop
  const currentToolFace =
    toolFace ?? (isReceiving ? witsData?.toolFace : 0) ?? 0;

  // Get current inclination and azimuth from survey or WITS data with enhanced validation
  const getCurrentValue = (surveyValue: any, witsValue: any, label: string) => {
    try {
      if (
        typeof surveyValue === "number" &&
        !isNaN(surveyValue) &&
        isFinite(surveyValue)
      ) {
        return surveyValue;
      } else if (
        typeof witsValue === "number" &&
        !isNaN(witsValue) &&
        isFinite(witsValue)
      ) {
        return witsValue;
      } else {
        console.warn(
          `Invalid ${label} values - survey: ${surveyValue}, wits: ${witsValue}. Using default 0.`,
        );
        return 0;
      }
    } catch (error) {
      console.error(`Error getting ${label} value:`, error);
      return 0;
    }
  };

  const currentInc = getCurrentValue(
    latestSurvey?.inclination,
    witsData?.inclination,
    "inclination",
  );
  const currentAz = getCurrentValue(
    latestSurvey?.azimuth,
    witsData?.azimuth,
    "azimuth",
  );

  // Calculate values with error handling
  const safeCalculate = (
    calculationFn: Function,
    params: any[],
    defaultValue: number,
    label: string,
  ) => {
    try {
      const result = calculationFn(...params);
      if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
        return result;
      } else {
        console.warn(
          `Invalid ${label} calculation result: ${result}. Using default ${defaultValue}.`,
        );
        return defaultValue;
      }
    } catch (error) {
      console.error(`Error calculating ${label}:`, error);
      return defaultValue;
    }
  };

  const motorYield = safeCalculate(
    calculateMotorYield,
    [slideDistance, bendAngle, bitToBendDistance],
    0,
    "motorYield",
  );

  const slideSeen = safeCalculate(
    calculateSlideSeen,
    [motorYield, slideDistance],
    0,
    "slideSeen",
  );

  const slideAhead = safeCalculate(
    calculateSlideAhead,
    [motorYield, slideDistance, bitToBendDistance],
    0,
    "slideAhead",
  );

  const projectedInc = safeCalculate(
    calculateProjectedInclination,
    [currentInc, buildRate, targetDistance],
    currentInc,
    "projectedInc",
  );

  const projectedAz = safeCalculate(
    calculateProjectedAzimuth,
    [currentAz, turnRate, targetDistance],
    currentAz,
    "projectedAz",
  );

  const doglegNeeded = safeCalculate(
    calculateDoglegNeeded,
    [currentInc, currentAz, targetInc, targetAz, targetDistance],
    0,
    "doglegNeeded",
  );

  // Calculate dogleg severity (DLS) based on actual survey data if available
  // Enhanced with comprehensive error handling and data validation
  const calculateDLS = () => {
    try {
      // Default DLS calculation based on build and turn rates
      // Validate build and turn rates first
      if (
        typeof buildRate !== "number" ||
        isNaN(buildRate) ||
        !isFinite(buildRate) ||
        typeof turnRate !== "number" ||
        isNaN(turnRate) ||
        !isFinite(turnRate)
      ) {
        console.warn(
          `Invalid build rate (${buildRate}) or turn rate (${turnRate}). Using defaults.`,
        );
        return 2.5; // Default DLS value if rates are invalid
      }

      let dls = Math.sqrt(buildRate * buildRate + turnRate * turnRate);
      console.log(
        `Default DLS calculation: ${dls}°/100ft from build rate ${buildRate} and turn rate ${turnRate}`,
      );

      // If we have at least two surveys, calculate actual DLS
      if (surveys && Array.isArray(surveys) && surveys.length >= 2) {
        try {
          // Sort surveys by timestamp (newest first)
          const sortedSurveys = [...surveys].sort((a, b) => {
            try {
              return (
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
              );
            } catch (dateError) {
              console.error(
                "Error sorting survey timestamps for DLS calculation:",
                dateError,
              );
              return 0;
            }
          });

          const survey1 = sortedSurveys[0];
          const survey2 = sortedSurveys[1];

          // Enhanced validation for survey data
          if (!survey1 || !survey2) {
            console.warn("Missing survey data for DLS calculation");
            return dls;
          }

          // Validate inclination and azimuth values
          const validInc1 =
            typeof survey1.inclination === "number" &&
            !isNaN(survey1.inclination) &&
            isFinite(survey1.inclination);
          const validInc2 =
            typeof survey2.inclination === "number" &&
            !isNaN(survey2.inclination) &&
            isFinite(survey2.inclination);
          const validAz1 =
            typeof survey1.azimuth === "number" &&
            !isNaN(survey1.azimuth) &&
            isFinite(survey1.azimuth);
          const validAz2 =
            typeof survey2.azimuth === "number" &&
            !isNaN(survey2.azimuth) &&
            isFinite(survey2.azimuth);

          if (!validInc1 || !validInc2 || !validAz1 || !validAz2) {
            console.warn(
              "Invalid inclination or azimuth data for DLS calculation",
              {
                inc1: survey1.inclination,
                inc2: survey2.inclination,
                az1: survey1.azimuth,
                az2: survey2.azimuth,
              },
            );
            return dls;
          }

          // Calculate angle change between surveys
          const incChange = Math.abs(survey1.inclination - survey2.inclination);
          const azChange = Math.abs(survey1.azimuth - survey2.azimuth);
          console.log(
            `Angle changes - Inclination: ${incChange}°, Azimuth: ${azChange}°`,
          );

          // Calculate distance between surveys with enhanced validation
          // Use measured depth if available, otherwise use bit depth
          const getSurveyDepth = (survey) => {
            if (
              typeof survey.measuredDepth === "number" &&
              !isNaN(survey.measuredDepth) &&
              isFinite(survey.measuredDepth)
            ) {
              return survey.measuredDepth;
            } else if (
              typeof survey.bitDepth === "number" &&
              !isNaN(survey.bitDepth) &&
              isFinite(survey.bitDepth)
            ) {
              return survey.bitDepth;
            } else {
              return null;
            }
          };

          const survey1Depth = getSurveyDepth(survey1);
          const survey2Depth = getSurveyDepth(survey2);

          if (survey1Depth === null || survey2Depth === null) {
            console.warn("Invalid depth data for DLS calculation", {
              depth1: survey1.measuredDepth || survey1.bitDepth,
              depth2: survey2.measuredDepth || survey2.bitDepth,
            });
            return dls;
          }

          const distance = Math.abs(survey1Depth - survey2Depth);
          console.log(`Distance between surveys: ${distance}ft`);

          if (distance <= 0 || distance > 1000) {
            // Add reasonable upper limit check
            console.warn(
              `Unreasonable distance between surveys: ${distance}ft`,
            );
            return dls;
          }

          try {
            // Calculate actual dogleg severity using the minimum curvature method
            const inc1Rad = (survey1.inclination * Math.PI) / 180;
            const azi1Rad = (survey1.azimuth * Math.PI) / 180;
            const inc2Rad = (survey2.inclination * Math.PI) / 180;
            const azi2Rad = (survey2.azimuth * Math.PI) / 180;

            const cosInc = Math.cos(inc1Rad) * Math.cos(inc2Rad);
            const sinInc = Math.sin(inc1Rad) * Math.sin(inc2Rad);
            const cosAzi = Math.cos(azi1Rad - azi2Rad);

            // Ensure the value for acos is within valid range (-1 to 1)
            const cosValue = cosInc + sinInc * cosAzi;
            const clampedCosValue = Math.max(-1, Math.min(1, cosValue));
            const doglegAngle = Math.acos(clampedCosValue);

            // Convert to degrees and calculate severity per 100ft
            const doglegDegrees = (doglegAngle * 180) / Math.PI;
            const actualDLS = (doglegDegrees / distance) * 100;

            console.log(
              `Calculated DLS: ${actualDLS}°/100ft (dogleg angle: ${doglegDegrees}°)`,
            );

            // Use the calculated DLS if it's valid and within reasonable limits
            if (
              !isNaN(actualDLS) &&
              isFinite(actualDLS) &&
              actualDLS >= 0 &&
              actualDLS < 20
            ) {
              dls = actualDLS;
              console.log(`Using calculated DLS: ${dls}°/100ft`);
            } else {
              console.warn(
                `Calculated DLS value out of reasonable range: ${actualDLS}°/100ft`,
              );
            }
          } catch (mathError) {
            console.error("Math error in DLS calculation:", mathError);
          }
        } catch (surveyError) {
          console.error(
            "Error processing surveys for DLS calculation:",
            surveyError,
          );
        }
      } else {
        console.log("Not enough surveys for DLS calculation, using default");
      }

      return dls;
    } catch (error) {
      console.error("Error calculating DLS:", error);
      // Safely calculate default value
      try {
        if (
          typeof buildRate === "number" &&
          !isNaN(buildRate) &&
          isFinite(buildRate) &&
          typeof turnRate === "number" &&
          !isNaN(turnRate) &&
          isFinite(turnRate)
        ) {
          return Math.sqrt(buildRate * buildRate + turnRate * turnRate);
        } else {
          return 2.5; // Fallback default
        }
      } catch (fallbackError) {
        console.error("Error calculating fallback DLS:", fallbackError);
        return 2.5; // Ultimate fallback
      }
    }
  };

  // Calculate the DLS
  const dls = calculateDLS();

  // Determine if data is realtime
  const isRealtime =
    propIsRealtime !== undefined ? propIsRealtime : isReceiving;

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Directional Metrics
          </CardTitle>
          {isRealtime && (
            <Badge
              variant="outline"
              className="bg-green-900/30 text-green-400 border-green-800 animate-pulse"
            >
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Motor Yield */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-cyan-900/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Motor Yield</p>
              <p className="text-sm font-medium text-cyan-400">
                {motorYield.toFixed(2)}°/100ft
              </p>
            </div>
          </div>

          {/* Dogleg Needed */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
              <Ruler className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Dogleg Needed</p>
              <p className="text-sm font-medium text-yellow-400">
                {doglegNeeded.toFixed(2)}°/100ft
              </p>
            </div>
          </div>

          {/* Slide Seen */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-900/30 flex items-center justify-center">
              <RotateCw className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Slide Seen</p>
              <p className="text-sm font-medium text-green-400">
                {slideSeen.toFixed(2)}°
              </p>
            </div>
          </div>

          {/* Slide Ahead */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
              <RotateCw className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Slide Ahead</p>
              <p className="text-sm font-medium text-blue-400">
                {slideAhead.toFixed(2)}°
              </p>
            </div>
          </div>

          {/* Projected Inclination */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-900/30 flex items-center justify-center">
              <ArrowUp className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Proj. Inc</p>
              <p className="text-sm font-medium text-purple-400">
                {projectedInc.toFixed(2)}°
              </p>
            </div>
          </div>

          {/* Projected Azimuth */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-900/30 flex items-center justify-center">
              <Compass className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Proj. Az</p>
              <p className="text-sm font-medium text-orange-400">
                {projectedAz.toFixed(2)}°
              </p>
            </div>
          </div>

          {/* Toolface */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-pink-900/30 flex items-center justify-center">
              <Target className="h-4 w-4 text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Toolface</p>
              <p className="text-sm font-medium text-pink-400">
                {currentToolFace.toFixed(1)}°
              </p>
            </div>
          </div>

          {/* Dogleg Severity */}
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-900/30 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">DLS</p>
              <p className="text-sm font-medium text-indigo-400">
                {dls.toFixed(2)}°/100ft
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DirectionalMetricsPanel;
