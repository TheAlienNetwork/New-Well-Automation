import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass, Ruler, ArrowUp, RotateCw, Zap } from "lucide-react";
import { useWits } from "@/context/WitsContext";

interface CurveDataWidgetProps {
  motorYield?: number;
  doglegNeeded?: number;
  slideSeen?: number;
  slideAhead?: number;
  projectedInc?: number;
  projectedAz?: number;
  isRealtime?: boolean;
}

const CurveDataWidget = ({
  motorYield: propMotorYield,
  doglegNeeded: propDoglegNeeded,
  slideSeen: propSlideSeen,
  slideAhead: propSlideAhead,
  projectedInc: propProjectedInc,
  projectedAz: propProjectedAz,
  isRealtime: propIsRealtime = true,
}: CurveDataWidgetProps) => {
  const { isReceiving, witsData } = useWits();

  // Use WITS data if available, otherwise use props
  const motorYield =
    propMotorYield !== undefined ? propMotorYield : witsData.motorYield;
  const doglegNeeded =
    propDoglegNeeded !== undefined ? propDoglegNeeded : witsData.doglegNeeded;
  const slideSeen =
    propSlideSeen !== undefined ? propSlideSeen : witsData.slideSeen;
  const slideAhead =
    propSlideAhead !== undefined ? propSlideAhead : witsData.slideAhead;
  const projectedInc =
    propProjectedInc !== undefined ? propProjectedInc : witsData.projectedInc;
  const projectedAz =
    propProjectedAz !== undefined ? propProjectedAz : witsData.projectedAz;
  const isRealtime =
    propIsRealtime !== undefined ? propIsRealtime : isReceiving;
  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            Curve Data
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
      </CardHeader>

      <CardContent className="p-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-cyan-900/30 flex items-center justify-center">
              <Zap className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Motor Yield</p>
              <p className="text-sm font-medium text-cyan-400">
                {motorYield.toFixed(2)}°/100ft
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
              <Ruler className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Dogleg Needed</p>
              <p className="text-sm font-medium text-yellow-400">
                {doglegNeeded.toFixed(2)}°/100ft
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-900/30 flex items-center justify-center">
              <RotateCw className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Slide Seen</p>
              <p className="text-sm font-medium text-green-400">
                {slideSeen.toFixed(2)}°
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
              <RotateCw className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Slide Ahead</p>
              <p className="text-sm font-medium text-blue-400">
                {slideAhead.toFixed(2)}°
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-900/30 flex items-center justify-center">
              <ArrowUp className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Proj. Inc</p>
              <p className="text-sm font-medium text-purple-400">
                {projectedInc.toFixed(2)}°
              </p>
            </div>
          </div>

          <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-900/30 flex items-center justify-center">
              <Compass className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Proj. Az</p>
              <p className="text-sm font-medium text-orange-400">
                {projectedAz.toFixed(2)}°
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurveDataWidget;
