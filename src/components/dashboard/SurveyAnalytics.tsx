import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { SurveyData } from "./SurveyPopup";
import { Brain, Download, BarChart3, TrendingUp } from "lucide-react";

interface SurveyAnalyticsProps {
  surveys: SurveyData[];
  onExport?: () => void;
}

const SurveyAnalytics = ({
  surveys = [],
  onExport = () => {},
}: SurveyAnalyticsProps) => {
  // Prepare data for charts
  const chartData = surveys
    .slice()
    .sort((a, b) => a.bitDepth - b.bitDepth)
    .map((survey) => ({
      depth: survey.bitDepth,
      inclination: survey.inclination,
      azimuth: survey.azimuth,
      toolFace: survey.toolFace,
      bTotal: survey.bTotal,
      aTotal: survey.aTotal,
      dip: survey.dip,
      toolTemp: survey.toolTemp,
      timestamp: new Date(survey.timestamp).getTime(),
    }));

  // Calculate statistics
  const avgInclination =
    surveys.reduce((sum, survey) => sum + survey.inclination, 0) /
    (surveys.length || 1);

  const avgAzimuth =
    surveys.reduce((sum, survey) => sum + survey.azimuth, 0) /
    (surveys.length || 1);

  const maxInclination = Math.max(
    ...surveys.map((survey) => survey.inclination),
    0,
  );

  const minInclination = Math.min(
    ...surveys.map((survey) => survey.inclination),
    90,
  );

  const inclinationChange = maxInclination - minInclination;

  const doglegSeverity = calculateDoglegSeverity(surveys);

  // Calculate doglegs between surveys
  function calculateDoglegSeverity(surveys: SurveyData[]): number {
    if (surveys.length < 2) return 0;

    let totalDogleg = 0;
    let totalLength = 0;

    for (let i = 1; i < surveys.length; i++) {
      const prev = surveys[i - 1];
      const curr = surveys[i];

      // Calculate course length
      const courseLength = Math.abs(curr.bitDepth - prev.bitDepth);

      // Skip if no significant course length
      if (courseLength < 1) continue;

      // Calculate dogleg angle (simplified)
      const incDiff = Math.abs(curr.inclination - prev.inclination);
      const aziDiff = Math.abs(curr.azimuth - prev.azimuth);

      // Simplified dogleg calculation
      const dogleg = Math.sqrt(
        incDiff * incDiff +
          aziDiff *
            aziDiff *
            Math.sin((prev.inclination * Math.PI) / 180) *
            Math.sin((curr.inclination * Math.PI) / 180),
      );

      // Dogleg severity in degrees per 100ft
      const dls = (dogleg / courseLength) * 100;

      totalDogleg += dls * courseLength;
      totalLength += courseLength;
    }

    return totalLength > 0 ? totalDogleg / totalLength : 0;
  }

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-lg font-medium text-gray-200">
              Survey Analytics
            </CardTitle>
            <Badge
              variant="outline"
              className="ml-2 bg-cyan-950/30 text-cyan-400 border-cyan-800"
            >
              AI POWERED
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            onClick={onExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Analysis
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-grow flex flex-col">
        <Tabs defaultValue="trends" className="flex-grow flex flex-col">
          <TabsList className="grid grid-cols-3 bg-gray-800/50 rounded-none border-b border-gray-800">
            <TabsTrigger
              value="trends"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-2"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Directional Trends
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-2"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger
              value="quality"
              className="data-[state=active]:bg-gray-900 data-[state=active]:text-cyan-400 py-2"
            >
              <Brain className="h-4 w-4 mr-2" />
              Quality Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="trends"
            className="flex-grow p-4 space-y-4 overflow-auto"
          >
            {surveys.length > 1 ? (
              <>
                <div className="h-[300px] w-full">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    Inclination vs. Depth
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="depth"
                        label={{
                          value: "Depth (ft)",
                          position: "insideBottomRight",
                          offset: -5,
                          fill: "#9ca3af",
                        }}
                        stroke="#6b7280"
                      />
                      <YAxis
                        label={{
                          value: "Inclination (°)",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#9ca3af",
                        }}
                        stroke="#6b7280"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          color: "#e5e7eb",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="inclination"
                        stroke="#00ffaa"
                        strokeWidth={2}
                        dot={{
                          stroke: "#00ffaa",
                          strokeWidth: 2,
                          r: 4,
                          fill: "#111827",
                        }}
                        activeDot={{ r: 6, fill: "#00ffaa" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[300px] w-full">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    Azimuth vs. Depth
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="depth"
                        label={{
                          value: "Depth (ft)",
                          position: "insideBottomRight",
                          offset: -5,
                          fill: "#9ca3af",
                        }}
                        stroke="#6b7280"
                      />
                      <YAxis
                        label={{
                          value: "Azimuth (°)",
                          angle: -90,
                          position: "insideLeft",
                          fill: "#9ca3af",
                        }}
                        stroke="#6b7280"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "#374151",
                          color: "#e5e7eb",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="azimuth"
                        stroke="#00aaff"
                        strokeWidth={2}
                        dot={{
                          stroke: "#00aaff",
                          strokeWidth: 2,
                          r: 4,
                          fill: "#111827",
                        }}
                        activeDot={{ r: 6, fill: "#00aaff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  Not enough survey data for analysis
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="statistics"
            className="flex-grow p-4 space-y-4 overflow-auto"
          >
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Directional Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        Average Inclination
                      </p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {avgInclination.toFixed(2)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Average Azimuth</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {avgAzimuth.toFixed(2)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Inclination Change
                      </p>
                      <p className="text-2xl font-bold text-green-400">
                        {inclinationChange.toFixed(2)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Dogleg Severity</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {doglegSeverity.toFixed(2)}°/100ft
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Survey Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Surveys</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {surveys.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Passed Surveys</p>
                      <p className="text-2xl font-bold text-green-400">
                        {
                          surveys.filter(
                            (s) => s.qualityCheck.status === "pass",
                          ).length
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {
                          surveys.filter(
                            (s) => s.qualityCheck.status === "warning",
                          ).length
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Failed Surveys</p>
                      <p className="text-2xl font-bold text-red-400">
                        {
                          surveys.filter(
                            (s) => s.qualityCheck.status === "fail",
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {surveys.length > 1 && (
              <div className="h-[300px] w-full mt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Magnetic Field & Gravity Readings
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="depth"
                      label={{
                        value: "Depth (ft)",
                        position: "insideBottomRight",
                        offset: -5,
                        fill: "#9ca3af",
                      }}
                      stroke="#6b7280"
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "#374151",
                        color: "#e5e7eb",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="bTotal"
                      stroke="#ff00aa"
                      fill="#ff00aa20"
                      strokeWidth={2}
                      name="B Total (μT)"
                    />
                    <Area
                      type="monotone"
                      dataKey="aTotal"
                      stroke="#00aaff"
                      fill="#00aaff20"
                      strokeWidth={2}
                      name="A Total (G)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="quality"
            className="flex-grow p-4 space-y-4 overflow-auto"
          >
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    AI Quality Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        Overall Quality Score
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-cyan-400">
                          {calculateQualityScore(surveys)}%
                        </p>
                        <Badge
                          variant="outline"
                          className="bg-cyan-900/30 text-cyan-400 border-cyan-800"
                        >
                          {getQualityRating(calculateQualityScore(surveys))}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Consistency Rating
                      </p>
                      <p className="text-lg font-bold text-green-400">
                        {calculateConsistencyRating(surveys)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Magnetic Interference
                      </p>
                      <p className="text-lg font-bold text-yellow-400">
                        {calculateMagneticInterference(surveys)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="h-[200px]">
                    <ul className="space-y-2">
                      {generateRecommendations(surveys).map((rec, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-300"
                        >
                          <span className="text-cyan-400 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {surveys.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Survey Quality Breakdown
                </h3>
                <div className="bg-gray-800 border border-gray-700 rounded-md p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Magnetic Field Consistency
                      </p>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{
                            width: `${calculateMagneticConsistency(surveys)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Gravity Field Consistency
                      </p>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{
                            width: `${calculateGravityConsistency(surveys)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Dip Angle Accuracy
                      </p>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: `${calculateDipAccuracy(surveys)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Helper functions for quality analysis
function calculateQualityScore(surveys: SurveyData[]): number {
  if (surveys.length === 0) return 0;

  const passCount = surveys.filter(
    (s) => s.qualityCheck.status === "pass",
  ).length;
  const warningCount = surveys.filter(
    (s) => s.qualityCheck.status === "warning",
  ).length;
  const failCount = surveys.filter(
    (s) => s.qualityCheck.status === "fail",
  ).length;

  return Math.round((passCount * 100 + warningCount * 50) / surveys.length);
}

function getQualityRating(score: number): string {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  if (score >= 50) return "FAIR";
  return "POOR";
}

function calculateConsistencyRating(surveys: SurveyData[]): string {
  if (surveys.length < 2) return "Insufficient Data";

  // Calculate consistency based on variations in magnetic and gravity readings
  const magneticVariation = calculateStandardDeviation(
    surveys.map((s) => s.bTotal),
  );

  const gravityVariation = calculateStandardDeviation(
    surveys.map((s) => s.aTotal),
  );

  const combinedVariation = (magneticVariation + gravityVariation) / 2;

  if (combinedVariation < 0.05) return "Excellent";
  if (combinedVariation < 0.1) return "Good";
  if (combinedVariation < 0.2) return "Fair";
  return "Poor";
}

function calculateMagneticInterference(surveys: SurveyData[]): string {
  if (surveys.length === 0) return "No Data";

  // Check for magnetic interference based on B Total variations
  const bTotalValues = surveys.map((s) => s.bTotal);
  const avgBTotal =
    bTotalValues.reduce((sum, val) => sum + val, 0) / bTotalValues.length;
  const maxDeviation = Math.max(
    ...bTotalValues.map((val) => Math.abs(val - avgBTotal)),
  );

  if (maxDeviation < 0.1) return "Minimal";
  if (maxDeviation < 0.3) return "Low";
  if (maxDeviation < 0.5) return "Moderate";
  return "High";
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;

  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff =
    squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

function calculateMagneticConsistency(surveys: SurveyData[]): number {
  if (surveys.length < 2) return 50;

  const bTotalValues = surveys.map((s) => s.bTotal);
  const stdDev = calculateStandardDeviation(bTotalValues);

  // Convert to a percentage (lower stdDev = higher consistency)
  return Math.max(0, Math.min(100, 100 - stdDev * 200));
}

function calculateGravityConsistency(surveys: SurveyData[]): number {
  if (surveys.length < 2) return 50;

  const aTotalValues = surveys.map((s) => s.aTotal);
  const stdDev = calculateStandardDeviation(aTotalValues);

  // Convert to a percentage (lower stdDev = higher consistency)
  return Math.max(0, Math.min(100, 100 - stdDev * 300));
}

function calculateDipAccuracy(surveys: SurveyData[]): number {
  if (surveys.length === 0) return 50;

  // Calculate theoretical dip angle based on latitude (simplified)
  const theoreticalDip = 60; // Example value, would be calculated based on location

  const dipErrors = surveys.map((s) => Math.abs(s.dip - theoreticalDip));
  const avgError =
    dipErrors.reduce((sum, val) => sum + val, 0) / dipErrors.length;

  // Convert to a percentage (lower error = higher accuracy)
  return Math.max(0, Math.min(100, 100 - avgError * 5));
}

function generateRecommendations(surveys: SurveyData[]): string[] {
  if (surveys.length === 0) return ["No survey data available for analysis"];

  const recommendations: string[] = [];

  // Check for quality issues
  const failedSurveys = surveys.filter((s) => s.qualityCheck.status === "fail");
  if (failedSurveys.length > 0) {
    recommendations.push(
      `Review ${failedSurveys.length} failed survey(s) and consider remeasuring at those depths`,
    );
  }

  // Check magnetic consistency
  const magneticConsistency = calculateMagneticConsistency(surveys);
  if (magneticConsistency < 70) {
    recommendations.push(
      "Magnetic field readings show inconsistency. Check for nearby magnetic interference sources",
    );
  }

  // Check gravity consistency
  const gravityConsistency = calculateGravityConsistency(surveys);
  if (gravityConsistency < 70) {
    recommendations.push(
      "Gravity sensor readings show inconsistency. Consider recalibrating the tool",
    );
  }

  // Check dip angle accuracy
  const dipAccuracy = calculateDipAccuracy(surveys);
  if (dipAccuracy < 70) {
    recommendations.push(
      "Dip angle measurements may be inaccurate. Verify magnetic declination settings",
    );
  }

  // Check survey spacing
  if (surveys.length >= 2) {
    const sortedSurveys = [...surveys].sort((a, b) => a.bitDepth - b.bitDepth);
    const maxSpacing = Math.max(
      ...sortedSurveys
        .slice(1)
        .map((s, i) => s.bitDepth - sortedSurveys[i].bitDepth),
    );

    if (maxSpacing > 100) {
      recommendations.push(
        `Survey spacing exceeds 100ft in some sections. Consider taking additional surveys for better wellbore positioning`,
      );
    }
  }

  // Check dogleg severity
  const doglegSeverity = calculateDoglegSeverity(surveys);
  if (doglegSeverity > 3) {
    recommendations.push(
      `Dogleg severity of ${doglegSeverity.toFixed(2)}°/100ft detected. Monitor for potential drilling issues`,
    );
  }

  // Add general recommendations if needed
  if (recommendations.length === 0) {
    recommendations.push("All survey parameters are within acceptable ranges");
    recommendations.push("Continue monitoring for consistent survey quality");
  }

  return recommendations;
}

// Helper function for dogleg calculation
function calculateDoglegSeverity(surveys: SurveyData[]): number {
  if (surveys.length < 2) return 0;

  let totalDogleg = 0;
  let totalLength = 0;

  const sortedSurveys = [...surveys].sort((a, b) => a.bitDepth - b.bitDepth);

  for (let i = 1; i < sortedSurveys.length; i++) {
    const prev = sortedSurveys[i - 1];
    const curr = sortedSurveys[i];

    // Calculate course length
    const courseLength = Math.abs(curr.bitDepth - prev.bitDepth);

    // Skip if no significant course length
    if (courseLength < 1) continue;

    // Calculate dogleg angle (simplified)
    const incDiff = Math.abs(curr.inclination - prev.inclination);
    const aziDiff = Math.abs(curr.azimuth - prev.azimuth);

    // Simplified dogleg calculation
    const dogleg = Math.sqrt(
      incDiff * incDiff +
        aziDiff *
          aziDiff *
          Math.sin((prev.inclination * Math.PI) / 180) *
          Math.sin((curr.inclination * Math.PI) / 180),
    );

    // Dogleg severity in degrees per 100ft
    const dls = (dogleg / courseLength) * 100;

    totalDogleg += dls * courseLength;
    totalLength += courseLength;
  }

  return totalLength > 0 ? totalDogleg / totalLength : 0;
}

export default SurveyAnalytics;
