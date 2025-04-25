import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, Ruler, ArrowUp, RotateCw, Zap } from "lucide-react";
import { useWits } from "@/context/WitsContext";
import { useSurveys } from "@/context/SurveyContext";
import {
  calculateMotorYield,
  calculateDoglegNeeded,
  calculateSlideSeen,
  calculateSlideAhead,
  calculateProjectedInclination,
  calculateProjectedAzimuth,
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
}: CurveDataWidgetProps) => {
  const { isReceiving, witsData } = useWits();
  const { surveys } = useSurveys();
  const [latestSurveyData, setLatestSurveyData] = useState<any>(null);

  // Get the latest survey data when surveys change
  useEffect(() => {
    try {
      if (surveys && surveys.length > 0) {
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
        if (latestSurvey) {
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
        console.log("CurveDataWidget: No surveys available");
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
        typeof latestSurveyData?.inclination === "number"
          ? latestSurveyData.inclination
          : typeof witsData?.inclination === "number"
            ? witsData.inclination
            : 0;

      const currentAz =
        typeof latestSurveyData?.azimuth === "number"
          ? latestSurveyData.azimuth
          : typeof witsData?.azimuth === "number"
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

      // Calculate motor yield
      const calculatedMotorYield = calculateMotorYield(
        slideDistance,
        bendAngle,
        bitToBendDistance,
      );

      // Determine if the tool is rotating based on rotary RPM
      // If rotary RPM is above a threshold (e.g., 5 RPM), consider it rotating
      const isRotating =
        typeof witsData?.rotaryRpm === "number"
          ? witsData.rotaryRpm > 5
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

      // Calculate slide ahead with rotation status
      const calculatedSlideAhead = calculateSlideAhead(
        calculatedMotorYield,
        slideDistance,
        bitToBendDistance,
        isRotating,
      );

      // Calculate projected inclination using build rate (not motor yield)
      const calculatedProjectedInc = calculateProjectedInclination(
        currentInc,
        2.5, // Use a standard build rate instead of motor yield
        distance,
      );

      // Calculate projected azimuth
      const calculatedProjectedAz = calculateProjectedAzimuth(
        currentAz,
        1.8, // Standard turn rate
        distance,
      );

      // Calculate dogleg needed
      const calculatedDoglegNeeded = calculateDoglegNeeded(
        currentInc,
        currentAz,
        targetInc,
        targetAz,
        distance,
      );

      return {
        motorYield: calculatedMotorYield,
        slideSeen: calculatedSlideSeen,
        slideAhead: calculatedSlideAhead,
        projectedInc: calculatedProjectedInc,
        projectedAz: calculatedProjectedAz,
        doglegNeeded: calculatedDoglegNeeded,
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
        isRotating:
          typeof witsData?.rotaryRpm === "number"
            ? witsData.rotaryRpm > 5
            : false,
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
            <div>
              <p className="text-xs text-gray-500">Motor Yield</p>
              <p className="text-sm font-medium text-cyan-400">
                {motorYield.toFixed(2)}°/100ft
              </p>
            </div>
          </div>

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
        </div>
      </CardContent>
    </Card>
  );
};

export default CurveDataWidget;
