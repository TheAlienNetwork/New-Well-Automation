import React, { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Mail } from "lucide-react";
import { useCurveData } from "@/context/CurveDataContext";
import html2canvas from "html2canvas";
import GammaPlot from "./GammaPlot";
import TargetLineStatusWidget from "./TargetLineStatusWidget";
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
  curveData: propCurveData,
  surveyData,
  witsData,
  slideDistance = 30,
  bendAngle = 2.0,
  bitToBendDistance = 5,
  targetInc = 90,
  targetAz = 270,
  targetDistance = 100,
}: SurveyEmailPreviewProps) => {
  // Get curve data from context
  const { curveData: contextCurveData } = useCurveData();
  const calculateCurveData = () => {
    try {
      // Use curveData from props if available, then context, otherwise calculate from survey/wits data
      if (propCurveData && Object.keys(propCurveData).length > 0) {
        console.log(
          "SurveyEmailPreview - Using provided curve data from props:",
          propCurveData,
        );
        return {
          motorYield: propCurveData.motorYield ?? 0,
          doglegNeeded: propCurveData.doglegNeeded ?? 0,
          slideSeen: propCurveData.slideSeen ?? 0,
          slideAhead: propCurveData.slideAhead ?? 0,
          projectedInc: propCurveData.projectedInc ?? 0,
          projectedAz: propCurveData.projectedAz ?? 0,
          isRotating: propCurveData.isRotating ?? false,
        };
      }

      // Use curve data from context if available, prioritizing manual inputs
      if (contextCurveData) {
        console.log(
          "SurveyEmailPreview - Using curve data from context:",
          contextCurveData,
        );

        // Use manual inputs if available, otherwise use calculated values from context
        return {
          motorYield:
            manualInputs.motorYield !== null
              ? manualInputs.motorYield
              : contextCurveData.motorYield,
          doglegNeeded:
            manualInputs.doglegNeeded !== null
              ? manualInputs.doglegNeeded
              : contextCurveData.doglegNeeded,
          slideSeen:
            manualInputs.slideSeen !== null
              ? manualInputs.slideSeen
              : contextCurveData.slideSeen,
          slideAhead:
            manualInputs.slideAhead !== null
              ? manualInputs.slideAhead
              : contextCurveData.slideAhead,
          projectedInc:
            manualInputs.projectedInc !== null
              ? manualInputs.projectedInc
              : contextCurveData.projectedInc,
          projectedAz:
            manualInputs.projectedAz !== null
              ? manualInputs.projectedAz
              : contextCurveData.projectedAz,
          isRotating: contextCurveData.isRotating,
        };
      }

      // If no context data available, use static values instead of calculating
      return {
        motorYield: 2.5,
        doglegNeeded: 3.2,
        slideSeen: 1.8,
        slideAhead: 2.1,
        projectedInc: 90.0,
        projectedAz: 270.0,
        isRotating: false,
      };
    } catch (error) {
      console.error(
        "Error calculating curve data in SurveyEmailPreview:",
        error,
      );
      return {
        motorYield: 2.5,
        doglegNeeded: 3.2,
        slideSeen: 1.8,
        slideAhead: 2.1,
        projectedInc: 90.0,
        projectedAz: 270.0,
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

  // Create ref for email preview container for screenshot functionality
  const emailPreviewRef = useRef<HTMLDivElement>(null);

  // Function to copy email preview to clipboard
  const copyToClipboard = async () => {
    if (emailPreviewRef.current) {
      try {
        const canvas = await html2canvas(emailPreviewRef.current);
        canvas.toBlob((blob) => {
          if (blob) {
            navigator.clipboard.write([
              new ClipboardItem({
                "image/png": blob,
              }),
            ]);
            alert("Email preview copied to clipboard!");
          }
        });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        alert("Failed to copy to clipboard");
      }
    }
  };

  // Function to open email in Outlook
  const openInOutlook = () => {
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody.replace(/<[^>]*>/g, ""));
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // Sample gamma data for the plot
  const gammaData = [
    { tvd: 8000, gamma: 45 },
    { tvd: 8010, gamma: 52 },
    { tvd: 8020, gamma: 48 },
    { tvd: 8030, gamma: 65 },
    { tvd: 8040, gamma: 72 },
    { tvd: 8050, gamma: 58 },
    { tvd: 8060, gamma: 42 },
    { tvd: 8070, gamma: 38 },
    { tvd: 8080, gamma: 45 },
    { tvd: 8090, gamma: 50 },
  ];

  // Target line data for the widget
  const targetLineData = {
    aboveBelow: -5.2,
    leftRight: 8.7,
    distanceToTarget: 10.1,
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={copyToClipboard}
        >
          <Copy className="h-4 w-4" />
          Copy to Clipboard
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={openInOutlook}
        >
          <Mail className="h-4 w-4" />
          Open in Outlook
        </Button>
      </div>

      <Card className="w-full h-auto bg-white dark:bg-neutral-900 dark:border-neutral-800 border border-gray-200 shadow-lg rounded-2xl transition-all">
        <CardContent className="p-6 flex flex-col gap-6" ref={emailPreviewRef}>
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

          {/* Gamma Plot */}
          <div className="mt-4">
            <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">
              Gamma Ray Log
            </h3>
            <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <GammaPlot data={gammaData} isRealtime={false} />
            </div>
          </div>

          {/* Target Line Status */}
          <div className="mt-4">
            <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">
              Target Line Status
            </h3>
            <div className="h-[200px]">
              <TargetLineStatusWidget
                aboveBelow={targetLineData.aboveBelow}
                leftRight={targetLineData.leftRight}
                distanceToTarget={targetLineData.distanceToTarget}
                doglegNeeded={displayCurveData.doglegNeeded}
                targetAzimuth={targetAz}
                targetInclination={targetInc}
                isRealtime={false}
                wellInfo={{
                  wellName: "Demo Well",
                  rigName: "Demo Rig",
                }}
              />
            </div>
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
    </div>
  );
};

export default SurveyEmailPreview;
