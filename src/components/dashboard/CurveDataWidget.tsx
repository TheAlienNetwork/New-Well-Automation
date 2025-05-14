import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, Ruler, ArrowUp, RotateCw, Zap, Edit } from "lucide-react";
import { useWits } from "@/context/WitsContext";
import { useSurveys } from "@/context/SurveyContext";
import { useCurveData } from "@/context/CurveDataContext";
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
  const {
    curveData: contextCurveData,
    manualInputs,
    updateManualInput,
    latestSurveyData,
  } = useCurveData();

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

  // Use values from context instead of calculating them locally
  const calculatedValues = {
    motorYield: contextCurveData.motorYield,
    slideSeen: contextCurveData.slideSeen,
    slideAhead: contextCurveData.slideAhead,
    projectedInc: contextCurveData.projectedInc,
    projectedAz: contextCurveData.projectedAz,
    doglegNeeded: contextCurveData.doglegNeeded,
    isRotating: contextCurveData.isRotating,
  };

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

  // Update manual input fields when props change and sync with context
  useEffect(() => {
    if (propMotorYield !== undefined) {
      setManualMotorYield(propMotorYield.toString());
      updateManualInput("motorYield", propMotorYield);
    }
    if (propDoglegNeeded !== undefined) {
      setManualDoglegNeeded(propDoglegNeeded.toString());
      updateManualInput("doglegNeeded", propDoglegNeeded);
    }
    if (propSlideSeen !== undefined) {
      setManualSlideSeen(propSlideSeen.toString());
      updateManualInput("slideSeen", propSlideSeen);
    }
    if (propSlideAhead !== undefined) {
      setManualSlideAhead(propSlideAhead.toString());
      updateManualInput("slideAhead", propSlideAhead);
    }
    if (propProjectedInc !== undefined) {
      setManualProjectedInc(propProjectedInc.toString());
      updateManualInput("projectedInc", propProjectedInc);
    }
    if (propProjectedAz !== undefined) {
      setManualProjectedAz(propProjectedAz.toString());
      updateManualInput("projectedAz", propProjectedAz);
    }
  }, [
    propMotorYield,
    propDoglegNeeded,
    propSlideSeen,
    propSlideAhead,
    propProjectedInc,
    propProjectedAz,
    updateManualInput,
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
                        updateManualInput("motorYield", parsedValue);
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
                        updateManualInput("motorYield", parsedValue);
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
                        updateManualInput("doglegNeeded", parsedValue);
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
                        updateManualInput("doglegNeeded", parsedValue);
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
                        updateManualInput("slideSeen", parsedValue);
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
                        updateManualInput("slideSeen", parsedValue);
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
                        updateManualInput("slideAhead", parsedValue);
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
                        updateManualInput("slideAhead", parsedValue);
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
                        updateManualInput("projectedInc", parsedValue);
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
                        updateManualInput("projectedInc", parsedValue);
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
                        updateManualInput("projectedAz", parsedValue);
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
                        updateManualInput("projectedAz", parsedValue);
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
