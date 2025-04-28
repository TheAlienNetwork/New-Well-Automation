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
  const { isConnected, isReceiving, witsData } = useWits();

  // Use WITS data status if prop not provided
  const isRealtime =
    propIsRealtime !== undefined ? propIsRealtime : isReceiving;

  // Initialize with empty data
  const [plotData, setPlotData] = useState<
    Array<{ tvd: number; gamma: number }>
  >(propData || []);

  // Update based on real WITS data only
  useEffect(() => {
    if (
      isRealtime &&
      isConnected &&
      isReceiving &&
      witsData.gamma &&
      witsData.tvd
    ) {
      // Create a new data point from actual WITS data
      const newDataPoint = {
        tvd: witsData.tvd,
        gamma: witsData.gamma,
      };

      // Add the new data point to the plot data (limit to 100 points)
      setPlotData((prevData) => {
        // Check if this is a new data point (avoid duplicates)
        const isDuplicate = prevData.some(
          (point) =>
            point.tvd === newDataPoint.tvd &&
            point.gamma === newDataPoint.gamma,
        );

        if (!isDuplicate) {
          return [newDataPoint, ...prevData.slice(0, 99)];
        }
        return prevData;
      });
    }
  }, [isRealtime, isConnected, isReceiving, witsData.gamma, witsData.tvd]);

  // Handle refresh button click
  const handleRefresh = () => {
    // Clear the plot data if not connected
    if (!isConnected || !isReceiving) {
      setPlotData([]);
    }
    onRefresh();
  };

  return (
    <Card
      className={`w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden ${className}`}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Gamma Ray Log
          </CardTitle>
          {isRealtime && isConnected && isReceiving && (
            <Badge
              variant="outline"
              className="bg-green-900/30 text-green-400 border-green-800 animate-pulse"
            >
              LIVE
            </Badge>
          )}
          {(!isConnected || !isReceiving) && (
            <Badge
              variant="outline"
              className="bg-red-900/30 text-red-400 border-red-800"
            >
              DISCONNECTED
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
            onClick={handleRefresh}
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
      <CardContent className="p-0 pt-2 h-[800px]">
        <div className="h-full w-full">
          {plotData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={900}
              className="h-[700px]"
            >
              <ScatterChart
                margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
                layout="vertical"
                className="h-[700px]"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <YAxis
                  type="number"
                  dataKey="tvd"
                  name="Depth"
                  unit="ft"
                  domain={["dataMin", "dataMax"]}
                  reversed={true}
                  label={{
                    value: "Depth (ft)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fill: "#9ca3af",
                  }}
                  stroke="#6b7280"
                  tickCount={10}
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
                    offset: 0,
                    fill: "#9ca3af",
                  }}
                  stroke="#6b7280"
                  tickCount={6}
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
          ) : (
            <div className="flex items-center justify-center h-full w-full text-gray-400">
              {isConnected && isReceiving
                ? "Waiting for gamma data..."
                : "No data available - WITS connection required"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GammaPlot;
