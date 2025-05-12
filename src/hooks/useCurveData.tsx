import { useState, useEffect, useRef } from "react";
import { useSurveys } from "@/context/SurveyContext";
import { useWits } from "@/context/WitsContext";

interface CurveDataConfig {
  minDistanceThreshold?: number;
  rotationRpmThreshold?: number;
  debounceMs?: number;
  movingAverageCount?: number;
  manualInputConstraints?: {
    motorYield?: { min: number; max: number };
    buildRate?: { min: number; max: number };
    turnRate?: { min: number; max: number };
    slideDistance?: { min: number; max: number };
    bitToBendDistance?: { min: number; max: number };
    bendAngle?: { min: number; max: number };
  };
}

interface CurveData {
  motorYield: number;
  doglegNeeded: number;
  slideSeen: number;
  slideAhead: number;
  projectedInc: number;
  projectedAz: number;
  isRotating: boolean;
  buildRate: number;
  turnRate: number;
  slideDistance: number;
  bitToBendDistance: number;
  bendAngle: number;
  targetDistance: number;
  targetInc: number;
  targetAz: number;
}

const DEFAULT_CONFIG: CurveDataConfig = {
  minDistanceThreshold: 1.0, // Minimum distance in feet for survey-based calculations
  rotationRpmThreshold: 5.0, // RPM threshold to determine if rotating
  debounceMs: 500, // Debounce time in milliseconds for rotation state
  movingAverageCount: 3, // Number of surveys to use for moving average
  manualInputConstraints: {
    motorYield: { min: 0.1, max: 10.0 },
    buildRate: { min: 0.1, max: 10.0 },
    turnRate: { min: 0.1, max: 10.0 },
    slideDistance: { min: 1.0, max: 100.0 },
    bitToBendDistance: { min: 0.1, max: 20.0 },
    bendAngle: { min: 0.1, max: 5.0 },
  },
};

