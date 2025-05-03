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

interface ToolFailureAssessmentProps {
  predictions: {
    toolFailure: {
      risk: number;
      timeToFailure?: string;
      components: { name: string; risk: number }[];
    };
  };
  generateHistoricalData: (dataType: string) => any[];
  getRiskColor: (risk: number) => string;
  getRiskBgColor: (risk: number) => string;
}

const ToolFailureAssessment: React.FC<ToolFailureAssessmentProps> = ({
  predictions,
  generateHistoricalData,
  getRiskColor,
  getRiskBgColor,
}) => {
  return (
    <div className="flex-grow p-4 space-y-4 overflow-auto bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-300">
            Failure Risk Assessment
          </h3>
          <p className="text-sm text-gray-500">
            Predicted time to failure: {predictions.toolFailure.timeToFailure}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl font-bold ${getRiskColor(predictions.toolFailure.risk)}`}
          >
            {predictions.toolFailure.risk}%
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
                  predictions.toolFailure.risk < 20
                    ? "#10b981"
                    : predictions.toolFailure.risk < 50
                      ? "#f59e0b"
                      : "#ef4444"
                }
                strokeWidth="3"
                strokeDasharray={`${predictions.toolFailure.risk}, 100`}
                style={{
                  filter: `drop-shadow(0 0 4px ${predictions.toolFailure.risk < 20 ? "#10b98180" : predictions.toolFailure.risk < 50 ? "#f59e0b80" : "#ef444480"})`,
                }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-400">
          Component Risk Analysis
        </h4>
        {predictions.toolFailure.components.map((component, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">{component.name}</span>
              <span
                className={`text-sm font-medium ${getRiskColor(component.risk)}`}
              >
                {component.risk}%
              </span>
            </div>
            <Progress
              value={component.risk}
              max={100}
              className="h-2 bg-gray-800"
              indicatorClassName={`${getRiskBgColor(component.risk)}`}
            />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Preventive Actions
        </h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
            <span className="text-sm text-gray-300">
              {predictions.toolFailure.risk > 40
                ? "Schedule battery replacement within next 24 hours"
                : "Monitor battery voltage for any significant drops"}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-cyan-400 mt-0.5" />
            <span className="text-sm text-gray-300">
              {predictions.toolFailure.components[1].risk > 30
                ? "Inspect pulser assembly during next connection"
                : "Pulser assembly operating within normal parameters"}
            </span>
          </li>
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-800">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Battery Voltage Trend
        </h4>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={generateHistoricalData("battery")}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[60, 100]} />
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
                stroke="#f59e0b"
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

export default ToolFailureAssessment;
