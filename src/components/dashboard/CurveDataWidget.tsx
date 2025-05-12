import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, Ruler, ArrowUp, RotateCw, Zap, Edit } from "lucide-react";
import { useWits } from "@/context/WitsContext";
import { useSurveys } from "@/context/SurveyContext";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateMotorYield,
  calculateDoglegNeeded,
  calculateSlideSeen,
  calculateSlideAhead,
  calculateProjectedInclination,
  calculateProjectedAzimuth,
  calculateBuildRate,
  calculateTurnRate,
} from "@/utils/directionalCalculations";

interface CurveDataWidgetProps {
  motorYield?: number;
  doglegNeeded?: number;
  slideSeen?: number;
  slideAhead?: number;
  projectedInc?: number;
  projectedAz?: number;
  isRealtime?: boolean;
  slideDistance?: number;
  bendAngle?: number;
  bitToBendDistance?: number;
  targetInc?: number;
  targetAz?: number;
  distance?: number;
  wellInfo?: {
    wellName: string;
    rigName: string;
    sensorOffset: number;
  };
  onSlideSeenChange?: (value: number) => void;
  onSlideAheadChange?: (value: number) => void;
  onMotorYieldChange?: (value: number) => void;
  onDoglegNeededChange?: (value: number) => void;
  onProjectedIncChange?: (value: number) => void;
  onProjectedAzChange?: (value: number) => void;
}

