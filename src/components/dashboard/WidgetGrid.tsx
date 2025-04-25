import React, { useState, useCallback, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, X, Move } from "lucide-react";
import ParameterWidget from "./widgets/ParameterWidget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWits } from "@/context/WitsContext";
import { useSurveys } from "@/context/SurveyContext";

interface WidgetData {
  id: string;
  type: string;
  title: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  trend: "up" | "down" | "stable";
  color: string;
  history: number[];
  isExpanded: boolean;
  gridArea?: string;
}

interface WidgetGridProps {
  widgets?: WidgetData[];
  onWidgetChange?: (widgets: WidgetData[]) => void;
}

type DragItem = {
  type: string;
  id: string;
  index: number;
};

const WidgetItem = ({
  widget,
  index,
  moveWidget,
  removeWidget,
  expandWidget,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: "WIDGET",
    item: { type: "WIDGET", id: widget.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "WIDGET",
    hover: (item: DragItem, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      moveWidget(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative ${widget.isExpanded ? "col-span-2 row-span-2" : "col-span-1 row-span-1"} ${isDragging ? "opacity-50" : "opacity-100"}`}
      style={{ gridArea: widget.gridArea }}
    >
      <div className="absolute top-0 right-0 z-10 p-1 bg-gray-900 bg-opacity-70 rounded-bl-md">
        <button
          className="p-1 text-gray-400 hover:text-white"
          onClick={() => removeWidget(widget.id)}
        >
          <X size={14} />
        </button>
        <button className="p-1 text-gray-400 hover:text-white cursor-move">
          <Move size={14} />
        </button>
      </div>
      <ParameterWidget
        title={widget.title}
        value={widget.value}
        unit={widget.unit}
        min={widget.min}
        max={widget.max}
        trend={widget.trend}
        color={widget.color}
        history={widget.history}
        isExpanded={widget.isExpanded}
        onExpand={() => expandWidget(widget.id, true)}
        onMinimize={() => expandWidget(widget.id, false)}
      />
    </div>
  );
};

const WidgetGrid = ({
  widgets = [],
  onWidgetChange = () => {},
}: WidgetGridProps) => {
  const [localWidgets, setLocalWidgets] = useState<WidgetData[]>(widgets);
  const { witsData, isConnected } = useWits();
  const { surveys } = useSurveys();

  // Initialize default widgets if none provided
  useEffect(() => {
    if (widgets.length === 0 && localWidgets.length === 0) {
      const defaultWidgets: WidgetData[] = [
        {
          id: "inclination-widget",
          type: "parameter",
          title: "Inclination",
          value: 0,
          unit: "°",
          min: 0,
          max: 90,
          trend: "stable" as const,
          color: "#00ffaa",
          history: [],
          isExpanded: false,
        },
        {
          id: "azimuth-widget",
          type: "parameter",
          title: "Azimuth",
          value: 0,
          unit: "°",
          min: 0,
          max: 360,
          trend: "stable" as const,
          color: "#ff9900",
          history: [],
          isExpanded: false,
        },
        {
          id: "gamma-widget",
          type: "parameter",
          title: "Gamma",
          value: 0,
          unit: "API",
          min: 0,
          max: 150,
          trend: "stable" as const,
          color: "#ff00cc",
          history: [],
          isExpanded: false,
        },
        {
          id: "rop-widget",
          type: "parameter",
          title: "ROP",
          value: 0,
          unit: "m/hr",
          min: 0,
          max: 30,
          trend: "stable" as const,
          color: "#00ccff",
          history: [],
          isExpanded: false,
        },
      ];
      setLocalWidgets(defaultWidgets);
    }
  }, [widgets, localWidgets.length]);

  // Update widgets with real-time data
  useEffect(() => {
    if (!isConnected || !witsData) return;

    setLocalWidgets((prevWidgets) => {
      return prevWidgets.map((widget) => {
        // Create a copy of the widget to modify
        const updatedWidget = { ...widget };

        // Get the previous value to determine trend
        const prevValue = updatedWidget.value;

        // Update widget based on its title
        switch (widget.title.toLowerCase()) {
          case "inclination":
            if (witsData.inclination !== undefined) {
              updatedWidget.value = witsData.inclination;
              updatedWidget.history = [
                ...updatedWidget.history.slice(-4),
                witsData.inclination,
              ];
              updatedWidget.trend = determineTrend(
                prevValue,
                witsData.inclination,
              );
            }
            break;
          case "azimuth":
            if (witsData.azimuth !== undefined) {
              updatedWidget.value = witsData.azimuth;
              updatedWidget.history = [
                ...updatedWidget.history.slice(-4),
                witsData.azimuth,
              ];
              updatedWidget.trend = determineTrend(prevValue, witsData.azimuth);
            }
            break;
          case "gamma":
            if (witsData.gamma !== undefined) {
              updatedWidget.value = witsData.gamma;
              updatedWidget.history = [
                ...updatedWidget.history.slice(-4),
                witsData.gamma,
              ];
              updatedWidget.trend = determineTrend(prevValue, witsData.gamma);
            }
            break;
          case "rop":
            if (witsData.rop !== undefined) {
              updatedWidget.value = witsData.rop;
              updatedWidget.history = [
                ...updatedWidget.history.slice(-4),
                witsData.rop,
              ];
              updatedWidget.trend = determineTrend(prevValue, witsData.rop);
            }
            break;
          // Add more cases for other parameter types as needed
        }

        return updatedWidget;
      });
    });
  }, [witsData, isConnected]);

  // Helper function to determine trend
  const determineTrend = (
    prevValue: number,
    newValue: number,
  ): "up" | "down" | "stable" => {
    const difference = newValue - prevValue;
    if (Math.abs(difference) < 0.1) return "stable";
    return difference > 0 ? "up" : "down";
  };
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [newWidgetData, setNewWidgetData] = useState({
    title: "New Parameter",
    unit: "",
    min: 0,
    max: 100,
    color: "#00ffaa",
  });

  // Update parent when local widgets change
  React.useEffect(() => {
    onWidgetChange(localWidgets);
  }, [localWidgets, onWidgetChange]);

  const moveWidget = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalWidgets((prevWidgets) => {
      const newWidgets = [...prevWidgets];
      const draggedWidget = newWidgets[dragIndex];
      newWidgets.splice(dragIndex, 1);
      newWidgets.splice(hoverIndex, 0, draggedWidget);
      return newWidgets;
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setLocalWidgets((prevWidgets) =>
      prevWidgets.filter((widget) => widget.id !== id),
    );
  }, []);

  const expandWidget = useCallback((id: string, isExpanded: boolean) => {
    setLocalWidgets((prevWidgets) =>
      prevWidgets.map((widget) =>
        widget.id === id ? { ...widget, isExpanded } : widget,
      ),
    );
  }, []);

  const addNewWidget = () => {
    const newWidget: WidgetData = {
      id: `widget-${Date.now()}`,
      type: "parameter",
      title: newWidgetData.title,
      value: 50,
      unit: newWidgetData.unit,
      min: newWidgetData.min,
      max: newWidgetData.max,
      trend: "stable",
      color: newWidgetData.color,
      history: [48, 49, 50, 50, 50],
      isExpanded: false,
    };

    setLocalWidgets((prev) => [...prev, newWidget]);
    setIsAddWidgetOpen(false);
    setNewWidgetData({
      title: "New Parameter",
      unit: "",
      min: 0,
      max: 100,
      color: "#00ffaa",
    });
  };

  return (
    <div className="w-full h-full bg-gray-950 p-4 rounded-lg border border-gray-800 resizable">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-200">
          Drilling Parameters
        </h2>
        <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-gray-200">
            <DialogHeader>
              <DialogTitle>Add New Parameter Widget</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={newWidgetData.title}
                  onChange={(e) =>
                    setNewWidgetData({
                      ...newWidgetData,
                      title: e.target.value,
                    })
                  }
                  className="col-span-3 bg-gray-800 border-gray-700 text-gray-200"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">
                  Unit
                </Label>
                <Input
                  id="unit"
                  value={newWidgetData.unit}
                  onChange={(e) =>
                    setNewWidgetData({ ...newWidgetData, unit: e.target.value })
                  }
                  className="col-span-3 bg-gray-800 border-gray-700 text-gray-200"
                  placeholder="e.g. °, m/hr, API"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="min" className="text-right">
                  Min Value
                </Label>
                <Input
                  id="min"
                  type="number"
                  value={newWidgetData.min}
                  onChange={(e) =>
                    setNewWidgetData({
                      ...newWidgetData,
                      min: Number(e.target.value),
                    })
                  }
                  className="col-span-3 bg-gray-800 border-gray-700 text-gray-200"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max" className="text-right">
                  Max Value
                </Label>
                <Input
                  id="max"
                  type="number"
                  value={newWidgetData.max}
                  onChange={(e) =>
                    setNewWidgetData({
                      ...newWidgetData,
                      max: Number(e.target.value),
                    })
                  }
                  className="col-span-3 bg-gray-800 border-gray-700 text-gray-200"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">
                  Color
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newWidgetData.color}
                    onChange={(e) =>
                      setNewWidgetData({
                        ...newWidgetData,
                        color: e.target.value,
                      })
                    }
                    className="w-12 h-10 p-1 bg-gray-800 border-gray-700"
                  />
                  <Input
                    value={newWidgetData.color}
                    onChange={(e) =>
                      setNewWidgetData({
                        ...newWidgetData,
                        color: e.target.value,
                      })
                    }
                    className="flex-1 bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddWidgetOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={addNewWidget}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Widget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndProvider backend={HTML5Backend}>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] gap-4"
          style={{
            gridTemplateRows: `repeat(${Math.ceil(localWidgets.length / 4)}, 200px)`,
          }}
        >
          {localWidgets.map((widget, index) => (
            <WidgetItem
              key={widget.id}
              widget={widget}
              index={index}
              moveWidget={moveWidget}
              removeWidget={removeWidget}
              expandWidget={expandWidget}
            />
          ))}
        </div>
      </DndProvider>
    </div>
  );
};

export default WidgetGrid;
