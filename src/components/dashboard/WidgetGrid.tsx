import React, { useState, useCallback } from "react";
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
  widgets = [
    {
      id: "1",
      type: "parameter",
      title: "Inclination",
      value: 45.2,
      unit: "°",
      min: 0,
      max: 90,
      trend: "up" as const,
      color: "#00ffaa",
      history: [42.1, 43.5, 44.2, 45.0, 45.2],
      isExpanded: false,
    },
    {
      id: "2",
      type: "parameter",
      title: "Azimuth",
      value: 178.3,
      unit: "°",
      min: 0,
      max: 360,
      trend: "stable" as const,
      color: "#ff9900",
      history: [177.8, 178.0, 178.1, 178.2, 178.3],
      isExpanded: false,
    },
    {
      id: "3",
      type: "parameter",
      title: "Gamma",
      value: 67.5,
      unit: "API",
      min: 0,
      max: 150,
      trend: "down" as const,
      color: "#ff00cc",
      history: [72.3, 71.1, 69.8, 68.2, 67.5],
      isExpanded: false,
    },
    {
      id: "4",
      type: "parameter",
      title: "ROP",
      value: 12.7,
      unit: "m/hr",
      min: 0,
      max: 30,
      trend: "up" as const,
      color: "#00ccff",
      history: [10.2, 11.0, 11.5, 12.1, 12.7],
      isExpanded: false,
    },
  ],
  onWidgetChange = () => {},
}: WidgetGridProps) => {
  const [localWidgets, setLocalWidgets] = useState<WidgetData[]>(widgets);
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
