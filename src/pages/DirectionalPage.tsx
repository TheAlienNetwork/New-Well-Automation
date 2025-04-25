import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import RosebudCompass from "@/components/dashboard/RosebudCompass";
import CurveDataWidget from "@/components/dashboard/CurveDataWidget";
import WellTrajectory3DInteractive from "@/components/dashboard/WellTrajectory3DInteractive";
import AIAnalytics from "@/components/dashboard/AIAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layers,
  Download,
  Settings,
  Compass,
  ArrowUp,
  Activity,
} from "lucide-react";

const DirectionalPage = () => {
  // Sample drilling data
  const drillingData = {
    toolFace: 45.2,
    inclination: 32.5,
    azimuth: 275.8,
    magneticField: 48.2,
    gravity: 0.98,
    depth: 8452.6,
  };

  // Generate dummy survey data for visualization
  const generateDummySurveys = (
    nsOffset = 0,
    ewOffset = 0,
    randomFactor = 10,
  ) => {
    const dummySurveys = [];
    let tvd = 0;
    let ns = nsOffset;
    let ew = ewOffset;
    let inc = 0;
    let az = 90;

    for (let md = 0; md <= 8500; md += 100) {
      // Gradually build angle for first 2000ft
      if (md < 2000) {
        inc = (md / 2000) * 30;
      }
      // Hold angle for next 3000ft
      else if (md < 5000) {
        inc = 30 + (Math.random() - 0.5) * 2;
      }
      // Build more angle and turn for production zone
      else {
        inc = Math.min(inc + (Math.random() - 0.3) * 0.5, 45);
        az = (az + (Math.random() - 0.4) * 1) % 360;
      }

      // Calculate position
      const radInc = (inc * Math.PI) / 180;
      const radAz = (az * Math.PI) / 180;

      if (md > 0) {
        const courseLength = 100; // Distance between surveys
        tvd += courseLength * Math.cos(radInc);
        const horizontalDistance = courseLength * Math.sin(radInc);
        ns +=
          horizontalDistance * Math.cos(radAz) +
          (Math.random() - 0.5) * randomFactor;
        ew +=
          horizontalDistance * Math.sin(radAz) +
          (Math.random() - 0.5) * randomFactor;
      }

      dummySurveys.push({
        md,
        inc,
        az,
        tvd,
        ns,
        ew,
      });
    }

    return dummySurveys;
  };

  const surveys = generateDummySurveys();
  const offsetWells = [
    {
      name: "Alpha-122",
      color: "#ff0088",
      surveys: generateDummySurveys(200, 50, 30),
    },
    {
      name: "Alpha-124",
      color: "#00ff88",
      surveys: generateDummySurveys(-150, -80, 20),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />
      <StatusBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Directional Drilling</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Rosebud Compass */}
            <div className="h-[400] h-[350] h-96">
              <RosebudCompass
                toolFace={drillingData.toolFace}
                inclination={drillingData.inclination}
                azimuth={drillingData.azimuth}
                magneticField={drillingData.magneticField}
                gravity={drillingData.gravity}
                depth={drillingData.depth}
                isActive={true}
              />
            </div>

            {/* Curve Data Widget */}
            <div className="h-[250px]">
              <CurveDataWidget
                motorYield={2.8}
                doglegNeeded={3.2}
                slideSeen={1.5}
                slideAhead={1.7}
                projectedInc={47.3}
                projectedAz={182.5}
                isRealtime={true}
              />
            </div>

            {/* Directional Metrics */}
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-blue-400" />
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Directional Metrics
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-md flex flex-col">
                    <span className="text-xs text-gray-500">Build Rate</span>
                    <span className="text-sm font-medium text-blue-400">
                      2.8°/100ft
                    </span>
                  </div>
                  <div className="p-2 bg-gray-800/50 rounded-md flex flex-col">
                    <span className="text-xs text-gray-500">Turn Rate</span>
                    <span className="text-sm font-medium text-purple-400">
                      1.5°/100ft
                    </span>
                  </div>
                  <div className="p-2 bg-gray-800/50 rounded-md flex flex-col">
                    <span className="text-xs text-gray-500">
                      Dogleg Severity
                    </span>
                    <span className="text-sm font-medium text-yellow-400">
                      3.2°/100ft
                    </span>
                  </div>
                  <div className="p-2 bg-gray-800/50 rounded-md flex flex-col">
                    <span className="text-xs text-gray-500">
                      Toolface Offset
                    </span>
                    <span className="text-sm font-medium text-green-400">
                      +1.2°
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slide Performance */}
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-cyan-400" />
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Slide Performance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Slide Grade</span>
                      <span className="text-green-400">A-</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-full"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>DLS Grade</span>
                      <span className="text-yellow-400">B+</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full"
                        style={{ width: "78%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Toolface Control</span>
                      <span className="text-blue-400">A</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-full"
                        style={{ width: "92%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Nudge Efficiency</span>
                      <span className="text-cyan-400">A+</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full"
                        style={{ width: "95%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nudge Projection */}
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Nudge Projection
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="p-2 bg-gray-800/50 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Current Inc/Az
                      </span>
                      <span className="text-sm font-medium text-gray-300">
                        {drillingData.inclination.toFixed(1)}° /{" "}
                        {drillingData.azimuth.toFixed(1)}°
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-gray-800/50 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Target Inc/Az
                      </span>
                      <span className="text-sm font-medium text-gray-300">
                        35.0° / 278.5°
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-purple-900/20 border border-purple-800 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">
                        Recommended Nudge
                      </span>
                      <span className="text-sm font-medium text-purple-400">
                        +2.5° / +2.7°
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Estimated 30 ft slide @ 45° toolface
                    </div>
                  </div>

                  <div className="p-2 bg-cyan-900/20 border border-cyan-800 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">
                        AI Recommendation
                      </span>
                      <span className="text-sm font-medium text-cyan-400">
                        Slide Now
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Optimal window for course correction
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - 3D Wellbore */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D Wellbore Visualization */}
            <div className="h-[800px]">
              <WellTrajectory3DInteractive
                surveys={surveys}
                offsetWells={offsetWells}
              />
            </div>

            {/* Directional Tabs */}
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    <CardTitle className="text-lg font-medium text-gray-200">
                      Directional Analysis
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 text-[#6e7075]">
                <Tabs defaultValue="surveys">
                  <TabsList className="w-full bg-gray-800/50 rounded-none border-b border-gray-800 p-0">
                    <TabsTrigger
                      value="surveys"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Survey Data
                    </TabsTrigger>
                    <TabsTrigger
                      value="analysis"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Inclination Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="ai"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      AI Insights
                    </TabsTrigger>
                    <TabsTrigger
                      value="gamma"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Gamma Analysis
                    </TabsTrigger>
                    <TabsTrigger
                      value="vibration"
                      className="flex-1 data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-3"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Vibration
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="surveys" className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-800/50 border-b border-gray-800">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              MD (ft)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Inc (°)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Az (°)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              TVD (ft)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              NS (ft)
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              EW (ft)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {surveys.slice(0, 10).map((survey, index) => (
                            <tr key={index} className="hover:bg-gray-800/30">
                              <td className="px-4 py-2 text-sm">
                                {survey.md.toFixed(1)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {survey.inc.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {survey.az.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {survey.tvd.toFixed(1)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {survey.ns.toFixed(1)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {survey.ew.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="analysis" className="p-4">
                    <div className="text-center p-8">
                      <p className="text-gray-400">
                        Inclination analysis visualization would be displayed
                        here
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="ai" className="p-0">
                    <div className="h-[300px]">
                      <AIAnalytics />
                    </div>
                  </TabsContent>

                  <TabsContent value="gamma" className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-300">
                          Gamma Ray Analysis
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-pink-900/30 text-pink-400 border-pink-800"
                        >
                          High Gamma Zone Detected
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Current Gamma
                          </div>
                          <div className="text-2xl font-bold text-pink-400">
                            87.5 API
                          </div>
                          <div className="text-xs text-gray-500">
                            Shale formation detected
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Formation Type
                          </div>
                          <div className="text-xl font-bold text-cyan-400">
                            Shale
                          </div>
                          <div className="text-xs text-gray-500">
                            High clay content
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Predicted Ahead
                          </div>
                          <div className="text-xl font-bold text-green-400">
                            Sandstone
                          </div>
                          <div className="text-xs text-gray-500">
                            Expected in ~50 ft
                          </div>
                        </div>
                      </div>

                      <div className="h-[200px] bg-gray-800/30 rounded-md border border-gray-800 flex items-center justify-center">
                        <p className="text-gray-400">
                          Gamma ray log visualization would display here
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="vibration" className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-300">
                          Vibration Analysis
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-yellow-900/30 text-yellow-400 border-yellow-800"
                        >
                          Moderate Vibration
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Lateral
                          </div>
                          <div className="text-2xl font-bold text-yellow-400">
                            42%
                          </div>
                          <div className="text-xs text-gray-500">
                            Above threshold (30%)
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Axial
                          </div>
                          <div className="text-xl font-bold text-green-400">
                            18%
                          </div>
                          <div className="text-xs text-gray-500">
                            Within normal range
                          </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                          <div className="text-sm text-gray-400 mb-1">
                            Torsional
                          </div>
                          <div className="text-xl font-bold text-green-400">
                            12%
                          </div>
                          <div className="text-xs text-gray-500">
                            Within normal range
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-md">
                        <div className="flex items-start gap-2">
                          <Activity className="h-4 w-4 text-yellow-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-yellow-400 mb-1">
                              Recommendation
                            </div>
                            <div className="text-sm text-gray-300">
                              Reduce WOB by 10% and monitor lateral vibration
                              response. Consider adding a shock sub if vibration
                              persists.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-[150px] bg-gray-800/30 rounded-md border border-gray-800 flex items-center justify-center">
                        <p className="text-gray-400">
                          Vibration trend visualization would display here
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectionalPage;
