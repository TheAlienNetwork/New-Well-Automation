import React, { useEffect, useState } from "react";
import { useSurveys } from "@/context/SurveyContext";
import { useWits } from "@/context/WitsContext";
import ParameterWidget from "./ParameterWidget";
import {
  calculateMotorYield,
  calculateDoglegSeverity,
  calculateSlideSeen,
  calculateSlideAhead,
  calculateProjectedInclination,
  calculateProjectedAzimuth,
  calculateDoglegNeeded,
  calculateNudgeProjection,
} from "@/utils/directionalCalculations";

export type DirectionalParameterType =
  | "motorYield"
  | "doglegSeverity"
  | "slideSeen"
  | "slideAhead"
  | "projectedInc"
  | "projectedAz"
  | "doglegNeeded"
  | "nudgeProjection";

interface DirectionalParameterWidgetProps {
  parameterType: DirectionalParameterType;
  title?: string;
  unit?: string;
  color?: string;
  isExpanded?: boolean;
  onExpand?: () => void;
  onMinimize?: () => void;
  // Optional override parameters for calculations
  slideDistance?: number;
  bendAngle?: number;
  bitToBendDistance?: number;
  courseLength?: number;
  buildRate?: number;
  turnRate?: number;
  distance?: number;
  toolFace?: number;
  targetInc?: number;
  targetAz?: number;
}