const CurveDataWidget = ({
  motorYield: propMotorYield,
  doglegNeeded: propDoglegNeeded,
  slideSeen: propSlideSeen,
  slideAhead: propSlideAhead,
  projectedInc: propProjectedInc,
  projectedAz: propProjectedAz,
  isRealtime: propIsRealtime = true,
  slideDistance = 30,
  bendAngle = 2.0,
  bitToBendDistance = 5,
  targetInc = 90,
  targetAz = 270,
  distance = 100,
  onSlideSeenChange,
  onSlideAheadChange,
  onMotorYieldChange,
  onDoglegNeededChange,
  onProjectedIncChange,
  onProjectedAzChange,
}: CurveDataWidgetProps) => {
  const { isReceiving, witsData } = useWits();
  const { surveys } = useSurveys();
  const [latestSurveyData, setLatestSurveyData] = useState<any>(null);

  // State for manual input values
  const [manualSlideSeen, setManualSlideSeen] = useState<string>(
    propSlideSeen ? propSlideSeen.toString() : "",
  );
  const [manualSlideAhead, setManualSlideAhead] = useState<string>(
    propSlideAhead ? propSlideAhead.toString() : "",
  );
  const [manualMotorYield, setManualMotorYield] = useState<string>(
    propMotorYield ? propMotorYield.toString() : "",
  );
  const [manualDoglegNeeded, setManualDoglegNeeded] = useState<string>(
    propDoglegNeeded ? propDoglegNeeded.toString() : "",
  );
  const [manualProjectedInc, setManualProjectedInc] = useState<string>(
    propProjectedInc ? propProjectedInc.toString() : "",
  );
  const [manualProjectedAz, setManualProjectedAz] = useState<string>(
    propProjectedAz ? propProjectedAz.toString() : "",
  );

  // State for editing mode
  const [isEditingSlideSeen, setIsEditingSlideSeen] = useState<boolean>(false);
  const [isEditingSlideAhead, setIsEditingSlideAhead] =
    useState<boolean>(false);
  const [isEditingMotorYield, setIsEditingMotorYield] =
    useState<boolean>(false);
  const [isEditingDoglegNeeded, setIsEditingDoglegNeeded] =
    useState<boolean>(false);
  const [isEditingProjectedInc, setIsEditingProjectedInc] =
    useState<boolean>(false);
  const [isEditingProjectedAz, setIsEditingProjectedAz] =
    useState<boolean>(false);

  // Get the latest survey data when surveys change
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
            console.error("Error comparing survey dates:", dateError);
            return 0; // Return 0 if date comparison fails
          }
        });

        // Validate the survey data before setting it
        const latestSurvey = sortedSurveys[0];
        if (latestSurvey && typeof latestSurvey === "object") {
          // Log when a new latest survey is detected
          console.log("CurveDataWidget: New latest survey detected", {
            id: latestSurvey.id,
            timestamp: latestSurvey.timestamp,
            inclination: latestSurvey.inclination,
            azimuth: latestSurvey.azimuth,
          });

          setLatestSurveyData(latestSurvey);
        } else {
          console.warn(
            "CurveDataWidget: No valid survey found in sorted surveys",
          );
          setLatestSurveyData(null);
        }
      } else {
        console.log(
          "CurveDataWidget: No surveys available or surveys is not an array",
        );
        setLatestSurveyData(null);
      }
    } catch (error) {
      console.error(
        "Error updating latest survey data in CurveDataWidget:",
        error,
      );
      setLatestSurveyData(null);
    }
  }, [surveys]);

  // Calculate values using directional calculation functions
  const calculateValues = () => {
    try {
      // Always prioritize the latest survey data for calculations
      // Ensure we have valid numeric values with explicit type checking
      const currentInc =
        typeof latestSurveyData?.inclination === "number" &&
        !isNaN(latestSurveyData.inclination) &&
        isFinite(latestSurveyData.inclination)
          ? latestSurveyData.inclination
          : typeof witsData?.inclination === "number" &&
              !isNaN(witsData.inclination) &&
              isFinite(witsData.inclination)
            ? witsData.inclination
            : 0;

      const currentAz =
        typeof latestSurveyData?.azimuth === "number" &&
        !isNaN(latestSurveyData.azimuth) &&
        isFinite(latestSurveyData.azimuth)
          ? latestSurveyData.azimuth
          : typeof witsData?.azimuth === "number" &&
              !isNaN(witsData.azimuth) &&
              isFinite(witsData.azimuth)
            ? witsData.azimuth
            : 0;

      // Log the source of the data for debugging
      console.log("CurveDataWidget calculation using:", {
        incSource:
          typeof latestSurveyData?.inclination === "number" ? "survey" : "wits",
        azSource:
          typeof latestSurveyData?.azimuth === "number" ? "survey" : "wits",
        currentInc,
        currentAz,
      });

      // Get previous survey for calculations if available
      const getPreviousSurvey = () => {
        try {
          if (surveys && Array.isArray(surveys) && surveys.length > 1) {
            // Sort surveys by timestamp (newest first)
            const sortedSurveys = [...surveys].sort((a, b) => {
              try {
                return (
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
                );
              } catch (dateError) {
                console.error("Error sorting survey timestamps:", dateError);
                return 0;
              }
            });

            // Return the second survey (previous to latest)
            return sortedSurveys[1];
          }
          return null;
        } catch (error) {
          console.error("Error getting previous survey:", error);
          return null;
        }
      };

      const previousSurvey = getPreviousSurvey();

      // Calculate motor yield using survey data if available
      let calculatedMotorYield = 0;
      if (previousSurvey && latestSurveyData) {
        const prevInc = previousSurvey.inclination;
        const prevDepth =
          previousSurvey.measuredDepth || previousSurvey.bitDepth;
        const currentDepth =
          latestSurveyData.measuredDepth || latestSurveyData.bitDepth;

        if (
          typeof prevInc === "number" &&
          typeof currentInc === "number" &&
          typeof prevDepth === "number" &&
          typeof currentDepth === "number"
        ) {
          const bitToBitDistance = Math.abs(currentDepth - prevDepth);
          calculatedMotorYield = calculateMotorYield(
            currentInc,
            prevInc,
            bitToBitDistance,
          );

          console.log(
            "CurveDataWidget - Motor yield calculation from surveys:",
            {
              currentInc,
              prevInc,
              bitToBitDistance,
              result: calculatedMotorYield,
            },
          );
        } else {
          // Fallback to legacy calculation
          calculatedMotorYield = calculateMotorYield(
            undefined,
            undefined,
            undefined,
            slideDistance,
            bendAngle,
            bitToBendDistance,
          );

          console.log("CurveDataWidget - Motor yield legacy calculation:", {
            slideDistance,
            bendAngle,
            bitToBendDistance,
            result: calculatedMotorYield,
          });
        }
      } else {
        // Fallback to legacy calculation
        calculatedMotorYield = calculateMotorYield(
          undefined,
          undefined,
          undefined,
          slideDistance,
          bendAngle,
          bitToBendDistance,
        );

        console.log("CurveDataWidget - Motor yield legacy calculation:", {
          slideDistance,
          bendAngle,
          bitToBendDistance,
          result: calculatedMotorYield,
        });
      }

      // Calculate build and turn rates if we have survey data
      let buildRate = 2.5; // Default value
      let turnRate = 1.8; // Default value

      if (previousSurvey && latestSurveyData) {
        const prevInc = previousSurvey.inclination;
        const prevAz = previousSurvey.azimuth;
        const prevDepth =
          previousSurvey.measuredDepth || previousSurvey.bitDepth;
        const currentDepth =
          latestSurveyData.measuredDepth || latestSurveyData.bitDepth;

        if (
          typeof prevInc === "number" &&
          typeof currentInc === "number" &&
          typeof prevAz === "number" &&
          typeof currentAz === "number" &&
          typeof prevDepth === "number" &&
          typeof currentDepth === "number"
        ) {
          buildRate = calculateBuildRate(
            prevInc,
            currentInc,
            prevDepth,
            currentDepth,
          );

          turnRate = calculateTurnRate(
            prevAz,
            currentAz,
            prevDepth,
            currentDepth,
          );

          console.log("CurveDataWidget - Build and turn rate calculations:", {
            prevInc,
            currentInc,
            prevAz,
            currentAz,
            prevDepth,
            currentDepth,
            buildRate,
            turnRate,
          });
        }
      }

      // Determine if the tool is rotating based on rotary RPM
      // If rotary RPM is above a threshold (e.g., 5 RPM), consider it rotating
      const rotationThreshold = 5; // RPM threshold for rotation
      const isRotating =
        typeof witsData?.rotaryRpm === "number"
          ? witsData.rotaryRpm > rotationThreshold
          : false;

      console.log("Rotation status:", {
        rotaryRpm: witsData?.rotaryRpm,
        isRotating,
        source: "CurveDataWidget calculation",
      });

      // Calculate slide seen with rotation status
      const calculatedSlideSeen = calculateSlideSeen(
        calculatedMotorYield,
        slideDistance,
        isRotating,
      );

      // Use manual slide seen value if available and valid
      let finalSlideSeen = calculatedSlideSeen;
      if (manualSlideSeen !== "") {
        const parsedSlideSeen = parseFloat(manualSlideSeen);
        if (!isNaN(parsedSlideSeen) && isFinite(parsedSlideSeen)) {
          finalSlideSeen = parsedSlideSeen;
          // Notify parent component of the change if callback is provided
          if (onSlideSeenChange) {
            onSlideSeenChange(parsedSlideSeen);
          }
        }
      }

      console.log("CurveDataWidget - Slide seen calculation:", {
        motorYield: calculatedMotorYield,
        slideDistance,
        isRotating,
        calculatedValue: calculatedSlideSeen,
        manualValue: manualSlideSeen,
        finalValue: finalSlideSeen,
      });

      // Calculate slide ahead with rotation status
      const calculatedSlideAhead = calculateSlideAhead(
        calculatedMotorYield,
        slideDistance,
        bitToBendDistance,
        isRotating,
      );

      // Use manual slide ahead value if available and valid
      let finalSlideAhead = calculatedSlideAhead;
      if (manualSlideAhead !== "") {
        const parsedSlideAhead = parseFloat(manualSlideAhead);
        if (!isNaN(parsedSlideAhead) && isFinite(parsedSlideAhead)) {
          finalSlideAhead = parsedSlideAhead;
          // Notify parent component of the change if callback is provided
          if (onSlideAheadChange) {
            onSlideAheadChange(parsedSlideAhead);
          }
        }
      }

      console.log("CurveDataWidget - Slide ahead calculation:", {
        motorYield: calculatedMotorYield,
        slideDistance,
        bitToBendDistance,
        isRotating,
        calculatedValue: calculatedSlideAhead,
        manualValue: manualSlideAhead,
        finalValue: finalSlideAhead,
      });

      // Calculate projected inclination using build rate
      const calculatedProjectedInc = calculateProjectedInclination(
        currentInc,
        buildRate,
        distance,
      );

      console.log("CurveDataWidget - Projected inclination calculation:", {
        currentInc,
        buildRate,
        distance,
        result: calculatedProjectedInc,
      });

      // Calculate projected azimuth
      const calculatedProjectedAz = calculateProjectedAzimuth(
        currentAz,
        turnRate,
        distance,
      );

      console.log("CurveDataWidget - Projected azimuth calculation:", {
        currentAz,
        turnRate,
        distance,
        result: calculatedProjectedAz,
      });

      // Calculate dogleg needed
      const calculatedDoglegNeeded = calculateDoglegNeeded(
        currentInc,
        currentAz,
        targetInc,
        targetAz,
        distance,
      );

      console.log("CurveDataWidget - Dogleg needed calculation:", {
        currentInc,
        currentAz,
        targetInc,
        targetAz,
        distance,
        result: calculatedDoglegNeeded,
      });

      return {
        motorYield: calculatedMotorYield,
        slideSeen: finalSlideSeen,
        slideAhead: finalSlideAhead,
        projectedInc: calculatedProjectedInc,
        projectedAz: calculatedProjectedAz,
        doglegNeeded: calculatedDoglegNeeded,
        // Include the rotation status so it can be used elsewhere
        isRotating,
      };
    } catch (error) {
      console.error("Error calculating values in CurveDataWidget:", error);
      // Return default values if calculation fails
      return {
        motorYield: 0,
        slideSeen: 0,
        slideAhead: 0,
        projectedInc: 0,
        projectedAz: 0,
        doglegNeeded: 0,
        isRotating: false,
      };
    }
  };

  // Get calculated values - recalculate on every render to ensure latest data is used
  const calculatedValues = calculateValues();

  // Use props first, then calculated values, regardless of connection status
  // This ensures values are always displayed and updated correctly
  const motorYield =
    propMotorYield !== undefined ? propMotorYield : calculatedValues.motorYield;
  const doglegNeeded =
    propDoglegNeeded !== undefined
      ? propDoglegNeeded
      : calculatedValues.doglegNeeded;
  const slideSeen =
    propSlideSeen !== undefined ? propSlideSeen : calculatedValues.slideSeen;
  const slideAhead =
    propSlideAhead !== undefined ? propSlideAhead : calculatedValues.slideAhead;
  const projectedInc =
    propProjectedInc !== undefined
      ? propProjectedInc
      : calculatedValues.projectedInc;
  const projectedAz =
    propProjectedAz !== undefined
      ? propProjectedAz
      : calculatedValues.projectedAz;
  const isRealtime =
    propIsRealtime !== undefined ? propIsRealtime : isReceiving;
  // Extract rotation status from calculated values
  const isRotating = calculatedValues.isRotating;

  // Update manual input fields when props change
  useEffect(() => {
    if (propMotorYield !== undefined) {
      setManualMotorYield(propMotorYield.toString());
    }
    if (propDoglegNeeded !== undefined) {
      setManualDoglegNeeded(propDoglegNeeded.toString());
    }
    if (propSlideSeen !== undefined) {
      setManualSlideSeen(propSlideSeen.toString());
    }
    if (propSlideAhead !== undefined) {
      setManualSlideAhead(propSlideAhead.toString());
    }
    if (propProjectedInc !== undefined) {
      setManualProjectedInc(propProjectedInc.toString());
    }
    if (propProjectedAz !== undefined) {
      setManualProjectedAz(propProjectedAz.toString());
    }
  }, [
    propMotorYield,
    propDoglegNeeded,
    propSlideSeen,
    propSlideAhead,
    propProjectedInc,
    propProjectedAz,
  ]);

  // Log the values for debugging
  useEffect(() => {
    try {
      console.log("CurveDataWidget values:", {
        motorYield,
        doglegNeeded,
        slideSeen,
        slideAhead,
        projectedInc,
        projectedAz,
        rotaryRpm: witsData?.rotaryRpm,
        isRotating: calculatedValues.isRotating,
        latestSurveyData: latestSurveyData
          ? {
              id: latestSurveyData.id,
              timestamp: latestSurveyData.timestamp,
              inclination: latestSurveyData.inclination,
              azimuth: latestSurveyData.azimuth,
            }
          : null,
      });
    } catch (error) {
      console.error("Error logging CurveDataWidget values:", error);
    }
  }, [
    motorYield,
    doglegNeeded,
    slideSeen,
    slideAhead,
    projectedInc,
    projectedAz,
    latestSurveyData,
    witsData?.rotaryRpm,
  ]);

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Curve Data
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
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-cyan-900/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Motor Yield</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          setIsEditingMotorYield(!isEditingMotorYield)
                        }
                        className="ml-1 p-1 rounded-full hover:bg-gray-700/50"
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Edit motor yield value</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditingMotorYield ? (
                <Input
                  type="number"
                  value={manualMotorYield}
                  onChange={(e) => setManualMotorYield(e.target.value)}
                  className="h-6 text-sm font-medium text-cyan-400 bg-gray-800 border-gray-700 w-full"
                  placeholder={motorYield.toFixed(2)}
                  onBlur={() => {
                    if (manualMotorYield === "") {
                      setIsEditingMotorYield(false);
                    } else {
                      const parsedValue = parseFloat(manualMotorYield);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onMotorYieldChange
                      ) {
                        onMotorYieldChange(parsedValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingMotorYield(false);
                      const parsedValue = parseFloat(manualMotorYield);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onMotorYieldChange
                      ) {
                        onMotorYieldChange(parsedValue);
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-sm font-medium text-cyan-400">
                  {motorYield.toFixed(2)}°/100ft
                </p>
              )}
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
              <Ruler className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Dogleg Needed</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          setIsEditingDoglegNeeded(!isEditingDoglegNeeded)
                        }
                        className="ml-1 p-1 rounded-full hover:bg-gray-700/50"
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Edit dogleg needed value</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditingDoglegNeeded ? (
                <Input
                  type="number"
                  value={manualDoglegNeeded}
                  onChange={(e) => setManualDoglegNeeded(e.target.value)}
                  className="h-6 text-sm font-medium text-yellow-400 bg-gray-800 border-gray-700 w-full"
                  placeholder={doglegNeeded.toFixed(2)}
                  onBlur={() => {
                    if (manualDoglegNeeded === "") {
                      setIsEditingDoglegNeeded(false);
                    } else {
                      const parsedValue = parseFloat(manualDoglegNeeded);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onDoglegNeededChange
                      ) {
                        onDoglegNeededChange(parsedValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingDoglegNeeded(false);
                      const parsedValue = parseFloat(manualDoglegNeeded);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onDoglegNeededChange
                      ) {
                        onDoglegNeededChange(parsedValue);
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-sm font-medium text-yellow-400">
                  {doglegNeeded.toFixed(2)}°/100ft
                </p>
              )}
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-900/30 flex items-center justify-center">
              <RotateCw className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Slide Seen</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          setIsEditingSlideSeen(!isEditingSlideSeen)
                        }
                        className="ml-1 p-1 rounded-full hover:bg-gray-700/50"
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Edit slide seen value</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditingSlideSeen ? (
                <Input
                  type="number"
                  value={manualSlideSeen}
                  onChange={(e) => setManualSlideSeen(e.target.value)}
                  className="h-6 text-sm font-medium text-green-400 bg-gray-800 border-gray-700 w-full"
                  placeholder={slideSeen.toFixed(2)}
                  onBlur={() => {
                    if (manualSlideSeen === "") {
                      setIsEditingSlideSeen(false);
                    } else {
                      const parsedValue = parseFloat(manualSlideSeen);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onSlideSeenChange
                      ) {
                        onSlideSeenChange(parsedValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingSlideSeen(false);
                      const parsedValue = parseFloat(manualSlideSeen);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onSlideSeenChange
                      ) {
                        onSlideSeenChange(parsedValue);
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-sm font-medium text-green-400">
                  {slideSeen.toFixed(2)}°
                </p>
              )}
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
              <RotateCw className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Slide Ahead</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          setIsEditingSlideAhead(!isEditingSlideAhead)
                        }
                        className="ml-1 p-1 rounded-full hover:bg-gray-700/50"
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Edit slide ahead value</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditingSlideAhead ? (
                <Input
                  type="number"
                  value={manualSlideAhead}
                  onChange={(e) => setManualSlideAhead(e.target.value)}
                  className="h-6 text-sm font-medium text-blue-400 bg-gray-800 border-gray-700 w-full"
                  placeholder={slideAhead.toFixed(2)}
                  onBlur={() => {
                    if (manualSlideAhead === "") {
                      setIsEditingSlideAhead(false);
                    } else {
                      const parsedValue = parseFloat(manualSlideAhead);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onSlideAheadChange
                      ) {
                        onSlideAheadChange(parsedValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingSlideAhead(false);
                      const parsedValue = parseFloat(manualSlideAhead);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onSlideAheadChange
                      ) {
                        onSlideAheadChange(parsedValue);
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-sm font-medium text-blue-400">
                  {slideAhead.toFixed(2)}°
                </p>
              )}
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-900/30 flex items-center justify-center">
              <ArrowUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Proj. Inc</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          setIsEditingProjectedInc(!isEditingProjectedInc)
                        }
                        className="ml-1 p-1 rounded-full hover:bg-gray-700/50"
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Edit projected inclination value
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditingProjectedInc ? (
                <Input
                  type="number"
                  value={manualProjectedInc}
                  onChange={(e) => setManualProjectedInc(e.target.value)}
                  className="h-6 text-sm font-medium text-purple-400 bg-gray-800 border-gray-700 w-full"
                  placeholder={projectedInc.toFixed(2)}
                  onBlur={() => {
                    if (manualProjectedInc === "") {
                      setIsEditingProjectedInc(false);
                    } else {
                      const parsedValue = parseFloat(manualProjectedInc);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onProjectedIncChange
                      ) {
                        onProjectedIncChange(parsedValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingProjectedInc(false);
                      const parsedValue = parseFloat(manualProjectedInc);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onProjectedIncChange
                      ) {
                        onProjectedIncChange(parsedValue);
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-sm font-medium text-purple-400">
                  {projectedInc.toFixed(2)}°
                </p>
              )}
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-900/30 flex items-center justify-center">
              <Compass className="h-4 w-4 text-orange-400" />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Proj. Az</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          setIsEditingProjectedAz(!isEditingProjectedAz)
                        }
                        className="ml-1 p-1 rounded-full hover:bg-gray-700/50"
                      >
                        <Edit className="h-3 w-3 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Edit projected azimuth value</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditingProjectedAz ? (
                <Input
                  type="number"
                  value={manualProjectedAz}
                  onChange={(e) => setManualProjectedAz(e.target.value)}
                  className="h-6 text-sm font-medium text-orange-400 bg-gray-800 border-gray-700 w-full"
                  placeholder={projectedAz.toFixed(2)}
                  onBlur={() => {
                    if (manualProjectedAz === "") {
                      setIsEditingProjectedAz(false);
                    } else {
                      const parsedValue = parseFloat(manualProjectedAz);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onProjectedAzChange
                      ) {
                        onProjectedAzChange(parsedValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingProjectedAz(false);
                      const parsedValue = parseFloat(manualProjectedAz);
                      if (
                        !isNaN(parsedValue) &&
                        isFinite(parsedValue) &&
                        onProjectedAzChange
                      ) {
                        onProjectedAzChange(parsedValue);
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-sm font-medium text-orange-400">
                  {projectedAz.toFixed(2)}°
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurveDataWidget;
