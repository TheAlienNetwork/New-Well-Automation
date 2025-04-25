import React from "react";
import { Database } from "lucide-react";

interface WellInfoProps {
  wellName: string;
}

const WellInfo = ({ wellName }: WellInfoProps) => {
  return (
    <div className="flex items-center gap-1">
      <Database className="h-3 w-3 text-blue-400" />
      <span className="text-gray-300">{wellName}</span>
    </div>
  );
};

export default WellInfo;
