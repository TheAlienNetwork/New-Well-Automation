import React from "react";
import { Layers, ArrowUp, Activity } from "lucide-react";

interface SurveyDataProps {
  measuredDepth: number;
  inclination: number;
  azimuth: number;
  mdSource: "survey" | "wits";
  incSource: "survey" | "wits";
  azSource: "survey" | "wits";
}

const SurveyData = ({
  measuredDepth,
  inclination,
  azimuth,
  mdSource,
  incSource,
  azSource,
}: SurveyDataProps) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center gap-1">
        <Layers className="h-3 w-3 text-cyan-400" />
        <span className="text-gray-500">MD:</span>
        <span
          className={`${mdSource === "survey" ? "text-yellow-300" : "text-cyan-400"} font-medium`}
        >
          {measuredDepth?.toFixed(2) || "0.00"}ft
        </span>
        {mdSource === "survey" && (
          <span className="text-xs text-yellow-600 ml-1">(S)</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <ArrowUp className="h-3 w-3 text-green-400" />
        <span className="text-gray-500">Inc:</span>
        <span
          className={`${incSource === "survey" ? "text-yellow-300" : "text-green-400"} font-medium`}
        >
          {inclination?.toFixed(2) || "0.00"}°
        </span>
        {incSource === "survey" && (
          <span className="text-xs text-yellow-600 ml-1">(S)</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Activity className="h-3 w-3 text-blue-400" />
        <span className="text-gray-500">Az:</span>
        <span
          className={`${azSource === "survey" ? "text-yellow-300" : "text-blue-400"} font-medium`}
        >
          {azimuth?.toFixed(2) || "0.00"}°
        </span>
        {azSource === "survey" && (
          <span className="text-xs text-yellow-600 ml-1">(S)</span>
        )}
      </div>
    </div>
  );
};

export default SurveyData;
