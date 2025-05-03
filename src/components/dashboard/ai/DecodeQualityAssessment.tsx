import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Zap, Filter } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface DecodeQualityAssessmentProps {
  quality: number;
  noiseLevel: number;
  recommendations: string[];
  filterStrength: number;
  setFilterStrength: (value: number) => void;
  getQualityColor: (quality: number) => string;
}

const DecodeQualityAssessment = ({
  quality,
  noiseLevel,
  recommendations,
  filterStrength,
  setFilterStrength,
  getQualityColor,
}: DecodeQualityAssessmentProps) => {
  // Generate signal quality trend data
  const generateSignalQualityTrendData = () => {
    return [
      {
        time: "00:00",
        quality: Math.max(50, quality * 0.9),
      },
      {
        time: "01:00",
        quality: Math.max(50, quality * 0.95),
      },
      {
        time: "02:00",
        quality: Math.max(50, quality * 0.85),
      },
      {
        time: "03:00",
        quality: Math.max(50, quality * 0.8),
      },
      {
        time: "04:00",
        quality: Math.max(50, quality),
      },
    ];
  };

  return (
    <div className="flex-grow p-4 space-y-4 overflow-auto bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-300">Signal Quality</h3>
          <p className="text-sm text-gray-500">Current decode performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getQualityColor(quality)}`}>
            {quality}%
          </span>
          <div className="w-16 h-16 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#1e293b"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={
                  quality > 80
                    ? "#10b981"
                    : quality > 50
                      ? "#f59e0b"
                      : "#ef4444"
                }
                strokeWidth="3"
                strokeDasharray={`${quality}, 100`}
                style={{
                  filter: `drop-shadow(0 0 4px ${quality > 80 ? "#10b98180" : quality > 50 ? "#f59e0b80" : "#ef444480"})`,
                }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-400">Noise Level</h4>
          <span className="text-sm text-gray-300">{noiseLevel}%</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Filter Strength</span>
            <span className="text-xs text-gray-500">{filterStrength}%</span>
          </div>
          <Slider
            value={[filterStrength]}
            onValueChange={(values) => setFilterStrength(values[0])}
            max={100}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Minimal</span>
            <span>Aggressive</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-400">Recommendations</h4>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300"
          >
            <Filter className="h-3 w-3 mr-1" />
            Apply Filters
          </Button>
        </div>
        <ul className="space-y-2">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
              <span className="text-sm text-gray-300">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Signal Quality Trend
        </h4>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={generateSignalQualityTrendData()}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[50, 100]} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  color: "#e2e8f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="quality"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DecodeQualityAssessment;
