// This file re-exports the useCurveData hook from the context
// to ensure consistent imports across the application
import { useContext } from "react";
import { useCurveData as originalUseCurveData } from "@/context/CurveDataContext";

export function useCurveData() {
  try {
    return originalUseCurveData();
  } catch (error) {
    console.error("Error using CurveData context:", error);
    // Return a default context with empty values to prevent crashes
    return {
      curveData: {
        motorYield: 0,
        doglegNeeded: 0,
        slideSeen: 0,
        slideAhead: 0,
        projectedInc: 0,
        projectedAz: 0,
        isRotating: false,
        buildRate: 0,
        turnRate: 0,
        slideDistance: 0,
        bitToBendDistance: 0,
        bendAngle: 0,
        targetDistance: 0,
        targetInc: 0,
        targetAz: 0,
      },
      manualInputs: {
        motorYield: null,
        doglegNeeded: null,
        slideSeen: null,
        slideAhead: null,
        projectedInc: null,
        projectedAz: null,
        buildRate: 0,
        turnRate: 0,
        slideDistance: 0,
        bitToBendDistance: 0,
        bendAngle: 0,
      },
      updateManualInput: () => {},
      isRotating: false,
      config: {},
      updateConfig: () => {},
      latestSurveyData: null,
    };
  }
}
