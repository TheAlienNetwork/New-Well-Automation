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
import clsx from "clsx";

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
  const calculateCurveData = () => {
    try {
      // Use curveData from props if available, otherwise calculate from survey/wits data
      if (curveData && Object.keys(curveData).length > 0) {
        console.log(
          "SurveyEmailPreview - Using provided curve data:",
          curveData,
        );
        return {
          motorYield: curveData.motorYield ?? 0,
          doglegNeeded: curveData.doglegNeeded ?? 0,
          slideSeen: curveData.slideSeen ?? 0,
          slideAhead: curveData.slideAhead ?? 0,
          projectedInc: curveData.projectedInc ?? 0,
          projectedAz: curveData.projectedAz ?? 0,
          isRotating: curveData.isRotating ?? false,
        };
      }

      const currentInc =
        typeof surveyData?.inclination === "number" &&
        isFinite(surveyData.inclination)
          ? surveyData.inclination
          : typeof witsData?.inclination === "number" &&
              isFinite(witsData.inclination)
            ? witsData.inclination
            : 0;

      const currentAz =
        typeof surveyData?.azimuth === "number" && isFinite(surveyData.azimuth)
          ? surveyData.azimuth
          : typeof witsData?.azimuth === "number" && isFinite(witsData.azimuth)
            ? witsData.azimuth
            : 0;

      console.log("SurveyEmailPreview - Calculating curve data with:", {
        currentInc,
        currentAz,
        surveyData: surveyData
          ? { inc: surveyData.inclination, az: surveyData.azimuth }
          : "No survey data",
        witsData: witsData
          ? { inc: witsData.inclination, az: witsData.azimuth }
          : "No WITS data",
      });

      const rotationThreshold = 5;
      const isRotating =
        typeof witsData?.rotaryRpm === "number"
          ? witsData.rotaryRpm > rotationThreshold
          : false;

      const motorYield = calculateMotorYield(
        undefined,
        undefined,
        undefined,
        slideDistance,
        bendAngle,
        bitToBendDistance,
      );
      const slideSeen = calculateSlideSeen(
        motorYield,
        slideDistance,
        isRotating,
      );
      const slideAhead = calculateSlideAhead(
        motorYield,
        slideDistance,
        bitToBendDistance,
        isRotating,
      );
      const buildRate = 2.5;
      const projectedInc = calculateProjectedInclination(
        currentInc,
        buildRate,
        targetDistance,
      );
      const turnRate = 1.8;
      const projectedAz = calculateProjectedAzimuth(
        currentAz,
        turnRate,
        targetDistance,
      );
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

  const displayCurveData = calculateCurveData();

  const renderSurveyTable = () => {
    const rows: { label: string; value?: number | string }[] = [
      {
        label: "Inclination",
        value: surveyData?.inclination ?? witsData?.inclination,
      },
      { label: "Azimuth", value: surveyData?.azimuth ?? witsData?.azimuth },
      { label: "Tool Face", value: surveyData?.toolFace ?? witsData?.toolFace },
      { label: "Bit Depth", value: surveyData?.bitDepth },
      { label: "Measured Depth", value: surveyData?.measuredDepth },
      { label: "Rotary RPM", value: witsData?.rotaryRpm },
      { label: "Gravity", value: witsData?.gravity },
      { label: "Magnetic Field", value: witsData?.magneticField },
      { label: "Motor Yield", value: displayCurveData.motorYield?.toFixed(2) },
      {
        label: "Dogleg Needed",
        value: displayCurveData.doglegNeeded?.toFixed(2),
      },
      { label: "Slide Seen", value: displayCurveData.slideSeen?.toFixed(2) },
      { label: "Slide Ahead", value: displayCurveData.slideAhead?.toFixed(2) },
      {
        label: "Projected Inc",
        value: displayCurveData.projectedInc?.toFixed(2),
      },
      {
        label: "Projected Az",
        value: displayCurveData.projectedAz?.toFixed(2),
      },
      {
        label: "Is Rotating",
        value: (
          <span
            className={clsx(
              "px-2 py-0.5 text-xs font-semibold rounded-full",
              displayCurveData.isRotating
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800",
            )}
          >
            {displayCurveData.isRotating ? "Yes" : "No"}
          </span>
        ),
      },
    ];

    return (
      <div className="mt-6">
        <h2 className="text-base font-semibold mb-3 text-gray-800">
          Survey Summary
        </h2>
        <div className="overflow-x-auto rounded-lg shadow ring-1 ring-gray-200">
          <table className="min-w-full text-sm divide-y divide-gray-200 bg-white">
            <tbody>
              {rows.map(
                (row, index) =>
                  row.value !== undefined && (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                        {row.label}
                      </td>
                      <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                        {row.value}
                      </td>
                    </tr>
                  ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-auto bg-white dark:bg-neutral-900 dark:border-neutral-800 border border-gray-200 shadow-lg rounded-2xl transition-all">
      <CardContent className="p-6 flex flex-col gap-6">
        {/* Email Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="text-sm text-gray-500 dark:text-neutral-400">
            Email Preview
          </div>
        </div>

        {/* Subject */}
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Subject:
          </div>
          <div className="text-base font-semibold text-gray-800 dark:text-white">
            {emailSubject}
          </div>
        </div>

        {/* Body */}
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Body:
          </div>
          <div
            className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: emailBody }}
          />
        </div>

        {/* Survey Summary */}
        {renderSurveyTable()}

        {/* Signature */}
        {signature && (
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-neutral-700">
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {signature}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SurveyEmailPreview;
