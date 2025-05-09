import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Ruler, Save, Settings } from "lucide-react";
import { useWits } from "@/context/WitsContext";
import { useUser } from "@/context/UserContext";
import { useSurveys } from "@/context/SurveyContext";
import { createWell, updateWell, getActiveWells } from "@/lib/database";

interface WellInformationWidgetProps {
  wellName?: string;
  rigName?: string;
  sensorOffset?: number;
  onUpdate?: (data: {
    wellName: string;
    rigName: string;
    sensorOffset: number;
  }) => void;
}

const WellInformationWidget = ({
  wellName: propWellName = "Alpha-123",
  rigName: propRigName = "Precision Drilling #42",
  sensorOffset: propSensorOffset = 0,
  onUpdate,
}: WellInformationWidgetProps) => {
  const { userProfile, updateUserProfile } = useUser();
  const { witsData } = useWits();
  const { surveys, updateSurvey } = useSurveys();

  const [wellName, setWellName] = useState(propWellName);
  const [rigName, setRigName] = useState(propRigName);
  const [sensorOffset, setSensorOffset] = useState(propSensorOffset);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when props change or fetch from database
  useEffect(() => {
    const fetchWellData = async () => {
      try {
        // First check if user has a current well
        if (userProfile.currentWellId) {
          // Fetch active wells from database
          const activeWells = await getActiveWells();
          const currentWell = activeWells.find(
            (well) => well.id === userProfile.currentWellId,
          );

          if (currentWell) {
            // Use database values
            setWellName(currentWell.name);
            setRigName(currentWell.rig_name || "");
            setSensorOffset(currentWell.sensor_offset || 0);

            // Update localStorage for consistency
            localStorage.setItem("wellName", currentWell.name);
            localStorage.setItem("rigName", currentWell.rig_name || "");
            localStorage.setItem(
              "sensorOffset",
              String(currentWell.sensor_offset || 0),
            );

            console.log("Loaded well data from database:", currentWell);
            return;
          }
        }

        // Check if userProfile has well information (for newly created wells)
        if (
          userProfile.wellName ||
          userProfile.rigName ||
          userProfile.sensorOffset !== undefined
        ) {
          setWellName(userProfile.wellName || propWellName);
          setRigName(userProfile.rigName || propRigName);
          setSensorOffset(
            userProfile.sensorOffset !== undefined
              ? userProfile.sensorOffset
              : propSensorOffset,
          );

          console.log("Using well data from user profile:", {
            wellName: userProfile.wellName,
            rigName: userProfile.rigName,
            sensorOffset: userProfile.sensorOffset,
          });
          return;
        }

        // Fall back to localStorage if no current well or well not found
        const savedWellName = localStorage.getItem("wellName");
        const savedRigName = localStorage.getItem("rigName");
        const savedSensorOffset = localStorage.getItem("sensorOffset");

        // Use localStorage values if available, otherwise use props
        setWellName(savedWellName || propWellName);
        setRigName(savedRigName || propRigName);
        setSensorOffset(
          savedSensorOffset ? Number(savedSensorOffset) : propSensorOffset,
        );
      } catch (error) {
        console.error("Error fetching well data:", error);
        // Fall back to props
        setWellName(propWellName);
        setRigName(propRigName);
        setSensorOffset(propSensorOffset);
      }
    };

    fetchWellData();
  }, [
    propWellName,
    propRigName,
    propSensorOffset,
    userProfile.currentWellId,
    userProfile.wellName,
    userProfile.rigName,
    userProfile.sensorOffset,
  ]);

  // Update well information from latest survey if available
  useEffect(() => {
    if (surveys.length > 0 && !propWellName && !propRigName) {
      // Sort surveys by timestamp (newest first)
      const sortedSurveys = [...surveys].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Get the latest survey
      const latestSurvey = sortedSurveys[0];

      // Update well name and rig name if available in the survey
      if (latestSurvey.wellName) {
        setWellName(latestSurvey.wellName);
      }

      if (latestSurvey.rigName) {
        setRigName(latestSurvey.rigName);
      }

      // Update sensor offset if available
      if (latestSurvey.sensorOffset !== undefined) {
        setSensorOffset(latestSurvey.sensorOffset);
      }
    }
  }, [surveys, propWellName, propRigName, propSensorOffset]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update well information
      const wellInfo = {
        wellName,
        rigName,
        sensorOffset,
      };

      // Save to localStorage for persistence across page navigation
      localStorage.setItem("wellName", wellName);
      localStorage.setItem("rigName", rigName);
      localStorage.setItem("sensorOffset", sensorOffset.toString());

      // Update user profile context with well information
      userProfile.wellName = wellName;
      userProfile.rigName = rigName;
      userProfile.sensorOffset = sensorOffset;
      updateUserProfile({
        wellName,
        rigName,
        sensorOffset,
      });

      // Save to database
      if (userProfile.currentWellId) {
        // Update existing well
        await updateWell(userProfile.currentWellId, {
          name: wellName,
          rig_name: rigName,
          sensor_offset: sensorOffset,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
        console.log("Well updated in database:", userProfile.currentWellId);
      } else {
        // Create new well
        const newWell = await createWell({
          name: wellName,
          rig_name: rigName,
          sensor_offset: sensorOffset,
          is_active: true,
          created_at: new Date().toISOString(),
        });

        // Update user profile with the new well ID
        if (newWell && newWell.id) {
          userProfile.currentWellId = newWell.id;
          updateUserProfile({
            currentWellId: newWell.id,
          });
          console.log("New well created in database:", newWell.id);
        }
      }

      // Call the onUpdate prop if provided
      if (onUpdate) {
        onUpdate(wellInfo);
      }

      // Update all surveys with the new well information
      if (surveys.length > 0) {
        // Use updateSurvey from context that we got earlier
        surveys.forEach((survey) => {
          const updatedSurvey = {
            ...survey,
            wellName,
            rigName,
            sensorOffset,
            well_id: userProfile.currentWellId, // Add well_id to surveys
          };
          // Update the survey in the context
          updateSurvey(updatedSurvey);
        });
      }

      console.log("Well information saved:", {
        wellName,
        rigName,
        sensorOffset,
        wellId: userProfile.currentWellId,
      });
    } catch (error) {
      console.error("Error saving well information to database:", error);
    } finally {
      setIsEditing(false);
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-sm font-medium text-gray-300">
            Well Information
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-gray-300 hover:bg-gray-800"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="p-3 pt-2">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="well-name" className="text-xs text-gray-500">
                Well Name
              </Label>
              <Input
                id="well-name"
                value={wellName}
                onChange={(e) => setWellName(e.target.value)}
                className="h-8 bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="rig-name" className="text-xs text-gray-500">
                Rig Name
              </Label>
              <Input
                id="rig-name"
                value={rigName}
                onChange={(e) => setRigName(e.target.value)}
                className="h-8 bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sensor-offset" className="text-xs text-gray-500">
                Sensor Offset (ft)
              </Label>
              <Input
                id="sensor-offset"
                type="number"
                step="0.1"
                value={sensorOffset}
                onChange={(e) =>
                  setSensorOffset(parseFloat(e.target.value) || 0)
                }
                className="h-8 bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 mt-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Well Name</p>
                <p className="text-sm font-medium text-blue-400">{wellName}</p>
              </div>
            </div>

            <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-900/30 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Rig Name</p>
                <p className="text-sm font-medium text-purple-400">{rigName}</p>
              </div>
            </div>

            <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-yellow-900/30 flex items-center justify-center">
                <Ruler className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sensor Offset</p>
                <p className="text-sm font-medium text-yellow-400">
                  {sensorOffset.toFixed(2)} ft
                </p>
              </div>
            </div>

            <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-900/30 flex items-center justify-center">
                <Ruler className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Current Bit Depth</p>
                <p className="text-sm font-medium text-green-400">
                  {surveys.length > 0
                    ? [...surveys]
                        .sort(
                          (a, b) =>
                            new Date(b.timestamp).getTime() -
                            new Date(a.timestamp).getTime(),
                        )[0]
                        .bitDepth.toFixed(2)
                    : witsData.bitDepth.toFixed(2)}{" "}
                  ft
                </p>
              </div>
            </div>

            <div className="p-2 bg-gray-800/50 rounded-md flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-cyan-900/30 flex items-center justify-center">
                <Ruler className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Measured Depth</p>
                <p className="text-sm font-medium text-cyan-400">
                  {surveys.length > 0
                    ? (
                        [...surveys].sort(
                          (a, b) =>
                            new Date(b.timestamp).getTime() -
                            new Date(a.timestamp).getTime(),
                        )[0].bitDepth - sensorOffset
                      ).toFixed(2)
                    : (witsData.bitDepth - sensorOffset).toFixed(2)}{" "}
                  ft
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WellInformationWidget;
