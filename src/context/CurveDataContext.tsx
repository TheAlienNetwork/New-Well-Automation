import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useSurveys } from "./SurveyContext";
import { useWits } from "./WitsContext";
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

export interface CurveData {
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

interface CurveDataContextType {
  curveData: CurveData;
  manualInputs: {
    motorYield: number | null;
    doglegNeeded: number | null;
    slideSeen: number | null;
    slideAhead: number | null;
    projectedInc: number | null;
    projectedAz: number | null;
    buildRate: number;
    turnRate: number;
    slideDistance: number;
    bitToBendDistance: number;
    bendAngle: number;
  };
  updateManualInput: (field: string, value: number | null) => void;
  isRotating: boolean;
  config: CurveDataConfig;
  updateConfig: (newConfig: Partial<CurveDataConfig>) => void;
  latestSurveyData: any;
}

const DEFAULT_CONFIG: CurveDataConfig = {
  minDistanceThreshold: 1.0,
  rotationRpmThreshold: 5.0,
  debounceMs: 500,
  movingAverageCount: 3,
  manualInputConstraints: {
    motorYield: { min: 0.1, max: 10.0 },
    buildRate: { min: 0.1, max: 10.0 },
    turnRate: { min: 0.1, max: 10.0 },
    slideDistance: { min: 1.0, max: 100.0 },
    bitToBendDistance: { min: 0.1, max: 20.0 },
    bendAngle: { min: 0.1, max: 5.0 },
  },
};

export const CurveDataContext = createContext<CurveDataContextType | undefined>(
  undefined,
);

export function CurveDataProvider({ children }: { children: ReactNode }) {
  const { surveys } = useSurveys();
  const witsContext = useWits();
  const witsData = witsContext?.witsData || {};
  const [config, setConfig] = useState<CurveDataConfig>(DEFAULT_CONFIG);
  const [latestSurveyData, setLatestSurveyData] = useState<any>(null);

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
    motorYield: null as number | null,
    doglegNeeded: null as number | null,
    slideSeen: null as number | null,
    slideAhead: null as number | null,
    projectedInc: null as number | null,
    projectedAz: null as number | null,
    buildRate: 2.5,
    turnRate: 1.8,
    slideDistance: 30,
    bitToBendDistance: 5,
    bendAngle: 2.0,
  });

  // Track recent surveys for moving average calculations
  const [recentSurveys, setRecentSurveys] = useState<any[]>([]);

  // Debounced rotation state to prevent rapid toggling
  const [rawIsRotating, setRawIsRotating] = useState(false);
  const [debouncedIsRotating, setDebouncedIsRotating] = useState(false);

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
          console.log("CurveDataContext: New latest survey detected", {
            id: latestSurvey.id,
            timestamp: latestSurvey.timestamp,
            inclination: latestSurvey.inclination,
            azimuth: latestSurvey.azimuth,
          });

          setLatestSurveyData(latestSurvey);

          // Take the most recent surveys for moving average
          setRecentSurveys(
            sortedSurveys.slice(0, config.movingAverageCount || 3),
          );
        } else {
          console.warn(
            "CurveDataContext: No valid survey found in sorted surveys",
          );
          setLatestSurveyData(null);
        }
      } else {
        console.log(
          "CurveDataContext: No surveys available or surveys is not an array",
        );
        setLatestSurveyData(null);
      }
    } catch (error) {
      console.error(
        "Error updating latest survey data in CurveDataContext:",
        error,
      );
      setLatestSurveyData(null);
    }
  }, [surveys, config.movingAverageCount]);

  // Debounce the rotation state
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIsRotating(rawIsRotating);
    }, config.debounceMs || 500);

    return () => clearTimeout(timer);
  }, [rawIsRotating, config.debounceMs]);

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
        if (mdDiff >= (config.minDistanceThreshold || 1.0)) {
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
    // Skip effect if witsContext is not available
    if (!witsContext) return;
    const calculateCurveData = async () => {
      try {
        // Get current inclination and azimuth from survey or WITS data with validation
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

        // Determine if the tool is rotating based on rotary RPM
        const rotationThreshold = config.rotationRpmThreshold || 5; // RPM threshold
        const isRotating =
          typeof witsData?.rotaryRpm === "number"
            ? witsData.rotaryRpm > rotationThreshold
            : false;

        // Update raw rotation state (will be debounced)
        setRawIsRotating(isRotating);

        // Calculate moving averages for build and turn rates
        const { buildRate, turnRate } = calculateMovingAverages();

        // Use manual inputs or calculated values
        const slideDistance = manualInputs.slideDistance;
        const bendAngle = manualInputs.bendAngle;
        const bitToBendDistance = manualInputs.bitToBendDistance;
        const targetDistance = curveData.targetDistance;
        const targetInc = curveData.targetInc;
        const targetAz = curveData.targetAz;

        // Calculate motor yield using the most appropriate method
        let motorYield =
          manualInputs.motorYield !== null ? manualInputs.motorYield : 2.5;

        // Try to calculate from survey data if we have two recent surveys
        if (recentSurveys.length >= 2 && manualInputs.motorYield === null) {
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
            if (mdDiff >= (config.minDistanceThreshold || 1.0)) {
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

        // If we couldn't calculate from survey data and no manual input, try legacy calculation
        if (manualInputs.motorYield === null && motorYield === 2.5) {
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

        // Calculate dogleg needed or use manual value
        const doglegNeeded =
          manualInputs.doglegNeeded !== null
            ? manualInputs.doglegNeeded
            : calculateDoglegNeeded(
                currentInc,
                currentAz,
                targetInc,
                targetAz,
                targetDistance,
              );

        // Calculate slide seen or use manual value
        const slideSeen =
          manualInputs.slideSeen !== null
            ? manualInputs.slideSeen
            : calculateSlideSeen(
                motorYield,
                slideDistance,
                debouncedIsRotating, // Use debounced rotation state
              );

        // Calculate slide ahead or use manual value
        const slideAhead =
          manualInputs.slideAhead !== null
            ? manualInputs.slideAhead
            : calculateSlideAhead(
                motorYield,
                slideDistance,
                bitToBendDistance,
                debouncedIsRotating, // Use debounced rotation state
              );

        // Calculate projected inclination or use manual value
        const projectedInc =
          manualInputs.projectedInc !== null
            ? manualInputs.projectedInc
            : calculateProjectedInclination(
                currentInc,
                buildRate,
                targetDistance,
              );

        // Calculate projected azimuth or use manual value
        const projectedAz =
          manualInputs.projectedAz !== null
            ? manualInputs.projectedAz
            : calculateProjectedAzimuth(currentAz, turnRate, targetDistance);

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
  }, [
    witsData,
    latestSurveyData,
    recentSurveys,
    debouncedIsRotating,
    manualInputs,
    config,
    curveData.targetDistance,
    curveData.targetInc,
    curveData.targetAz,
  ]);

  // Function to update manual inputs with validation
  const updateManualInput = (field: string, value: number | null) => {
    if (value === null) {
      setManualInputs((prev) => ({
        ...prev,
        [field]: null,
      }));
      return;
    }

    const constraints =
      config.manualInputConstraints || DEFAULT_CONFIG.manualInputConstraints;
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

  // Function to update config
  const updateConfig = (newConfig: Partial<CurveDataConfig>) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }));
  };

  return (
    <CurveDataContext.Provider
      value={{
        curveData,
        manualInputs,
        updateManualInput,
        isRotating: debouncedIsRotating,
        config,
        updateConfig,
        latestSurveyData,
      }}
    >
      {children}
    </CurveDataContext.Provider>
  );
}

export function useCurveData() {
  const context = useContext(CurveDataContext);
  if (context === undefined) {
    throw new Error("useCurveData must be used within a CurveDataProvider");
  }
  return context;
}
