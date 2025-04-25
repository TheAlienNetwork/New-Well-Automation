import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Download, RefreshCw } from "lucide-react";
import { useWits } from "@/context/WitsContext";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface GammaPlotProps {
  data?: Array<{ tvd: number; gamma: number }>;
  isRealtime?: boolean;
  onRefresh?: () => void;
}

const GammaPlot = ({
  data: propData,
  isRealtime: propIsRealtime,
  onRefresh = () => {},
  className = "",
}: GammaPlotProps & { className?: string }) => {
  const { isReceiving, witsData } = useWits();

  // Use WITS data status if prop not provided
  const isRealtime =
    propIsRealtime !== undefined ? propIsRealtime : isReceiving;
  // Generate dummy data for visualization
  function generateDummyData() {
    const dummyData = [];
    let gamma = 50;

    for (let tvd = 8500; tvd >= 5000; tvd -= 20) {
      // Create different formations with different gamma characteristics
      if (tvd > 8000) {
        // Shale formation (high gamma)
        gamma = 80 + Math.random() * 40;
      } else if (tvd > 7500) {
        // Sandstone (low gamma)
        gamma = 20 + Math.random() * 15;
      } else if (tvd > 7000) {
        // Limestone (medium gamma)
        gamma = 40 + Math.random() * 20;
      } else if (tvd > 6500) {
        // Shale again
        gamma = 90 + Math.random() * 30;
      } else if (tvd > 6000) {
        // Sandstone again
        gamma = 15 + Math.random() * 10;
      } else {
        // Mixed formation
        gamma = 50 + Math.random() * 25;
      }

      dummyData.push({
        tvd,
        gamma,
      });
    }

    return dummyData;
  }

  // Generate initial data from WITS gamma if available
  const generateWitsBasedData = () => {
    const dummyData = [];
    let gamma = witsData.gamma;

    for (let tvd = 8500; tvd >= 5000; tvd -= 20) {
      // Create variations based on current gamma
      gamma = witsData.gamma + (Math.random() - 0.5) * 20;

      // Adjust based on depth to create formations
      if (tvd > 8000) {
        gamma = Math.max(70, gamma);
      } else if (tvd > 7500) {
        gamma = Math.min(30, gamma);
      } else if (tvd > 7000) {
        gamma = 40 + Math.random() * 20;
      } else if (tvd > 6500) {
        gamma = Math.max(80, gamma);
      } else if (tvd > 6000) {
        gamma = Math.min(25, gamma);
      } else {
        gamma = 50 + Math.random() * 25;
      }

      dummyData.push({
        tvd,
        gamma,
      });
    }

    return dummyData;
  };

  const [plotData, setPlotData] = useState(propData || generateWitsBasedData());
  // plotData is now initialized in the component declaration

  // Generate dummy data for visualization
  function generateDummyData() {
    const dummyData = [];
    let gamma = 50;

    for (let tvd = 8500; tvd >= 5000; tvd -= 20) {
      // Create different formations with different gamma characteristics
      if (tvd > 8000) {
        // Shale formation (high gamma)
        gamma = 80 + Math.random() * 40;
      } else if (tvd > 7500) {
        // Sandstone (low gamma)
        gamma = 20 + Math.random() * 15;
      } else if (tvd > 7000) {
        // Limestone (medium gamma)
        gamma = 40 + Math.random() * 20;
      } else if (tvd > 6500) {
        // Shale again
        gamma = 90 + Math.random() * 30;
      } else if (tvd > 6000) {
        // Sandstone again
        gamma = 15 + Math.random() * 10;
      } else {
        // Mixed formation
        gamma = 50 + Math.random() * 25;
      }

      dummyData.push({
        tvd,
        gamma,
      });
    }

    return dummyData;
  }

  // Update based on WITS data
  useEffect(() => {
    if (isRealtime) {
      // Update when WITS data changes
      const lastPoint = plotData[0];
      if (lastPoint && witsData.gamma) {
        const newTvd = lastPoint.tvd - 20;
        let newGamma = witsData.gamma + (Math.random() - 0.5) * 10;

        // Adjust based on depth to create formations
        if (newTvd > 8000) {
          newGamma = Math.max(70, newGamma);
        } else if (newTvd > 7500) {
          newGamma = Math.min(30, newGamma);
        } else if (newTvd > 7000) {
          newGamma = 40 + Math.random() * 20;
        } else if (newTvd > 6500) {
          newGamma = Math.max(80, newGamma);
        } else if (newTvd > 6000) {
          newGamma = Math.min(25, newGamma);
        } else {
          newGamma = 50 + Math.random() * 25;
        }

        // Only update occasionally to avoid too frequent updates
        if (Math.random() < 0.3) {
          setPlotData([
            { tvd: newTvd, gamma: newGamma },
            ...plotData.slice(0, 99),
          ]);
        }
      }

      // Also set up an interval for regular updates
      const interval = setInterval(() => {
        const lastPoint = plotData[0];
        if (lastPoint) {
          const newTvd = lastPoint.tvd - 20;
          let newGamma = witsData.gamma + (Math.random() - 0.5) * 15;

          // Adjust based on depth to create formations
          if (newTvd > 8000) {
            newGamma = Math.max(70, newGamma);
          } else if (newTvd > 7500) {
            newGamma = Math.min(30, newGamma);
          } else if (newTvd > 7000) {
            newGamma = 40 + Math.random() * 20;
          } else if (newTvd > 6500) {
            newGamma = Math.max(80, newGamma);
          } else if (newTvd > 6000) {
            newGamma = Math.min(25, newGamma);
          } else {
            newGamma = 50 + Math.random() * 25;
          }

          setPlotData([
            { tvd: newTvd, gamma: newGamma },
            ...plotData.slice(0, 99),
          ]);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isRealtime, plotData, witsData.gamma]);

  // Define formation boundaries for visualization
  const formationBoundaries = [
    { tvd: 8000, name: "Shale/Sandstone" },
    { tvd: 7500, name: "Sandstone/Limestone" },
    { tvd: 7000, name: "Limestone/Shale" },
    { tvd: 6500, name: "Shale/Sandstone" },
    { tvd: 6000, name: "Sandstone/Mixed" },
  ];

  return (
    <Card
      className={`w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden ${className}`}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Gamma Ray Log
          </CardTitle>
          {isRealtime && (
            <Badge
              variant="outline"
              className="bg-green-900/30 text-green-400 border-green-800 animate-pulse"
            >
              LIVE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
            onClick={onRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-2 h-[700px]">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height={400} className="h-[500px]">
            <ScatterChart
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              layout="vertical"
              className="h-[-500px-] h-[500px]"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <YAxis
                type="number"
                dataKey="tvd"
                name="TVD"
                unit="ft"
                domain={["dataMin", "dataMax"]}
                reversed={true}
                label={{
                  value: "TVD (ft)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#9ca3af",
                }}
                stroke="#6b7280"
              />
              <XAxis
                type="number"
                dataKey="gamma"
                name="Gamma"
                unit=" API"
                domain={[0, 150]}
                label={{
                  value: "Gamma (API)",
                  position: "insideBottom",
                  offset: -5,
                  fill: "#9ca3af",
                }}
                stroke="#6b7280"
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "#1f2937",
                  borderColor: "#374151",
                  color: "#e5e7eb",
                }}
                formatter={(value: number) => [value.toFixed(2), ""]}
                labelFormatter={(value) => `Gamma: ${value} API`}
              />

              {/* Formation boundaries */}
              {formationBoundaries.map((boundary, index) => (
                <ReferenceLine
                  key={index}
                  y={boundary.tvd}
                  stroke="#4b5563"
                  strokeDasharray="3 3"
                  label={{
                    value: boundary.name,
                    position: "right",
                    fill: "#9ca3af",
                    fontSize: 10,
                  }}
                />
              ))}

              <Scatter
                name="Gamma"
                data={plotData}
                fill="#00ffaa"
                line={{ stroke: "#00ffaa", strokeWidth: 1 }}
                lineType="joint"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GammaPlot;
