import { useMemo } from "react";

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface PredictionsData {
  toolFailure: {
    risk: number;
    timeToFailure?: string;
    components: { name: string; risk: number }[];
  };
  stuckPipe: {
    risk: number;
    indicators: { name: string; value: number }[];
  };
  shockAndVibe: {
    severity: number;
    axial: number;
    lateral: number;
    torsional: number;
    recommendations: string[];
  };
}

export function usePieChartData(predictions: PredictionsData) {
  const pieData = useMemo(() => {
    const generatePieData = (dataType: string): PieDataItem[] => {
      if (dataType === "failures") {
        return [
          {
            name: "Battery",
            value: predictions.toolFailure.components[0].risk,
            color: "#ef4444",
          },
          {
            name: "Pulser",
            value: predictions.toolFailure.components[1].risk,
            color: "#f59e0b",
          },
          {
            name: "Directional",
            value: predictions.toolFailure.components[2].risk,
            color: "#10b981",
          },
          {
            name: "Sensors",
            value: Math.max(5, predictions.toolFailure.risk / 10),
            color: "#0ea5e9",
          },
          {
            name: "Other",
            value: Math.max(5, predictions.toolFailure.risk / 5),
            color: "#8b5cf6",
          },
        ];
      } else if (dataType === "vibration") {
        return [
          {
            name: "Lateral",
            value: predictions.shockAndVibe.lateral,
            color: "#ef4444",
          },
          {
            name: "Axial",
            value: predictions.shockAndVibe.axial,
            color: "#f59e0b",
          },
          {
            name: "Torsional",
            value: predictions.shockAndVibe.torsional,
            color: "#10b981",
          },
          {
            name: "Other",
            value: Math.max(
              5,
              (predictions.shockAndVibe.lateral +
                predictions.shockAndVibe.axial) /
                10,
            ),
            color: "#8b5cf6",
          },
        ];
      }
      return [];
    };

    return {
      failures: generatePieData("failures"),
      vibration: generatePieData("vibration"),
    };
  }, [predictions]);

  return pieData;
}
