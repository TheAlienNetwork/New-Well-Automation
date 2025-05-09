import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  calculateMotorYield,
  calculateDoglegNeeded,
  calculateSlideSeen,
  calculateSlideAhead,
  calculateProjectedInclination,
  calculateProjectedAzimuth,
} from "@/utils/directionalCalculations";

interface SurveyEmailPreviewProps {
  emailSubject: string;
  emailBody: string;
  signature?: string;
  curveData?: {
    motorYield?: number;
    doglegNeeded?: number;
    slideSeen?: number;
    slideAhead?: number;
    projectedInc?: number;
    projectedAz?: number;
    isRotating?: boolean;
  };
  surveyData?: {
    inclination?: number;
    azimuth?: number;
    toolFace?: number;
    bitDepth?: number;
    measuredDepth?: number;
  };
  witsData?: {
    inclination?: number;
    azimuth?: number;
    toolFace?: number;
    rotaryRpm?: number;
    gravity?: number;
    magneticField?: number;
  };
  slideDistance?: number;
  bendAngle?: number;
  bitToBendDistance?: number;
  targetInc?: number;
  targetAz?: number;
  targetDistance?: number;
}

const SurveyEmailPreview = ({
  emailSubject,
  emailBody,
  signature = "",
  curveData,
  surveyData,
  witsData,
  slideDistance = 30,
  bendAngle = 2.0,
  bitToBendDistance = 5,
  targetInc = 90,
  targetAz = 270,
  targetDistance = 100,
}: SurveyEmailPreviewProps) => {
  // Calculate curve data if not provided directly
  const calculateCurveData = () => {
    try {
      // Get current inclination and azimuth from survey or WITS data
      const currentInc =
        typeof surveyData?.inclination === "number" &&
        !isNaN(surveyData.inclination) &&
        isFinite(surveyData.inclination)
          ? surveyData.inclination
          : typeof witsData?.inclination === "number" &&
              !isNaN(witsData.inclination) &&
              isFinite(witsData.inclination)
            ? witsData.inclination
            : 0;

      const currentAz =
        typeof surveyData?.azimuth === "number" &&
        !isNaN(surveyData.azimuth) &&
        isFinite(surveyData.azimuth)
          ? surveyData.azimuth
          : typeof witsData?.azimuth === "number" &&
              !isNaN(witsData.azimuth) &&
              isFinite(witsData.azimuth)
            ? witsData.azimuth
            : 0;

      // Determine if the tool is rotating based on rotary RPM
      const rotationThreshold = 5; // RPM threshold for rotation - standardized with other components
      const isRotating =
        typeof witsData?.rotaryRpm === "number"
          ? witsData.rotaryRpm > rotationThreshold
          : false;

      // Calculate motor yield
      const motorYield = calculateMotorYield(
        slideDistance,
        bendAngle,
        bitToBendDistance,
      );

      // Calculate slide seen with rotation status
      const slideSeen = calculateSlideSeen(
        motorYield,
        slideDistance,
        isRotating,
      );

      // Calculate slide ahead with rotation status
      const slideAhead = calculateSlideAhead(
        motorYield,
        slideDistance,
        bitToBendDistance,
        isRotating,
      );

      // Calculate projected inclination using build rate
      const buildRate = 2.5; // Standard build rate - standardized with other components
      const projectedInc = calculateProjectedInclination(
        currentInc,
        buildRate,
        targetDistance,
      );

      // Calculate projected azimuth
      const turnRate = 1.8; // Standard turn rate - standardized with other components
      const projectedAz = calculateProjectedAzimuth(
        currentAz,
        turnRate,
        targetDistance,
      );

      // Calculate dogleg needed
      const doglegNeeded = calculateDoglegNeeded(
        currentInc,
        currentAz,
        targetInc,
        targetAz,
        targetDistance,
      );

      return {
        motorYield,
        doglegNeeded,
        slideSeen,
        slideAhead,
        projectedInc,
        projectedAz,
        isRotating,
      };
    } catch (error) {
      console.error(
        "Error calculating curve data in SurveyEmailPreview:",
        error,
      );
      return {
        motorYield: 0,
        doglegNeeded: 0,
        slideSeen: 0,
        slideAhead: 0,
        projectedInc: 0,
        projectedAz: 0,
        isRotating: false,
      };
    }
  };

  // Use provided curve data or calculate it
  const displayCurveData = curveData || calculateCurveData();

  return (
    <Card className="w-full h-auto bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-sm text-gray-500">Email Preview</div>
        </div>

        <div className="flex flex-col">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Subject:</div>
            <div className="text-base font-medium">{emailSubject}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Body:</div>
            <div className="text-sm whitespace-pre-wrap">{emailBody}</div>
          </div>

          {signature && (
            <div className="mt-4 pt-2 border-t border-gray-200">
              <div className="text-sm whitespace-pre-wrap text-gray-700">
                {signature}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SurveyEmailPreview;