// This hook is deprecated. Use the CurveDataContext instead.
// This is kept for backward compatibility.
export function useCurveData(config: CurveDataConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { surveys } = useSurveys();
  const { witsData } = useWits();

  // State for calculated curve data
  const [curveData, setCurveData] = useState<CurveData>({
    motorYield: 2.5,
    doglegNeeded: 0,
    slideSeen: 0,
    slideAhead: 0,
    projectedInc: 0,
    projectedAz: 0,
    isRotating: false,
    buildRate: 2.5,
    turnRate: 1.8,
    slideDistance: 30,
    bitToBendDistance: 5,
    bendAngle: 2.0,
    targetDistance: 100,
    targetInc: 90,
    targetAz: 270,
  });

  // State for manual inputs
  const [manualInputs, setManualInputs] = useState({
    motorYield: 2.5,
    buildRate: 2.5,
    turnRate: 1.8,
    slideDistance: 30,
    bitToBendDistance: 5,
    bendAngle: 2.0,
  });

  // Track recent surveys for moving average calculations
  const [recentSurveys, setRecentSurveys] = useState<any[]>([]);

  // Custom debounce hook implementation
  function useCustomDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Cleanup on unmount or when dependencies change
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [value, delay]);

    return debouncedValue;
  }

  // Debounced rotation state to prevent rapid toggling
  const [rawIsRotating, setRawIsRotating] = useState(false);
  const debouncedIsRotating = useCustomDebounce<boolean>(
    rawIsRotating,
    mergedConfig.debounceMs || 500,
  );

  // Update recent surveys when surveys change
  useEffect(() => {
    if (surveys && surveys.length > 0) {
      // Sort surveys by timestamp (newest first)
      const sortedSurveys = [...surveys].sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime(),
      );

      // Take the most recent surveys for moving average
      setRecentSurveys(
        sortedSurveys.slice(0, mergedConfig.movingAverageCount || 3),
      );
    }
  }, [surveys, mergedConfig.movingAverageCount]);

  // Calculate moving averages for build and turn rates
  const calculateMovingAverages = () => {
    if (recentSurveys.length < 2) return { buildRate: 2.5, turnRate: 1.8 };

    let totalBuildRate = 0;
    let totalTurnRate = 0;
    let validPairs = 0;

    // Calculate rates between consecutive surveys
    for (let i = 0; i < recentSurveys.length - 1; i++) {
      const current = recentSurveys[i];
      const previous = recentSurveys[i + 1];

      // Validate data
      if (
        typeof current.inclination === "number" &&
        typeof previous.inclination === "number" &&
        typeof current.azimuth === "number" &&
        typeof previous.azimuth === "number" &&
        typeof current.measuredDepth === "number" &&
        typeof previous.measuredDepth === "number"
      ) {
        const mdDiff = Math.abs(current.measuredDepth - previous.measuredDepth);

        // Only use pairs with sufficient distance between them
        if (mdDiff >= (mergedConfig.minDistanceThreshold || 1.0)) {
          // Calculate build rate
          const incChange = current.inclination - previous.inclination;
          const buildRate = (incChange / mdDiff) * 100;

          // Calculate turn rate with azimuth normalization
          let aziChange = current.azimuth - previous.azimuth;
          if (Math.abs(aziChange) > 180) {
            aziChange = aziChange > 0 ? aziChange - 360 : aziChange + 360;
          }
          const turnRate = (aziChange / mdDiff) * 100;

          totalBuildRate += buildRate;
          totalTurnRate += turnRate;
          validPairs++;
        }
      }
    }

    // Return averages or defaults if no valid pairs
    return {
      buildRate: validPairs > 0 ? totalBuildRate / validPairs : 2.5,
      turnRate: validPairs > 0 ? totalTurnRate / validPairs : 1.8,
    };
  };

  // Update curve data when WITS data, surveys, or debounced rotation state changes
  useEffect(() => {
    const calculateCurveData = async () => {
      try {
        // Get current inclination and azimuth from survey or WITS data with validation
        const latestSurvey = recentSurveys[0] || {};

        const currentInc =
          typeof latestSurvey?.inclination === "number" &&
          !isNaN(latestSurvey.inclination) &&
          isFinite(latestSurvey.inclination)
            ? latestSurvey.inclination
            : typeof witsData?.inclination === "number" &&
                !isNaN(witsData.inclination) &&
                isFinite(witsData.inclination)
              ? witsData.inclination
              : 0;

        const currentAz =
          typeof latestSurvey?.azimuth === "number" &&
          !isNaN(latestSurvey.azimuth) &&
          isFinite(latestSurvey.azimuth)
            ? latestSurvey.azimuth
            : typeof witsData?.azimuth === "number" &&
                !isNaN(witsData.azimuth) &&
                isFinite(witsData.azimuth)
              ? witsData.azimuth
              : 0;

        // Determine if the tool is rotating based on rotary RPM
        const rotationThreshold = mergedConfig.rotationRpmThreshold || 5; // RPM threshold
        const isRotating =
          typeof witsData?.rotaryRpm === "number"
            ? witsData.rotaryRpm > rotationThreshold
            : false;

        // Update raw rotation state (will be debounced)
        setRawIsRotating(isRotating);

        // Calculate moving averages for build and turn rates
        const { buildRate, turnRate } = calculateMovingAverages();

        // Import dynamically to avoid circular dependencies
        const {
          calculateMotorYield,
          calculateDoglegNeeded,
          calculateSlideSeen,
          calculateSlideAhead,
          calculateProjectedInclination,
          calculateProjectedAzimuth,
        } = await import("@/utils/directionalCalculations");

        // Use manual inputs or calculated values
        const slideDistance = manualInputs.slideDistance;
        const bendAngle = manualInputs.bendAngle;
        const bitToBendDistance = manualInputs.bitToBendDistance;
        const targetDistance = curveData.targetDistance;
        const targetInc = curveData.targetInc;
        const targetAz = curveData.targetAz;

        // Calculate motor yield using the most appropriate method
        let motorYield = manualInputs.motorYield;

        // Try to calculate from survey data if we have two recent surveys
        if (recentSurveys.length >= 2) {
          const current = recentSurveys[0];
          const previous = recentSurveys[1];

          // Check if we have valid inclination and depth data
          if (
            typeof current.inclination === "number" &&
            typeof previous.inclination === "number" &&
            typeof current.measuredDepth === "number" &&
            typeof previous.measuredDepth === "number"
          ) {
            const mdDiff = Math.abs(
              current.measuredDepth - previous.measuredDepth,
            );

            // Only calculate if distance is above threshold
            if (mdDiff >= (mergedConfig.minDistanceThreshold || 1.0)) {
              const calculatedMotorYield = calculateMotorYield(
                current.inclination,
                previous.inclination,
                mdDiff,
              );

              // Use calculated value if it's valid
              if (
                typeof calculatedMotorYield === "number" &&
                !isNaN(calculatedMotorYield) &&
                isFinite(calculatedMotorYield) &&
                calculatedMotorYield > 0
              ) {
                motorYield = calculatedMotorYield;
              }
            }
          }
        }

        // If we couldn't calculate from survey data, try legacy calculation
        if (motorYield === manualInputs.motorYield) {
          const legacyMotorYield = calculateMotorYield(
            undefined,
            undefined,
            undefined,
            slideDistance,
            bendAngle,
            bitToBendDistance,
          );

          // Use legacy value if it's valid
          if (
            typeof legacyMotorYield === "number" &&
            !isNaN(legacyMotorYield) &&
            isFinite(legacyMotorYield) &&
            legacyMotorYield > 0
          ) {
            motorYield = legacyMotorYield;
          }
        }

        // Calculate slide seen
        const slideSeen = calculateSlideSeen(
          motorYield,
          slideDistance,
          debouncedIsRotating, // Use debounced rotation state
        );

        // Calculate slide ahead
        const slideAhead = calculateSlideAhead(
          motorYield,
          slideDistance,
          bitToBendDistance,
          debouncedIsRotating, // Use debounced rotation state
        );

        // Calculate projected inclination
        const projectedInc = calculateProjectedInclination(
          currentInc,
          buildRate,
          targetDistance,
        );

        // Calculate projected azimuth
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

        // Update the calculated curve data
        setCurveData({
          motorYield,
          doglegNeeded,
          slideSeen,
          slideAhead,
          projectedInc,
          projectedAz,
          isRotating: debouncedIsRotating,
          buildRate,
          turnRate,
          slideDistance,
          bitToBendDistance,
          bendAngle,
          targetDistance,
          targetInc,
          targetAz,
        });
      } catch (error) {
        console.error("Error calculating curve data:", error);
      }
    };

    calculateCurveData();
  }, [witsData, recentSurveys, debouncedIsRotating, manualInputs]);

  // Function to update manual inputs with validation
  const updateManualInput = (field: string, value: number) => {
    const constraints =
      mergedConfig.manualInputConstraints ||
      DEFAULT_CONFIG.manualInputConstraints;
    const fieldConstraints = constraints?.[field as keyof typeof constraints];

    if (fieldConstraints) {
      // Validate and constrain the value
      const numValue = Number(value);
      if (!isNaN(numValue) && isFinite(numValue)) {
        const constrainedValue = Math.max(
          fieldConstraints.min,
          Math.min(fieldConstraints.max, numValue),
        );

        setManualInputs((prev) => ({
          ...prev,
          [field]: constrainedValue,
        }));
      }
    } else {
      // If no constraints defined, just update the value
      setManualInputs((prev) => ({
        ...prev,
        [field]: Number(value),
      }));
    }
  };

  return {
    curveData,
    manualInputs,
    updateManualInput,
    isRotating: debouncedIsRotating,
  };
}
