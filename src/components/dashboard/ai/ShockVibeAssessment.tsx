import React from "react";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface ShockVibeAssessmentProps {
  severity: number;
  axial: number;
  lateral: number;
  torsional: number;
  recommendations: string[];
  getRiskColor: (risk: number) => string;
  getRiskBgColor: (risk: number) => string;
  historicalData: any[];
}

const ShockVibeAssessment = ({
  severity,
  axial,
  lateral,
  torsional,
  recommendations,
  getRiskColor,
  getRiskBgColor,
  historicalData,
}: ShockVibeAssessmentProps) => {
  return (
    <div className="flex-grow p-4 space-y-4 overflow-auto bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-300">
            Shock & Vibration Analysis
          </h3>
          <p className="text-sm text-gray-500">
            Real-time vibration monitoring and analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getRiskColor(severity)}`}>
            {severity}%
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
                  severity < 20
                    ? "#10b981"
                    : severity < 50
                      ? "#f59e0b"
                      : "#ef4444"
                }
                strokeWidth="3"
                strokeDasharray={`${severity}, 100`}
                style={{
                  filter: `drop-shadow(0 0 4px ${severity < 20 ? "#10b98180" : severity < 50 ? "#f59e0b80" : "#ef444480"})`,
                }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-400">
          Vibration Components
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Axial</span>
              <span className={`text-sm font-medium ${getRiskColor(axial)}`}>
                {axial}%
              </span>
            </div>
            <Progress
              value={axial}
              max={100}
              className="h-2 bg-gray-800"
              indicatorClassName={`${getRiskBgColor(axial)}`}
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Lateral</span>
              <span className={`text-sm font-medium ${getRiskColor(lateral)}`}>
                {lateral}%
              </span>
            </div>
            <Progress
              value={lateral}
              max={100}
              className="h-2 bg-gray-800"
              indicatorClassName={`${getRiskBgColor(lateral)}`}
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Torsional</span>
              <span
                className={`text-sm font-medium ${getRiskColor(torsional)}`}
              >
                {torsional}%
              </span>
            </div>
            <Progress
              value={torsional}
              max={100}
              className="h-2 bg-gray-800"
              indicatorClassName={`${getRiskBgColor(torsional)}`}
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Recommended Actions
        </h4>
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
          Vibration Trend
        </h4>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historicalData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  color: "#e2e8f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ShockVibeAssessment;
