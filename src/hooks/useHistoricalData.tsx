import { useWits } from "@/context/WitsContext";

type DataType = "vibration" | "temperature" | "battery";

interface HistoricalDataPoint {
  time: string;
  value: number;
  date?: string;
}

/**
 * Custom hook for generating historical data for visualizations based on real WITS data
 */
export const useHistoricalData = () => {
  const { witsData } = useWits();

  /**
   * Generate historical data for visualization based on real data
   * @param dataType - The type of data to generate (vibration, temperature, battery)
   * @returns Array of data points with time and value properties
   */
  const generateHistoricalData = (
    dataType: DataType,
  ): HistoricalDataPoint[] => {
    const data: HistoricalDataPoint[] = [];
    const now = new Date();

    if (!witsData) {
      return [];
    }

    // Create 24 data points for the last 24 hours
    for (let i = 0; i < 24; i++) {
      const timePoint = new Date(now.getTime() - (24 - i) * 60 * 60 * 1000);

      let value = 0;
      switch (dataType) {
        case "vibration":
          // Base value on current vibration with some historical variation
          value = witsData.vibration.lateral * (0.7 + Math.sin(i / 3) * 0.3);
          break;
        case "temperature":
          // Base value on current temperature with gradual increase
          value = witsData.temperature * (0.9 + (i / 24) * 0.2);
          break;
        case "battery":
          // Battery gradually decreases over time
          value = 90 - (i / 24) * 15 - Math.random() * 3;
          break;
        default:
          value = 50;
      }

      data.push({
        time: timePoint.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: value,
        date: timePoint.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
      });
    }

    return data;
  };

  return { generateHistoricalData };
};