const DirectionalParameterWidget: React.FC<DirectionalParameterWidgetProps> = ({
  parameterType,
  title,
  unit,
  color,
  isExpanded,
  onExpand,
  onMinimize,
  // Default values for calculation parameters
  slideDistance = 30,
  bendAngle = 2.0,
  bitToBendDistance = 5,
  courseLength = 100,
  buildRate = 2.5,
  turnRate = 1.8,
  distance = 100,
  toolFace = 0,
  targetInc = 90,
  targetAz = 270,
}) => {
  const { surveys } = useSurveys();
  const { witsData, isReceiving } = useWits();
  const [value, setValue] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(100);

  // Get the latest survey data
  const getLatestSurvey = () => {
    if (surveys.length === 0) return null;
    return [...surveys].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];
  };

  // Get the previous survey data (for dogleg severity calculation)
  const getPreviousSurvey = () => {
    if (surveys.length < 2) return null;
    const sortedSurveys = [...surveys].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return sortedSurveys[1]; // Second most recent survey
  };

  // Calculate the parameter value based on the type
  useEffect(() => {
    const latestSurvey = getLatestSurvey();
    const previousSurvey = getPreviousSurvey();

    // Only proceed if we have data from either surveys or WITS
    if (!latestSurvey && !isReceiving) return;

    // Get current inclination and azimuth from survey or WITS
    const currentInc = latestSurvey?.inclination ?? witsData?.inclination ?? 0;
    const currentAz = latestSurvey?.azimuth ?? witsData?.azimuth ?? 0;
    const currentDepth = latestSurvey?.bitDepth ?? witsData?.bitDepth ?? 0;

    let calculatedValue = 0;
    let newMin = min;
    let newMax = max;

    switch (parameterType) {
      case "motorYield":
        calculatedValue = calculateMotorYield(
          slideDistance,
          bendAngle,
          bitToBendDistance,
        );
        newMin = 0;
        newMax = 5;
        break;
      case "doglegSeverity":
        // Use previous survey if available for comparison
        if (previousSurvey) {
          calculatedValue = calculateDoglegSeverity(
            previousSurvey.inclination,
            previousSurvey.azimuth,
            currentInc,
            currentAz,
            Math.abs(currentDepth - previousSurvey.bitDepth) || courseLength,
          );
        } else if (witsData?.dls) {
          // Use WITS data if available
          calculatedValue = witsData.dls;
        }
        newMin = 0;
        newMax = 5;
        break;
      case "slideSeen":
        const motorYieldValue = calculateMotorYield(
          slideDistance,
          bendAngle,
          bitToBendDistance,
        );
        calculatedValue = calculateSlideSeen(motorYieldValue, slideDistance);
        newMin = 0;
        newMax = 10;
        break;
      case "slideAhead":
        calculatedValue = calculateSlideAhead(
          calculateMotorYield(slideDistance, bendAngle, bitToBendDistance),
          slideDistance,
          bitToBendDistance,
        );
        newMin = 0;
        newMax = 5;
        break;
      case "projectedInc":
        calculatedValue = calculateProjectedInclination(
          currentInc,
          buildRate,
          distance,
        );
        newMin = 0;
        newMax = 90;
        break;
      case "projectedAz":
        calculatedValue = calculateProjectedAzimuth(
          currentAz,
          turnRate,
          distance,
        );
        newMin = 0;
        newMax = 360;
        break;
      case "doglegNeeded":
        calculatedValue = calculateDoglegNeeded(
          currentInc,
          currentAz,
          targetInc,
          targetAz,
          distance,
        );
        newMin = 0;
        newMax = 10;
        break;
      case "nudgeProjection":
        const currentToolFace = witsData?.toolFace ?? toolFace;
        const projection = calculateNudgeProjection(
          currentInc,
          currentAz,
          currentToolFace,
          calculateMotorYield(slideDistance, bendAngle, bitToBendDistance),
          slideDistance,
        );
        // For nudge projection, we'll show the projected inclination
        calculatedValue = projection.projectedInc;
        newMin = 0;
        newMax = 90;
        break;
    }

    // Update value and history
    setValue(calculatedValue);
    setMin(newMin);
    setMax(newMax);

    // Update history (keep last 5 values)
    setHistory((prev) => {
      const newHistory = [...prev, calculatedValue].slice(-5);

      // Determine trend
      if (newHistory.length > 1) {
        const lastValue = newHistory[newHistory.length - 1];
        const prevValue = newHistory[newHistory.length - 2];
        if (lastValue > prevValue) {
          setTrend("up");
        } else if (lastValue < prevValue) {
          setTrend("down");
        } else {
          setTrend("stable");
        }
      }

      return newHistory;
    });
  }, [
    surveys,
    witsData,
    parameterType,
    slideDistance,
    bendAngle,
    bitToBendDistance,
    courseLength,
    buildRate,
    turnRate,
    distance,
    toolFace,
    targetInc,
    targetAz,
  ]);

  // Generate default title based on parameter type if not provided
  const getDefaultTitle = () => {
    switch (parameterType) {
      case "motorYield":
        return "Motor Yield";
      case "doglegSeverity":
        return "Dogleg Severity";
      case "slideSeen":
        return "Slide Seen";
      case "slideAhead":
        return "Slide Ahead";
      case "projectedInc":
        return "Projected Inc";
      case "projectedAz":
        return "Projected Az";
      case "doglegNeeded":
        return "Dogleg Needed";
      case "nudgeProjection":
        return "Nudge Projection";
      default:
        return "Parameter";
    }
  };

  // Generate default unit based on parameter type if not provided
  const getDefaultUnit = () => {
    switch (parameterType) {
      case "motorYield":
      case "doglegSeverity":
      case "doglegNeeded":
        return "°/100ft";
      case "slideSeen":
      case "slideAhead":
      case "projectedInc":
      case "projectedAz":
      case "nudgeProjection":
        return "°";
      default:
        return "";
    }
  };

  // Generate default color based on parameter type if not provided
  const getDefaultColor = () => {
    switch (parameterType) {
      case "motorYield":
        return "#00ffaa";
      case "doglegSeverity":
        return "#ff5500";
      case "slideSeen":
        return "#00ff00";
      case "slideAhead":
        return "#0088ff";
      case "projectedInc":
        return "#aa00ff";
      case "projectedAz":
        return "#ff8800";
      case "doglegNeeded":
        return "#ffff00";
      case "nudgeProjection":
        return "#ff00ff";
      default:
        return "#ffffff";
    }
  };

  return (
    <ParameterWidget
      title={title || getDefaultTitle()}
      value={value}
      unit={unit || getDefaultUnit()}
      min={min}
      max={max}
      trend={trend}
      color={color || getDefaultColor()}
      history={
        history.length > 0 ? history : [value, value, value, value, value]
      }
      isExpanded={isExpanded}
      onExpand={onExpand}
      onMinimize={onMinimize}
    />
  );
};

export default DirectionalParameterWidget;
