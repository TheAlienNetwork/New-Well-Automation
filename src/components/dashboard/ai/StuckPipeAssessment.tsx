import React from "react";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Zap } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

interface StuckPipeAssessmentProps {
  predictions: {
    stuckPipe: {
      risk: number;
      indicators: { name: string; value: number }[];
    };
  };
  getRiskColor: (risk: number) => string;
  getRiskBgColor: (risk: number) => string;
}

const StuckPipeAssessment: React.FC<StuckPipeAssessmentProps> = ({
  predictions,
  getRiskColor,
  getRiskBgColor,
}) => {
  return (
    <div className="flex-grow p-4 space-y-4 overflow-auto bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-300">Stuck Pipe Risk</h3>
          <p className="text-sm text-gray-500">Current conditions assessment</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl font-bold ${getRiskColor(predictions.stuckPipe.risk)}`}
          >
            {predictions.stuckPipe.risk}%
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
                  predictions.stuckPipe.risk < 20
                    ? "#10b981"
                    : predictions.stuckPipe.risk < 50
                      ? "#f59e0b"
                      : "#ef4444"
                }
                strokeWidth="3"
                strokeDasharray={`${predictions.stuckPipe.risk}, 100`}
                style={{
                  filter: `drop-shadow(0 0 4px ${predictions.stuckPipe.risk < 20 ? "#10b98180" : predictions.stuckPipe.risk < 50 ? "#f59e0b80" : "#ef444480"})`,
                }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-400">Risk Indicators</h4>
        {predictions.stuckPipe.indicators.map((indicator, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">{indicator.name}</span>
              <span
                className={`text-sm font-medium ${getRiskColor(indicator.value)}`}
              >
                {indicator.value}%
              </span>
            </div>
            <Progress
              value={indicator.value}
              max={100}
              className="h-2 bg-gray-800"
              indicatorClassName={`${getRiskBgColor(indicator.value)}`}
            />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Recommended Actions
        </h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            {predictions.stuckPipe.risk < 20 ? (
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            )}
            <span className="text-sm text-gray-300">
              {predictions.stuckPipe.risk < 20
                ? "Maintain current drilling parameters"
                : "Consider adjusting drilling parameters to reduce risk"}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
            <span className="text-sm text-gray-300">
              {predictions.stuckPipe.indicators[0].value > 30
                ? "Monitor torque variations during next 30 minutes"
                : "Torque variations within normal range"}
            </span>
          </li>
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Torque Variation Trend
        </h4>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                {
                  time: "00:00",
                  value: Math.max(
                    5,
                    predictions.stuckPipe.indicators[0].value * 0.8,
                  ),
                },
                {
                  time: "01:00",
                  value: Math.max(
                    5,
                    predictions.stuckPipe.indicators[0].value * 0.9,
                  ),
                },
                {
                  time: "02:00",
                  value: Math.max(
                    5,
                    predictions.stuckPipe.indicators[0].value * 0.7,
                  ),
                },
                {
                  time: "03:00",
                  value: Math.max(
                    5,
                    predictions.stuckPipe.indicators[0].value * 1.1,
                  ),
                },
                {
                  time: "04:00",
                  value: Math.max(
                    5,
                    predictions.stuckPipe.indicators[0].value * 0.9,
                  ),
                },
                {
                  time: "05:00",
                  value: Math.max(
                    5,
                    predictions.stuckPipe.indicators[0].value * 0.8,
                  ),
                },
              ]}
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0ea5e9"
                fill="#0ea5e950"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StuckPipeAssessment;
