import React from "react";

export interface ParameterCardProps {
  title: string;
  value: number;
  unit: string;
  color: string;
  isConnected?: boolean;
}

const ParameterCard = ({
  title,
  value,
  unit,
  color,
  isConnected = true,
}: ParameterCardProps) => {
  const getColorClass = () => {
    switch (color) {
      case "green":
        return "text-green-400";
      case "yellow":
        return "text-yellow-400";
      case "blue":
        return "text-blue-400";
      case "cyan":
        return "text-cyan-400";
      case "red":
        return "text-red-400";
      case "purple":
        return "text-purple-400";
      case "orange":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-md p-1 flex flex-col items-center">
      <div className="text-xs text-gray-400">{title}</div>
      <div
        className={`text-sm font-bold ${isConnected ? getColorClass() : "text-gray-500"}`}
      >
        {isConnected ? value.toFixed(2) : "--"}{" "}
        <span className="text-xs font-normal text-gray-500">{unit}</span>
      </div>
    </div>
  );
};

export default ParameterCard;
