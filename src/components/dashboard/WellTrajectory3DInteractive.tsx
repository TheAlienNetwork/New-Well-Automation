import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layers,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  Move,
  Box,
  Square,
  Grid as Grid2,
} from "lucide-react";
import { useSurveys } from "@/context/SurveyContext";

interface SurveyPoint {
  md: number;
  inc: number;
  az: number;
  tvd: number;
  ns: number;
  ew: number;
  gamma?: number;
  vibration?: number;
  toolTemp?: number;
}

interface OffsetWell {
  name: string;
  color: string;
  surveys: SurveyPoint[];
}

interface WellTrajectory3DInteractiveProps {
  surveys?: SurveyPoint[];
  offsetWells?: OffsetWell[];
  onExport?: () => void;
  manualCurveData?: {
    slideSeen?: number | null;
    slideAhead?: number | null;
    motorYield?: number | null;
    doglegNeeded?: number | null;
    projectedInc?: number | null;
    projectedAz?: number | null;
  };
}

const WellTrajectory3DInteractive = ({
  surveys: propSurveys,
  offsetWells = [],
  onExport = () => {},
  manualCurveData = {},
}: WellTrajectory3DInteractiveProps) => {
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [pan2D, setPan2D] = useState({ x: 0, y: 0 });
  const [scale2D, setScale2D] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [rotation, setRotation] = useState({ x: 0.5, y: 0.3 });
  const [zoom, setZoom] = useState(1.0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { surveys: contextSurveys } = useSurveys();

  const processSurveyData = useCallback((surveys: SurveyPoint[]) => {
    if (surveys.length === 0) return [];

    const processed: SurveyPoint[] = [{ ...surveys[0], tvd: 0, ns: 0, ew: 0 }];

    for (let i = 1; i < surveys.length; i++) {
      const prev = processed[i - 1];
      const curr = surveys[i];

      const deltaMD = curr.md - prev.md;
      if (deltaMD <= 0) continue;

      const prevIncRad = (prev.inc * Math.PI) / 180;
      const currIncRad = (curr.inc * Math.PI) / 180;
      const prevAzRad = (prev.az * Math.PI) / 180;
      const currAzRad = (curr.az * Math.PI) / 180;

      const dl = Math.acos(
        Math.cos(currIncRad - prevIncRad) -
          Math.sin(prevIncRad) *
            Math.sin(currIncRad) *
            (1 - Math.cos(currAzRad - prevAzRad)),
      );

      const rf = dl !== 0 ? Math.tan(dl / 2) / (dl / 2) : 1;

      const deltaTVD =
        (deltaMD / 2) * (Math.cos(prevIncRad) + Math.cos(currIncRad)) * rf;

      const deltaNS =
        (deltaMD / 2) *
        (Math.sin(prevIncRad) * Math.cos(prevAzRad) +
          Math.sin(currIncRad) * Math.cos(currAzRad)) *
        rf;

      const deltaEW =
        (deltaMD / 2) *
        (Math.sin(prevIncRad) * Math.sin(prevAzRad) +
          Math.sin(currIncRad) * Math.sin(currAzRad)) *
        rf;

      processed.push({
        ...curr,
        tvd: prev.tvd + deltaTVD,
        ns: prev.ns + deltaNS,
        ew: prev.ew + deltaEW,
      });
    }

    return processed;
  }, []);

  const surveys = useMemo(() => {
    const rawSurveys =
      propSurveys && propSurveys.length > 0
        ? propSurveys
        : contextSurveys?.map((s) => ({
            md: s.bitDepth || 0,
            inc: s.inclination || 0,
            az: s.azimuth || 0,
            tvd: 0,
            ns: 0,
            ew: 0,
            gamma: s.gamma || 50,
            vibration: s.vibration || 0,
            toolTemp: s.toolTemp || 0,
          })) || [];

    if (rawSurveys.length > 0 && rawSurveys[0].md !== 0) {
      rawSurveys.unshift({
        md: 0,
        inc: 0,
        az: 0,
        tvd: 0,
        ns: 0,
        ew: 0,
        gamma: 0,
        vibration: 0,
        toolTemp: 0,
      });
    }

    return processSurveyData(rawSurveys);
  }, [propSurveys, contextSurveys, processSurveyData]);

  const project3DPoint = (
    x: number,
    y: number,
    z: number,
    centerX: number,
    centerY: number,
    scale: number,
    rotation: { x: number; y: number },
  ) => {
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);

    // Modified to ensure trajectory goes downward
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Flip the y-axis to make the trajectory go downward
    // y is TVD (True Vertical Depth), so positive y should go down
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    const factor = scale / (scale + z2);
    return {
      x: centerX + x1 * factor * scale,
      // Adjust y-coordinate to make trajectory go downward
      y: centerY + y1 * factor * scale * 1.5, // Increased scale factor for better visualization
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsAutoRotating(false);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (viewMode === "2d") {
        // In 2D mode, pan the view
        setPan2D((prev) => ({
          x: prev.x + deltaX * 0.5,
          y: prev.y + deltaY * 0.5,
        }));
      } else {
        // In 3D mode, rotate the view
        const rotDeltaX = deltaX * 0.01;
        const rotDeltaY = deltaY * 0.01;

        setRotation((prev) => ({
          x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.x + rotDeltaY)),
          y: prev.y + rotDeltaX,
        }));
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, viewMode],
  );

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);
  const handleZoomIn = () => {
    if (viewMode === "2d") {
      setScale2D((prev) => Math.min(prev + 0.1, 3.0));
    } else {
      setZoom((prev) => Math.min(prev + 0.1, 3.0));
    }
  };

  const handleZoomOut = () => {
    if (viewMode === "2d") {
      setScale2D((prev) => Math.max(prev - 0.1, 0.5));
    } else {
      setZoom((prev) => Math.max(prev - 0.1, 0.5));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        if (surveys.length > 0) {
          setCurrentSurveyIndex((prev) => Math.max(prev - 1, 0));
          // Auto-adjust view in 2D mode
          if (viewMode === "2d" && surveys.length > 0) {
            const newIndex = Math.max(currentSurveyIndex - 1, 0);
            const targetY = (surveys[newIndex].tvd * scale2D) / 100;
            setPan2D((prev) => ({ ...prev, y: -targetY + 200 }));
          }
          // In 3D mode, the camera adjustment is handled by the useEffect that watches currentSurveyIndex
        }
      } else if (e.key === "ArrowDown") {
        if (surveys.length > 0) {
          setCurrentSurveyIndex((prev) =>
            Math.min(prev + 1, surveys.length - 1),
          );
          // Auto-adjust view in 2D mode
          if (viewMode === "2d" && surveys.length > 0) {
            const newIndex = Math.min(
              currentSurveyIndex + 1,
              surveys.length - 1,
            );
            const targetY = (surveys[newIndex].tvd * scale2D) / 100;
            setPan2D((prev) => ({ ...prev, y: -targetY + 200 }));
          }
          // In 3D mode, the camera adjustment is handled by the useEffect that watches currentSurveyIndex
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [surveys.length, surveys, currentSurveyIndex, viewMode, scale2D]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.offsetWidth;
        canvasRef.current.height = containerRef.current.offsetHeight;
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isAutoRotating) return;

    const timer = setTimeout(() => {
      setRotation((prev) => ({
        x: prev.x + 0.005,
        y: prev.y + 0.002,
      }));
    }, 50);

    return () => clearTimeout(timer);
  }, [isAutoRotating, rotation]);

  // Draw oil rig at the surface
  const drawOilRig = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Save context
    ctx.save();

    // Rig base
    ctx.fillStyle = "#334455";
    ctx.fillRect(x - 30, y - 20, 60, 20);

    // Rig tower
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 20);
    ctx.lineTo(x - 15, y - 100);
    ctx.lineTo(x + 15, y - 100);
    ctx.lineTo(x + 20, y - 20);
    ctx.closePath();
    ctx.fillStyle = "#445566";
    ctx.fill();

    // Rig top
    ctx.fillStyle = "#556677";
    ctx.fillRect(x - 25, y - 110, 50, 10);

    // Futuristic glow effect
    ctx.shadowColor = "#00aaff";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "#00ccff";
    ctx.lineWidth = 1;

    // Glow lines
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 100);
    ctx.lineTo(x + 15, y - 100);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 20, y - 20);
    ctx.lineTo(x + 20, y - 20);
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // Draw 2D view of the well trajectory
  const draw2DScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with a dark background
    ctx.fillStyle = "#0a1525";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply 2D pan and zoom
    const centerX = canvas.width / 2 + pan2D.x;
    const centerY = canvas.height / 3; // Position higher to show more downward trajectory
    const scale2DFactor = scale2D * 0.8;

    // Draw grid for 2D view
    ctx.strokeStyle = "#1a2a3a";
    ctx.lineWidth = 0.5;

    // Vertical grid lines
    for (let x = -5000; x <= 5000; x += 500) {
      const screenX = centerX + x * scale2DFactor;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvas.height);
      ctx.stroke();

      // Add depth markers
      if (x % 1000 === 0) {
        ctx.fillStyle = "#4a5a6a";
        ctx.font = "10px monospace";
        ctx.fillText(`${x}ft`, screenX + 5, 15);
      }
    }

    // Horizontal grid lines (depth)
    for (let y = 0; y <= 10000; y += 500) {
      const screenY = centerY + y * scale2DFactor;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvas.width, screenY);
      ctx.stroke();

      // Add depth markers
      if (y % 1000 === 0) {
        ctx.fillStyle = "#4a5a6a";
        ctx.font = "10px monospace";
        ctx.fillText(`${y}ft`, 5, screenY - 5);
      }
    }

    // Draw offset wells in 2D
    offsetWells.forEach((well) => {
      if (well.surveys.length < 2) return;

      ctx.strokeStyle = well.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      // Start at surface
      ctx.moveTo(centerX, centerY);

      for (let i = 0; i < well.surveys.length; i++) {
        const x = centerX + (well.surveys[i].ew * scale2DFactor) / 100;
        const y = centerY + (well.surveys[i].tvd * scale2DFactor) / 100;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    });

    // Draw main well trajectory in 2D
    if (surveys.length > 1) {
      const visibleSurveys = surveys.slice(0, currentSurveyIndex + 1);

      // Draw well path with glow effect
      ctx.strokeStyle = "#00aaff";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#00aaff";
      ctx.shadowBlur = 10;
      ctx.beginPath();

      // Start at surface
      ctx.moveTo(centerX, centerY);

      for (let i = 0; i < visibleSurveys.length; i++) {
        const x = centerX + (visibleSurveys[i].ew * scale2DFactor) / 100;
        const y = centerY + (visibleSurveys[i].tvd * scale2DFactor) / 100;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw current survey point
      if (currentSurveyIndex < surveys.length) {
        const x =
          centerX + (surveys[currentSurveyIndex].ew * scale2DFactor) / 100;
        const y =
          centerY + (surveys[currentSurveyIndex].tvd * scale2DFactor) / 100;

        // Glow effect for current point
        ctx.fillStyle = "#00ffaa";
        ctx.shadowColor = "#00ffaa";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Display current survey info
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          `MD: ${surveys[currentSurveyIndex].md.toFixed(1)} ft`,
          10,
          20,
        );
        ctx.fillText(
          `Inc: ${surveys[currentSurveyIndex].inc.toFixed(2)}°`,
          10,
          40,
        );
        ctx.fillText(
          `TVD: ${surveys[currentSurveyIndex].tvd.toFixed(1)} ft`,
          10,
          60,
        );
      }
    }

    // Draw oil rig at surface
    drawOilRig(ctx, centerX, centerY);
  }, [surveys, offsetWells, currentSurveyIndex, pan2D, scale2D]);

  const drawScene = useCallback(() => {
    // If in 2D mode, use the 2D drawing function
    if (viewMode === "2d") {
      draw2DScene();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a1525";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 3; // Position higher to show more downward trajectory
    const scale = Math.min(canvas.width, canvas.height) * 0.2 * zoom;

    // Add a subtle visual indicator that the camera is following the current point
    if (currentSurveyIndex > 0 && surveys.length > 0) {
      ctx.fillStyle = "rgba(0, 170, 255, 0.05)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#2a4a6a";
    ctx.lineWidth = 1;

    const drawAxis = (
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number,
      color: string,
      label: string,
    ) => {
      const start = project3DPoint(
        x1,
        y1,
        z1,
        centerX,
        centerY,
        scale,
        rotation,
      );
      const end = project3DPoint(x2, y2, z2, centerX, centerY, scale, rotation);

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - 10 * Math.cos(angle - Math.PI / 6),
        end.y - 10 * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        end.x - 10 * Math.cos(angle + Math.PI / 6),
        end.y - 10 * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      ctx.fillStyle = color;
      ctx.font = "12px Arial";
      ctx.fillText(label, end.x + 10, end.y + 5);
    };

    drawAxis(0, 0, 0, 10, 0, 0, "#ff5555", "E/W");
    drawAxis(0, 0, 0, 0, 10, 0, "#55ff55", "TVD");
    drawAxis(0, 0, 0, 0, 0, 10, "#5555ff", "N/S");

    // Calculate surface point for reference
    const surfacePoint = project3DPoint(
      0,
      0,
      0,
      centerX,
      centerY,
      scale,
      rotation,
    );

    // Draw oil rig at surface (0,0,0)
    drawOilRig(ctx, surfacePoint.x, surfacePoint.y);

    // Draw futuristic grid on the ground
    const gridSize = 20;
    const gridStep = 2;
    ctx.strokeStyle = "rgba(30, 100, 150, 0.3)";
    ctx.lineWidth = 0.5;

    for (let i = -gridSize; i <= gridSize; i += gridStep) {
      // Draw grid lines along X axis
      const start1 = project3DPoint(
        i,
        0,
        -gridSize,
        centerX,
        centerY,
        scale,
        rotation,
      );
      const end1 = project3DPoint(
        i,
        0,
        gridSize,
        centerX,
        centerY,
        scale,
        rotation,
      );

      ctx.beginPath();
      ctx.moveTo(start1.x, start1.y);
      ctx.lineTo(end1.x, end1.y);
      ctx.stroke();

      // Draw grid lines along Z axis
      const start2 = project3DPoint(
        -gridSize,
        0,
        i,
        centerX,
        centerY,
        scale,
        rotation,
      );
      const end2 = project3DPoint(
        gridSize,
        0,
        i,
        centerX,
        centerY,
        scale,
        rotation,
      );

      ctx.beginPath();
      ctx.moveTo(start2.x, start2.y);
      ctx.lineTo(end2.x, end2.y);
      ctx.stroke();
    }

    offsetWells.forEach((well) => {
      if (well.surveys.length < 2) return;

      ctx.strokeStyle = well.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const firstPoint = project3DPoint(
        well.surveys[0].ew / 100,
        -well.surveys[0].tvd / 100,
        well.surveys[0].ns / 100,
        centerX,
        centerY,
        scale,
        rotation,
      );
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < well.surveys.length; i++) {
        const point = project3DPoint(
          well.surveys[i].ew / 100,
          -well.surveys[i].tvd / 100,
          well.surveys[i].ns / 100,
          centerX,
          centerY,
          scale,
          rotation,
        );
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
    });

    if (surveys.length > 1) {
      const visibleSurveys = surveys.slice(0, currentSurveyIndex + 1);

      ctx.strokeStyle = "#00aaff";
      ctx.lineWidth = 3;
      ctx.beginPath();

      // Draw from surface (0,0,0) first
      ctx.moveTo(surfacePoint.x, surfacePoint.y);

      // Then continue with trajectory
      for (let i = 0; i < visibleSurveys.length; i++) {
        const point = project3DPoint(
          visibleSurveys[i].ew / 100,
          visibleSurveys[i].tvd / 100, // Remove negative sign to make trajectory go downward
          visibleSurveys[i].ns / 100,
          centerX,
          centerY,
          scale,
          rotation,
        );
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();

      if (currentSurveyIndex < surveys.length) {
        const currentPoint = project3DPoint(
          surveys[currentSurveyIndex].ew / 100,
          surveys[currentSurveyIndex].tvd / 100, // Remove negative sign to make trajectory go downward
          surveys[currentSurveyIndex].ns / 100,
          centerX,
          centerY,
          scale,
          rotation,
        );

        // Add a pulsing glow effect to the current point
        const pulseSize = 6 + Math.sin(Date.now() / 200) * 2;

        // Outer glow
        ctx.fillStyle = "rgba(0, 255, 170, 0.3)";
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, pulseSize + 4, 0, Math.PI * 2);
        ctx.fill();

        // Inner point
        ctx.fillStyle = "#00ffaa";
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          `MD: ${surveys[currentSurveyIndex].md.toFixed(1)} ft`,
          10,
          20,
        );
        ctx.fillText(
          `Inc: ${surveys[currentSurveyIndex].inc.toFixed(2)}°`,
          10,
          40,
        );
        ctx.fillText(
          `Az: ${surveys[currentSurveyIndex].az.toFixed(2)}°`,
          10,
          60,
        );
        ctx.fillText(
          `TVD: ${surveys[currentSurveyIndex].tvd.toFixed(1)} ft`,
          10,
          80,
        );
        ctx.fillText(
          `NS: ${surveys[currentSurveyIndex].ns.toFixed(1)} ft`,
          10,
          100,
        );
        ctx.fillText(
          `EW: ${surveys[currentSurveyIndex].ew.toFixed(1)} ft`,
          10,
          120,
        );
      }
    } else if (surveys.length === 0) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No survey data available", centerX, centerY - 20);
      ctx.fillText(
        "Add surveys to visualize well trajectory",
        centerX,
        centerY + 20,
      );
    }
  }, [
    surveys,
    offsetWells,
    rotation,
    zoom,
    currentSurveyIndex,
    viewMode,
    draw2DScene,
  ]);

  // Auto-adjust view when currentSurveyIndex changes in 3D mode
  useEffect(() => {
    if (
      viewMode === "3d" &&
      surveys.length > 0 &&
      currentSurveyIndex < surveys.length
    ) {
      // In 3D mode, we adjust the rotation and zoom to keep the current point centered in view
      const currentPoint = surveys[currentSurveyIndex];
      if (currentPoint) {
        // Calculate the direction vector from the previous point to the current point
        const prevIndex = Math.max(0, currentSurveyIndex - 1);
        const prevPoint = surveys[prevIndex];

        // Calculate direction vector components
        const dx = currentPoint.ew - prevPoint.ew;
        const dy = currentPoint.tvd - prevPoint.tvd;
        const dz = currentPoint.ns - prevPoint.ns;

        // Calculate the azimuth and inclination based on the direction vector
        const directionMagnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (directionMagnitude > 0) {
          // Calculate ideal camera rotation to look at the current point
          // This is a more sophisticated approach that calculates the ideal viewing angle
          const azRad = Math.atan2(dx, dz);
          const incRad = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

          // Apply smooth transition to the new rotation
          setRotation((prev) => ({
            x: prev.x * 0.7 + incRad * 0.3,
            y: prev.y * 0.7 + azRad * 0.3,
          }));

          // Adjust zoom based on depth to maintain perspective
          const depthFactor = Math.min(
            1.5,
            Math.max(0.8, currentPoint.tvd / 5000),
          );
          setZoom((prev) => prev * 0.9 + depthFactor * 0.1);
        }
      }
    }
  }, [currentSurveyIndex, surveys, viewMode]);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      drawScene();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [drawScene]);

  return (
    <Card className="w-full h-full bg-gray-900 border-gray-800 overflow-hidden">
      <CardHeader className="p-4 border-b border-gray-800 bg-gray-800/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-xl font-medium text-gray-100">
              Wellbore Visualization
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "3d" | "2d")}
              className="mr-4"
            >
              <TabsList className="bg-gray-800/80 backdrop-blur-sm border border-gray-700">
                <TabsTrigger
                  value="3d"
                  className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-100"
                >
                  <Box className="h-4 w-4 mr-1" /> 3D View
                </TabsTrigger>
                <TabsTrigger
                  value="2d"
                  className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-100"
                >
                  <Grid2 className="h-4 w-4 mr-1" /> 2D View
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {viewMode === "3d" && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-9 w-9 ${isAutoRotating ? "bg-cyan-900/50 border-cyan-700 text-cyan-300" : "bg-gray-800/80 backdrop-blur-sm border-gray-700"} hover:bg-cyan-900/30 transition-colors`}
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-cyan-900/30 transition-colors"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-cyan-900/30 transition-colors"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            {viewMode === "2d" && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-cyan-900/30 transition-colors"
                onClick={() => setPan2D({ x: 0, y: 0 })}
              >
                <Move className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className="p-0 relative"
        style={{ height: "calc(100% - 60px)" }}
      >
        <div
          ref={containerRef}
          className="w-full h-full relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-cyan-900/5 pointer-events-none"></div>
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Futuristic HUD elements */}
          <div className="absolute top-4 left-4 bg-gray-900/70 backdrop-blur-sm border border-cyan-800/30 rounded-md p-3 text-xs font-mono text-cyan-400 shadow-lg shadow-cyan-900/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-cyan-300">WELLBORE TELEMETRY</span>
            </div>
            {surveys.length > 0 &&
              currentSurveyIndex < surveys.length &&
              surveys[currentSurveyIndex] && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">MD:</span>
                    <span>{surveys[currentSurveyIndex].md.toFixed(1)} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">INC:</span>
                    <span>
                      {(manualCurveData.projectedInc !== null &&
                      manualCurveData.projectedInc !== undefined
                        ? manualCurveData.projectedInc
                        : surveys[currentSurveyIndex]?.inc || 0
                      ).toFixed(2)}
                      °
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">AZ:</span>
                    <span>
                      {(manualCurveData.projectedAz !== null &&
                      manualCurveData.projectedAz !== undefined
                        ? manualCurveData.projectedAz
                        : surveys[currentSurveyIndex]?.az || 0
                      ).toFixed(2)}
                      °
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">TVD:</span>
                    <span>{surveys[currentSurveyIndex].tvd.toFixed(1)} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Motor Yield:</span>
                    <span>
                      {(manualCurveData.motorYield !== null &&
                      manualCurveData.motorYield !== undefined
                        ? manualCurveData.motorYield
                        : 2.5
                      ).toFixed(2)}
                      °/100ft
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dogleg Needed:</span>
                    <span>
                      {(manualCurveData.doglegNeeded !== null &&
                      manualCurveData.doglegNeeded !== undefined
                        ? manualCurveData.doglegNeeded
                        : 3.0
                      ).toFixed(2)}
                      °/100ft
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Slide Seen:</span>
                    <span>
                      {(manualCurveData.slideSeen !== null &&
                      manualCurveData.slideSeen !== undefined
                        ? manualCurveData.slideSeen
                        : 0.0
                      ).toFixed(2)}
                      °
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Slide Ahead:</span>
                    <span>
                      {(manualCurveData.slideAhead !== null &&
                      manualCurveData.slideAhead !== undefined
                        ? manualCurveData.slideAhead
                        : 0.0
                      ).toFixed(2)}
                      °
                    </span>
                  </div>
                </div>
              )}
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-gray-800/80 backdrop-blur-sm border-cyan-700/50 shadow-lg shadow-cyan-900/20 hover:bg-cyan-900/30 transition-colors"
              onClick={() => {
                if (surveys.length > 0) {
                  setCurrentSurveyIndex((prev) => Math.max(prev - 1, 0));
                  // Auto-adjust view in 2D mode
                  if (viewMode === "2d") {
                    const newIndex = Math.max(currentSurveyIndex - 1, 0);
                    const targetY = (surveys[newIndex].tvd * scale2D) / 100;
                    setPan2D((prev) => ({ ...prev, y: -targetY + 200 }));
                  }
                }
              }}
              disabled={surveys.length === 0}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-gray-800/80 backdrop-blur-sm border-cyan-700/50 shadow-lg shadow-cyan-900/20 hover:bg-cyan-900/30 transition-colors"
              onClick={() => {
                if (surveys.length > 0) {
                  setCurrentSurveyIndex((prev) =>
                    Math.min(prev + 1, surveys.length - 1),
                  );
                  // Auto-adjust view in 2D mode
                  if (viewMode === "2d") {
                    const newIndex = Math.min(
                      currentSurveyIndex + 1,
                      surveys.length - 1,
                    );
                    const targetY = (surveys[newIndex].tvd * scale2D) / 100;
                    setPan2D((prev) => ({ ...prev, y: -targetY + 200 }));
                  }
                }
              }}
              disabled={surveys.length === 0}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellTrajectory3DInteractive;
