import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWits, WitsMappings, WitsMappingItem } from "@/context/WitsContext";
import { Plus, Trash2, Save, RotateCcw, Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WitsChannelsTabProps {
  className?: string;
}

const WitsChannelsTab: React.FC<WitsChannelsTabProps> = ({ className }) => {
  const { witsMappings, updateWitsMappings, connectionType } = useWits();

  const [mappings, setMappings] = useState<WitsMappings>(witsMappings);
  const [activeTab, setActiveTab] = useState<string>("drilling");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  // Update local state when witsMappings changes
  useEffect(() => {
    setMappings(witsMappings);
  }, [witsMappings]);

  const handleAddMapping = (type: "drilling" | "directional" | "custom") => {
    const newMapping: WitsMappingItem = {
      name: "",
      channel: 0,
      witsId: 0,
      unit: "",
    };

    setMappings((prev) => {
      const updatedMappings = { ...prev };

      if (type === "custom") {
        if (!updatedMappings.custom) {
          updatedMappings.custom = [];
        }
        updatedMappings.custom = [...updatedMappings.custom, newMapping];
      } else {
        updatedMappings[type] = [...updatedMappings[type], newMapping];
      }

      return updatedMappings;
    });
  };

  const handleRemoveMapping = (
    type: "drilling" | "directional" | "custom",
    index: number,
  ) => {
    setMappings((prev) => {
      const updatedMappings = { ...prev };

      if (type === "custom" && updatedMappings.custom) {
        updatedMappings.custom = updatedMappings.custom.filter(
          (_, i) => i !== index,
        );
      } else {
        updatedMappings[type] = updatedMappings[type].filter(
          (_, i) => i !== index,
        );
      }

      return updatedMappings;
    });
  };

  const handleMappingChange = (
    type: "drilling" | "directional" | "custom",
    index: number,
    field: keyof WitsMappingItem,
    value: string | number,
  ) => {
    setMappings((prev) => {
      const updatedMappings = { ...prev };

      if (type === "custom" && updatedMappings.custom) {
        updatedMappings.custom = updatedMappings.custom.map((item, i) => {
          if (i === index) {
            return { ...item, [field]: value };
          }
          return item;
        });
      } else {
        updatedMappings[type] = updatedMappings[type].map((item, i) => {
          if (i === index) {
            return { ...item, [field]: value };
          }
          return item;
        });
      }

      return updatedMappings;
    });
  };

  const handleSaveMappings = () => {
    const success = updateWitsMappings(mappings);
    if (success) {
      console.log("WITS mappings updated successfully");
      // Show a toast or some visual feedback
      const toastElement = document.createElement("div");
      toastElement.className =
        "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg";
      toastElement.textContent = "Channel mappings saved successfully";
      document.body.appendChild(toastElement);
      setTimeout(() => {
        document.body.removeChild(toastElement);
      }, 3000);
    }
  };

  const handleResetMappings = () => {
    setMappings(witsMappings);
    setShowResetDialog(false);
  };

  const handleExportMappings = () => {
    try {
      const mappingsJson = JSON.stringify(mappings, null, 2);
      const blob = new Blob([mappingsJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `wits-mappings-${connectionType}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting mappings:", error);
    }
  };

  const handleImportMappings = () => {
    try {
      setImportError(null);
      const importedMappings = JSON.parse(importText);

      // Validate imported mappings
      if (!importedMappings.drilling || !importedMappings.directional) {
        throw new Error("Invalid mappings format: missing required sections");
      }

      // Validate each mapping item
      const validateMappingItems = (items: WitsMappingItem[]) => {
        items.forEach((item) => {
          if (
            typeof item.name !== "string" ||
            typeof item.channel !== "number" ||
            typeof item.witsId !== "number" ||
            typeof item.unit !== "string"
          ) {
            throw new Error("Invalid mapping item format");
          }
        });
      };

      validateMappingItems(importedMappings.drilling);
      validateMappingItems(importedMappings.directional);
      if (importedMappings.custom) {
        validateMappingItems(importedMappings.custom);
      }

      setMappings(importedMappings);
      setShowImportDialog(false);
      setImportText("");
    } catch (error) {
      console.error("Error importing mappings:", error);
      setImportError(`Import error: ${error.message}`);
    }
  };

  const renderMappingTable = (type: "drilling" | "directional" | "custom") => {
    const items = type === "custom" ? mappings.custom || [] : mappings[type];

    return (
      <div className="space-y-4">
        <Table className="border border-gray-800">
          <TableHeader className="bg-gray-900">
            <TableRow>
              <TableHead className="text-gray-300">Parameter Name</TableHead>
              <TableHead className="text-gray-300">WITS Channel</TableHead>
              <TableHead className="text-gray-300">WITS ID</TableHead>
              <TableHead className="text-gray-300">Unit</TableHead>
              <TableHead className="text-gray-300 w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index} className="border-gray-800">
                <TableCell>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      handleMappingChange(type, index, "name", e.target.value)
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.channel}
                    onChange={(e) =>
                      handleMappingChange(
                        type,
                        index,
                        "channel",
                        parseInt(e.target.value),
                      )
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.witsId}
                    onChange={(e) =>
                      handleMappingChange(
                        type,
                        index,
                        "witsId",
                        parseInt(e.target.value),
                      )
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.unit}
                    onChange={(e) =>
                      handleMappingChange(type, index, "unit", e.target.value)
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMapping(type, index)}
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAddMapping(type)}
          className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add{" "}
          {type === "drilling"
            ? "Drilling"
            : type === "directional"
              ? "Directional"
              : "Custom"}{" "}
          Parameter
        </Button>
      </div>
    );
  };

  return (
    <Card
      className={`bg-gray-900 border-gray-800 shadow-lg overflow-hidden ${className}`}
    >
      <CardHeader className="p-4 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-200">
            WITS Channel Mappings
          </CardTitle>
          <div className="flex space-x-2">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-gray-200">
                <DialogHeader>
                  <DialogTitle>Import WITS Mappings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Label htmlFor="importText">Paste JSON mappings below:</Label>
                  <textarea
                    id="importText"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full h-60 p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 font-mono text-sm"
                  />
                  {importError && (
                    <div className="text-red-400 text-sm">{importError}</div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowImportDialog(false)}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImportMappings}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Import
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMappings}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <AlertDialog
              open={showResetDialog}
              onOpenChange={setShowResetDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-800 text-gray-200">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset WITS Mappings?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    This will discard all your changes and restore the last
                    saved mappings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetMappings}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={handleSaveMappings}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 mb-4">
            <TabsTrigger value="drilling">Drilling</TabsTrigger>
            <TabsTrigger value="directional">Directional</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="drilling">
            {renderMappingTable("drilling")}
          </TabsContent>

          <TabsContent value="directional">
            {renderMappingTable("directional")}
          </TabsContent>

          <TabsContent value="custom">
            {renderMappingTable("custom")}
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Channel Mapping Guide
          </h3>
          <p className="text-xs text-gray-400">
            <strong>Parameter Name:</strong> The name of the parameter in the
            application
            <br />
            <strong>WITS Channel:</strong> The WITS channel number (e.g., 8, 12,
            16)
            <br />
            <strong>WITS ID:</strong> The internal ID used for mapping (1-based
            index)
            <br />
            <strong>Unit:</strong> The unit of measurement (e.g., ft, klbs, deg)
          </p>
          <p className="text-xs text-gray-400 mt-2">
            For {connectionType === "witsml" ? "WITSML" : "WITS"} connections,
            ensure that the channel numbers match the data source configuration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WitsChannelsTab;
