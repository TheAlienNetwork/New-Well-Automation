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
import {
  Layers,
  Download,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
  MoveVertical,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  X,
} from "lucide-react";
import { project3DPoint, processSurveyData } from "@/utils/3dUtils";
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
  timestamp?: string;
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
}

const WellTrajectory3DInteractive = ({
  surveys: propSurveys,
  offsetWells = [],
  onExport = () => {},
}: WellTrajectory3DInteractiveProps) => {
  // Refs for canvas and container
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State management
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.3 });
  const [zoom, setZoom] = useState(1.0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Get surveys from context if not provided via props
  const { surveys: contextSurveys } = useSurveys();

  // Process and sort surveys
  const surveys = useMemo(() => {
    const rawSurveys =
      propSurveys && propSurveys.length > 0
        ? propSurveys
        : Array.isArray(contextSurveys)
          ? contextSurveys.map((survey) => ({
              md: survey.bitDepth || 0,
              inc: survey.inclination || 0,
              az: survey.azimuth || 0,
              tvd: 0, // Will be calculated by processSurveyData
              ns: 0, // Will be calculated by processSurveyData
              ew: 0, // Will be calculated by processSurveyData
              gamma: survey.gamma || 50,
              vibration: survey.vibration || 0,
              toolTemp: survey.toolTemp || 0,
              timestamp: survey.timestamp,
            }))
          : [];

    return processSurveyData(rawSurveys).sort((a, b) => a.md - b.md);
  }, [propSurveys, contextSurveys]);

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsAutoRotating(false);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = (e.clientX - dragStart.x) * 0.01;
      const deltaY = (e.clientY - dragStart.y) * 0.01;

      setRotation((prev) => ({
        x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.x + deltaY)),
        y: prev.y + deltaX,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        setCurrentSurveyIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "ArrowDown") {
        setCurrentSurveyIndex((prev) => Math.min(prev + 1, surveys.length - 1));
      }
    },
    [surveys.length],
  );

  // Set up event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle canvas resizing
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

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoRotating) return;

    const timer = setTimeout(() => {
      setRotation((prev) => ({
        x: prev.x + 0.005 * animationSpeed,
        y: prev.y + 0.002 * animationSpeed,
      }));
    }, 50);

    return () => clearTimeout(timer);
  }, [isAutoRotating, rotation, animationSpeed]);

  // Main drawing function
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, "#0a1525");
    bgGradient.addColorStop(0.3, "#111827");
    bgGradient.addColorStop(1, "#1a1a20");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 3;
    const gridSize = Math.min(canvas.width, canvas.height) * 0.6 * zoom;

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height, rotation, zoom);

    // Draw oil rig first so well path can connect to it
    drawOilRig(ctx, centerX, centerY, gridSize, rotation);

    // Get visible surveys up to current depth
    const currentDepth = surveys[currentSurveyIndex]?.md || 0;
    const visibleSurveys = surveys.filter((s) => s.md <= currentDepth);

    // Draw offset wells
    offsetWells.forEach((well) => {
      drawWellPath(
        ctx,
        centerX,
        centerY,
        gridSize,
        well.surveys,
        rotation,
        well.color,
        1,
        zoom,
      );
    });

    // Draw main well path (only if we have data)
    if (visibleSurveys.length > 0) {
      drawWellPath(
        ctx,
        centerX,
        centerY,
        gridSize,
        visibleSurveys,
        rotation,
        "#00aaff",
        2,
        zoom,
      );
    }

    // Draw current survey point info
    if (surveys[currentSurveyIndex]) {
      const currentSurvey = surveys[currentSurveyIndex];
      const point = project3DPoint(
        currentSurvey.ew / 100,
        -currentSurvey.tvd / 100,
        currentSurvey.ns / 100,
        centerX,
        centerY,
        gridSize,
        rotation,
      );

      // Draw highlighted survey point
      ctx.fillStyle = "#00ffaa";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw survey information
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px monospace";
      ctx.fillText(`MD: ${currentSurvey.md.toFixed(1)} ft`, 10, 20);
      ctx.fillText(`Inc: ${currentSurvey.inc.toFixed(2)}°`, 10, 40);
      ctx.fillText(`Az: ${currentSurvey.az.toFixed(2)}°`, 10, 60);
      ctx.fillText(`TVD: ${currentSurvey.tvd.toFixed(1)} ft`, 10, 80);
      ctx.fillText(`NS: ${currentSurvey.ns.toFixed(1)} ft`, 10, 100);
      ctx.fillText(`EW: ${currentSurvey.ew.toFixed(1)} ft`, 10, 120);
    } else if (surveys.length === 0) {
      // Show message when no data is available
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("No survey data available", centerX, centerY - 20);
      ctx.font = "14px monospace";
      ctx.fillText(
        "Add surveys to visualize well trajectory",
        centerX,
        centerY + 20,
      );
      ctx.textAlign = "left";
    }
  }, [
    surveys,
    offsetWells,
    rotation,
    zoom,
    isAutoRotating,
    currentSurveyIndex,
  ]);

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      drawScene();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [drawScene]);

  // Drawing helper functions
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    rotation: { x: number; y: number },
    zoom: number,
  ) => {
    const centerX = width / 2;
    const centerY = height / 3;
    const gridSize = Math.min(width, height) * 0.6 * zoom;

    // Draw surface grid
    ctx.strokeStyle = "#2a4a6a";
    ctx.lineWidth = 1;

    // Horizontal grid lines (X-Z plane)
    for (let z = -10; z <= 10; z += 2) {
      const startPoint = project3DPoint(
        -10,
        0,
        z,
        centerX,
        centerY,
        gridSize,
        rotation,
      );
      const endPoint = project3DPoint(
        10,
        0,
        z,
        centerX,
        centerY,
        gridSize,
        rotation,
      );

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    }

    // Vertical grid lines (X-Z plane)
    for (let x = -10; x <= 10; x += 2) {
      const startPoint = project3DPoint(
        x,
        0,
        -10,
        centerX,
        centerY,
        gridSize,
        rotation,
      );
      const endPoint = project3DPoint(
        x,
        0,
        10,
        centerX,
        centerY,
        gridSize,
        rotation,
      );

      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    }
  };

  const drawOilRig = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    gridSize: number,
    rotation: { x: number; y: number },
  ) => {
    const scaleFactor = gridSize / 400;
    const rigWidth = 60 * scaleFactor;
    const rigHeight = 30 * scaleFactor;
    const derrickHeight = 90 * scaleFactor;

    // Position rig at wellhead (0,0,0)
    const rigBasePoint = project3DPoint(
      0,
      0,
      0,
      centerX,
      centerY,
      gridSize,
      rotation,
    );

    // Draw rig base
    ctx.fillStyle = "#444444";
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(
      rigBasePoint.x - rigWidth / 2,
      rigBasePoint.y - rigHeight / 2,
      rigWidth,
      rigHeight,
    );
    ctx.fill();
    ctx.stroke();

    // Draw derrick
    ctx.beginPath();
    // Left leg
    ctx.moveTo(rigBasePoint.x - rigWidth / 3, rigBasePoint.y - rigHeight / 2);
    ctx.lineTo(rigBasePoint.x - rigWidth / 4, rigBasePoint.y - derrickHeight);
    // Right leg
    ctx.moveTo(rigBasePoint.x + rigWidth / 3, rigBasePoint.y - rigHeight / 2);
    ctx.lineTo(rigBasePoint.x + rigWidth / 4, rigBasePoint.y - derrickHeight);
    // Top
    ctx.moveTo(rigBasePoint.x - rigWidth / 4, rigBasePoint.y - derrickHeight);
    ctx.lineTo(rigBasePoint.x + rigWidth / 4, rigBasePoint.y - derrickHeight);
    // Cross supports
    for (let i = 1; i <= 4; i++) {
      const y = rigBasePoint.y - rigHeight / 2 - i * (derrickHeight / 5);
      ctx.moveTo(
        rigBasePoint.x - rigWidth / 3 + i * (rigWidth / 30),
        rigBasePoint.y - rigHeight / 2,
      );
      ctx.lineTo(rigBasePoint.x + rigWidth / 3 - i * (rigWidth / 30), y);
      ctx.moveTo(
        rigBasePoint.x + rigWidth / 3 - i * (rigWidth / 30),
        rigBasePoint.y - rigHeight / 2,
      );
      ctx.lineTo(rigBasePoint.x - rigWidth / 3 + i * (rigWidth / 30), y);
    }
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2 * scaleFactor;
    ctx.stroke();

    // Draw crown block
    ctx.fillStyle = "#666666";
    ctx.beginPath();
    ctx.rect(
      rigBasePoint.x - rigWidth / 4,
      rigBasePoint.y - derrickHeight - 5 * scaleFactor,
      rigWidth / 2,
      5 * scaleFactor,
    );
    ctx.fill();

    // Draw traveling block
    ctx.fillStyle = "#777777";
    ctx.beginPath();
    ctx.rect(
      rigBasePoint.x - rigWidth / 6,
      rigBasePoint.y - derrickHeight * 0.78,
      rigWidth / 3,
      rigHeight / 3,
    );
    ctx.fill();
    ctx.stroke();

    // Draw drill line from top of derrick to traveling block
    ctx.beginPath();
    ctx.moveTo(rigBasePoint.x, rigBasePoint.y - derrickHeight);
    ctx.lineTo(rigBasePoint.x, rigBasePoint.y - derrickHeight * 0.78);
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1.5 * scaleFactor;
    ctx.stroke();

    // Draw drill string from rig floor to current survey point
    if (surveys.length > 0 && currentSurveyIndex < surveys.length) {
      const currentSurvey = surveys[currentSurveyIndex];
      const drillPipeEndPoint = project3DPoint(
        currentSurvey.ew / 100,
        -currentSurvey.tvd / 100,
        currentSurvey.ns / 100,
        centerX,
        centerY,
        gridSize,
        rotation,
      );

      // Create gradient for drill pipe
      const pipeGradient = ctx.createLinearGradient(
        rigBasePoint.x,
        rigBasePoint.y,
        drillPipeEndPoint.x,
        drillPipeEndPoint.y,
      );
      pipeGradient.addColorStop(0, "#cccccc");
      pipeGradient.addColorStop(0.3, "#aaaaaa");
      pipeGradient.addColorStop(1, "#00aaff");

      // Draw the pipe with gradient
      ctx.beginPath();
      ctx.moveTo(rigBasePoint.x, rigBasePoint.y);
      ctx.lineTo(drillPipeEndPoint.x, drillPipeEndPoint.y);
      ctx.strokeStyle = pipeGradient;
      ctx.lineWidth = 8 * scaleFactor;
      ctx.lineCap = "round";
      ctx.stroke();

      // Add glow effect
      ctx.shadowColor = "#00aaff80";
      ctx.shadowBlur = 10 * scaleFactor;
      ctx.lineWidth = 6 * scaleFactor;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  const drawWellPath = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    gridSize: number,
    pathData: SurveyPoint[],
    rotation: { x: number; y: number },
    color: string,
    lineWidth: number,
    zoomFactor: number,
  ) => {
    if (pathData.length < 2) return;

    // Draw gamma heatmap first
    drawGammaHeatmap(ctx, centerX, centerY, gridSize, pathData, rotation);

    // Draw drill string segments
    for (let i = 1; i < pathData.length; i++) {
      const prevPoint = pathData[i - 1];
      const currentPoint = pathData[i];

      const x1 = prevPoint.ew / 100;
      const y1 = -prevPoint.tvd / 100;
      const z1 = prevPoint.ns / 100;

      const x2 = currentPoint.ew / 100;
      const y2 = -currentPoint.tvd / 100;
      const z2 = currentPoint.ns / 100;

      const projectedPoint1 = project3DPoint(
        x1,
        y1,
        z1,
        centerX,
        centerY,
        gridSize,
        rotation,
      );
      const projectedPoint2 = project3DPoint(
        x2,
        y2,
        z2,
        centerX,
        centerY,
        gridSize,
        rotation,
      );

      // Modern color scheme with depth-based gradient
      const depthRatio = Math.min(1, currentPoint.tvd / 10000);
      const depthColor =
        i === pathData.length - 1
          ? "#00eeff"
          : `rgba(${0 + Math.round(depthRatio * 50)}, ${170 - Math.round(depthRatio * 100)}, ${255 - Math.round(depthRatio * 100)}, 0.9)`;

      // Draw pipe segment
      ctx.save();
      const gradient = ctx.createLinearGradient(
        projectedPoint1.x,
        projectedPoint1.y,
        projectedPoint2.x,
        projectedPoint2.y,
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, depthColor);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth * 3.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(projectedPoint1.x, projectedPoint1.y);
      ctx.lineTo(projectedPoint2.x, projectedPoint2.y);
      ctx.stroke();

      // Add outer glow
      ctx.strokeStyle = depthColor;
      ctx.lineWidth = lineWidth * 4.5;
      ctx.globalAlpha = 0.3;
      ctx.shadowColor = depthColor;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Add inner highlight
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = lineWidth * 1.5;
      ctx.globalAlpha = 0.5;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(projectedPoint1.x, projectedPoint1.y);
      ctx.lineTo(projectedPoint2.x, projectedPoint2.y);
      ctx.stroke();
      ctx.restore();

      // Draw connections every 3 points
      if (i % 3 === 0) {
        ctx.save();
        const connGradient = ctx.createRadialGradient(
          projectedPoint2.x,
          projectedPoint2.y,
          0,
          projectedPoint2.x,
          projectedPoint2.y,
          lineWidth * 3,
        );
        connGradient.addColorStop(0, "#ffffff");
        connGradient.addColorStop(0.3, "#cccccc");
        connGradient.addColorStop(1, "#888888");

        ctx.fillStyle = connGradient;
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 1;
        ctx.shadowColor = "rgba(0,200,255,0.6)";
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(
          projectedPoint2.x,
          projectedPoint2.y,
          lineWidth * 2.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Draw survey markers every 10 points
      if (i % 10 === 0) {
        ctx.save();
        const surveyGradient = ctx.createRadialGradient(
          projectedPoint2.x,
          projectedPoint2.y,
          0,
          projectedPoint2.x,
          projectedPoint2.y,
          8,
        );
        surveyGradient.addColorStop(0, "#00eeff");
        surveyGradient.addColorStop(0.5, "#0099ff80");
        surveyGradient.addColorStop(1, "#0066ff00");

        ctx.fillStyle = surveyGradient;
        ctx.beginPath();
        ctx.arc(projectedPoint2.x, projectedPoint2.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#00aaff";
        ctx.beginPath();
        ctx.arc(projectedPoint2.x, projectedPoint2.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `${currentPoint.md.toFixed(0)}'`,
          projectedPoint2.x,
          projectedPoint2.y - 12,
        );
        ctx.font = "9px monospace";
        ctx.fillText(
          `${currentPoint.inc.toFixed(1)}° / ${currentPoint.az.toFixed(0)}°`,
          projectedPoint2.x,
          projectedPoint2.y - 24,
        );
        ctx.restore();
      }
    }

    // Draw drill bit at the end
    if (pathData.length > 0) {
      const lastPoint = pathData[pathData.length - 1];
      const projectedBit = project3DPoint(
        lastPoint.ew / 100,
        -lastPoint.tvd / 100,
        lastPoint.ns / 100,
        centerX,
        centerY,
        gridSize,
        rotation,
      );

      ctx.save();
      const bitGradient = ctx.createRadialGradient(
        projectedBit.x,
        projectedBit.y,
        0,
        projectedBit.x,
        projectedBit.y,
        18,
      );
      bitGradient.addColorStop(0, "#00ffff");
      bitGradient.addColorStop(0.4, "#00aaff");
      bitGradient.addColorStop(0.7, "#0066ffaa");
      bitGradient.addColorStop(1, "#0044ff00");

      ctx.fillStyle = bitGradient;
      ctx.beginPath();
      ctx.arc(projectedBit.x, projectedBit.y, 18, 0, Math.PI * 2);
      ctx.fill();

      const metalGradient = ctx.createRadialGradient(
        projectedBit.x - 2,
        projectedBit.y - 2,
        0,
        projectedBit.x,
        projectedBit.y,
        8,
      );
      metalGradient.addColorStop(0, "#ffffff");
      metalGradient.addColorStop(0.3, "#e0e0e0");
      metalGradient.addColorStop(0.7, "#b0b0b0");
      metalGradient.addColorStop(1, "#808080");

      ctx.fillStyle = metalGradient;
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#00aaff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(projectedBit.x, projectedBit.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#00ccff";
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(projectedBit.x, projectedBit.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Add pulse effect
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.3 - i * 0.1;
        ctx.beginPath();
        ctx.arc(projectedBit.x, projectedBit.y, 8 + i * 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#00eeff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }
  };

  const drawGammaHeatmap = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    gridSize: number,
    pathData: SurveyPoint[],
    rotation: { x: number; y: number },
  ) => {
    // Create paths for different gamma ranges
    const lowGammaPoints: {
      x: number;
      y: number;
      tvd: number;
      gamma: number;
    }[] = [];
    const mediumGammaPoints: {
      x: number;
      y: number;
      tvd: number;
      gamma: number;
    }[] = [];
    const highGammaPoints: {
      x: number;
      y: number;
      tvd: number;
      gamma: number;
    }[] = [];

    // Process path data points
    pathData.forEach((point) => {
      const projectedPoint = project3DPoint(
        point.ew / 100,
        -point.tvd / 100,
        point.ns / 100,
        centerX,
        centerY,
        gridSize,
        rotation,
      );

      // Store original TVD and gamma value with the projected point
      const enhancedPoint = {
        ...projectedPoint,
        tvd: point.tvd,
        gamma: point.gamma || 50,
      };

      if (point.gamma < 40) {
        lowGammaPoints.push(enhancedPoint);
      } else if (point.gamma < 70) {
        mediumGammaPoints.push(enhancedPoint);
      } else {
        highGammaPoints.push(enhancedPoint);
      }
    });

    // Draw intense gamma hotspots with radial gradients
    const drawGammaHotspots = () => {
      // Combine all points for processing
      const allPoints = [
        ...lowGammaPoints,
        ...mediumGammaPoints,
        ...highGammaPoints,
      ];

      // Sort by TVD to ensure proper rendering order (deepest first)
      allPoints.sort((a, b) => b.tvd - a.tvd);

      // Draw radial gradients at each point
      allPoints.forEach((point) => {
        // Size based on gamma value - larger for more dramatic effect
        const size = 30 + point.gamma / 5;

        // Color based on gamma range - more vibrant
        let color;
        if (point.gamma < 40) {
          color = "#00ff88"; // Low gamma - green
        } else if (point.gamma < 70) {
          color = "#ffaa00"; // Medium gamma - orange
        } else {
          color = "#ff0088"; // High gamma - pink
        }

        // Create radial gradient
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          size,
        );

        gradient.addColorStop(0, color + "cc"); // More opaque center
        gradient.addColorStop(0.5, color + "66"); // Semi-transparent middle
        gradient.addColorStop(1, color + "00"); // Transparent edge

        // Draw the gradient
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 1;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.restore();
      });
    };

    // Draw gamma flow paths
    const drawGammaFlowPaths = (
      points: { x: number; y: number; tvd: number; gamma: number }[],
      color: string,
    ) => {
      if (points.length < 2) return;

      // Draw flowing paths that extend from the wellbore
      const flowPathCount = Math.min(points.length, 15); // Limit number of flow paths for performance
      const stepSize = Math.floor(points.length / flowPathCount);

      for (let i = 0; i < points.length; i += stepSize) {
        if (i >= points.length) break;

        const point = points[i];
        const flowLength = 50 + point.gamma / 2; // Length based on gamma intensity
        const flowAngle = (i * 0.7) % (Math.PI * 2); // Vary angle for visual interest

        // Calculate flow endpoint
        const endX = point.x + Math.cos(flowAngle) * flowLength;
        const endY = point.y + Math.sin(flowAngle) * flowLength;

        // Create gradient for flow path
        const gradient = ctx.createLinearGradient(point.x, point.y, endX, endY);
        gradient.addColorStop(0, color + "cc"); // More opaque at wellbore
        gradient.addColorStop(1, color + "00"); // Transparent at end

        // Draw flow path
        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + point.gamma / 30; // Width based on gamma intensity
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);

        // Create a curved flow path
        const controlX =
          point.x + Math.cos(flowAngle + 0.2) * (flowLength * 0.5);
        const controlY =
          point.y + Math.sin(flowAngle + 0.2) * (flowLength * 0.5);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);

        ctx.stroke();

        // Add glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 1;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.restore();
      }
    };

    // Draw traditional path-based gamma areas with enhanced transparency
    const drawGammaArea = (
      points: { x: number; y: number; tvd: number; gamma: number }[],
      color: string,
    ) => {
      if (points.length < 2) return;

      const areaWidth = 60; // Wider area for more dramatic effect

      ctx.save();
      ctx.globalAlpha = 0.3; // More transparent for layered effect
      ctx.fillStyle = color;

      // Create a path that follows the wellbore with width
      ctx.beginPath();

      // First side of the path
      for (let i = 0; i < points.length; i++) {
        const angle =
          i === 0
            ? Math.PI / 2
            : Math.atan2(
                points[i].y - points[i - 1].y,
                points[i].x - points[i - 1].x,
              ) +
              Math.PI / 2;

        const offsetX = Math.cos(angle) * areaWidth;
        const offsetY = Math.sin(angle) * areaWidth;

        if (i === 0) {
          ctx.moveTo(points[i].x + offsetX, points[i].y + offsetY);
        } else {
          ctx.lineTo(points[i].x + offsetX, points[i].y + offsetY);
        }
      }

      // Return path (other side)
      for (let i = points.length - 1; i >= 0; i--) {
        const angle =
          i === points.length - 1
            ? Math.PI / 2
            : Math.atan2(
                points[i].y - points[i + 1].y,
                points[i].x - points[i + 1].x,
              ) +
              Math.PI / 2;

        const offsetX = Math.cos(angle) * -areaWidth;
        const offsetY = Math.sin(angle) * -areaWidth;

        ctx.lineTo(points[i].x + offsetX, points[i].y + offsetY);
      }

      ctx.closePath();
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 1; // Increased blur for more dramatic effect
      ctx.fill();

      ctx.restore();
    };

    // Draw all visualization types for enhanced effect
    // First the areas
    drawGammaArea(lowGammaPoints, "#00ff88"); // Low gamma - green
    drawGammaArea(mediumGammaPoints, "#ffaa00"); // Medium gamma - orange
    drawGammaArea(highGammaPoints, "#ff0088"); // High gamma - pink

    // Then the flow paths
    drawGammaFlowPaths(lowGammaPoints, "#00ff88");
    drawGammaFlowPaths(mediumGammaPoints, "#ffaa00");
    drawGammaFlowPaths(highGammaPoints, "#ff0088");

    // Finally the hotspots
    drawGammaHotspots();
  };

  // Handle export
  const handleExport = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = "well-trajectory.png";
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
    onExport();
  };

  // Gamma Legend component
  const GammaLegend = () => (
    <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg border border-gray-800 shadow-lg text-xs">
      <div className="flex flex-col gap-2">
        <div className="text-gray-200 font-medium mb-1 border-b border-gray-800 pb-1 flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          <span className="tracking-wider uppercase">Gamma Ray</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
            <div className="w-4 h-4 rounded-full bg-green-500 mb-1 shadow-glow-green"></div>
            <span className="text-gray-300 text-[10px]">Low</span>
            <span className="text-green-400 text-[9px] font-mono">
              &lt;40 API
            </span>
          </div>
          <div className="flex flex-col items-center bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
            <div className="w-4 h-4 rounded-full bg-orange-500 mb-1 shadow-glow-orange"></div>
            <span className="text-gray-300 text-[10px]">Medium</span>
            <span className="text-orange-400 text-[9px] font-mono">
              40-70 API
            </span>
          </div>
          <div className="flex flex-col items-center bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
            <div className="w-4 h-4 rounded-full bg-pink-500 mb-1 shadow-glow-pink"></div>
            <span className="text-gray-300 text-[10px]">High</span>
            <span className="text-pink-400 text-[9px] font-mono">
              &gt;70 API
            </span>
          </div>
        </div>

        <div className="text-gray-200 font-medium mt-2 mb-1 border-b border-gray-800 pb-1 flex items-center">
          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
          <span className="tracking-wider uppercase">Vibration</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
            <div className="w-4 h-4 rounded-full bg-green-500 mb-1"></div>
            <span className="text-gray-300 text-[10px]">Normal</span>
            <span className="text-green-400 text-[9px] font-mono">&lt;30%</span>
          </div>
          <div className="flex flex-col items-center bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mb-1 shadow-glow-yellow"></div>
            <span className="text-gray-300 text-[10px]">Moderate</span>
            <span className="text-yellow-400 text-[9px] font-mono">30-60%</span>
          </div>
          <div className="flex flex-col items-center bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
            <div className="w-4 h-4 rounded-full bg-red-500 mb-1 shadow-glow-red"></div>
            <span className="text-gray-300 text-[10px]">Severe</span>
            <span className="text-red-400 text-[9px] font-mono">&gt;60%</span>
          </div>
        </div>

        <div className="text-gray-200 font-medium mt-3 mb-1 border-b border-gray-800 pb-1 flex items-center">
          <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div>
          <span className="tracking-wider uppercase">Bit Depth</span>
        </div>
        <div className="bg-gray-800/80 rounded-md p-2 border border-cyan-900/50 text-center">
          <div className="text-lg text-cyan-300 font-mono font-bold tracking-wider">
            {surveys[currentSurveyIndex]?.md?.toFixed(1) || "N/A"} ft
          </div>
          <div className="text-[10px] text-gray-400">
            Current Survey: {currentSurveyIndex + 1} of {surveys.length}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800 shadow-2xl overflow-hidden rounded-xl">
      <CardHeader className="p-4 pb-2 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-900/50 p-1.5 rounded-md">
              <Layers className="h-5 w-5 text-cyan-400" />
            </div>
            <CardTitle className="text-xl font-medium text-gray-100 tracking-wide">
              3D Wellbore Visualization
            </CardTitle>
            <Badge
              variant="outline"
              className="ml-2 bg-cyan-950/50 text-cyan-300 border-cyan-700 px-3 py-0.5 text-xs font-medium tracking-wider shadow-glow-cyan"
            >
              INTERACTIVE
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${isAutoRotating ? "bg-cyan-900/50 border-cyan-700 text-cyan-400" : "bg-gray-800/80 border-gray-700 hover:bg-gray-700/80"} rounded-md transition-all duration-200 shadow-md`}
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              aria-label={
                isAutoRotating ? "Stop auto-rotation" : "Start auto-rotation"
              }
            >
              <RotateCw
                className={`h-4 w-4 ${isAutoRotating ? "text-cyan-300" : "text-gray-400"}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 ${isAutoRotating ? "bg-cyan-900/50 border-cyan-700 text-cyan-400" : "bg-gray-800/80 border-gray-700 hover:bg-gray-700/80"} rounded-md transition-all duration-200 shadow-md`}
              onClick={() => setIsAutoRotating(!isAutoRotating)}
            >
              {isAutoRotating ? "Auto: ON" : "Auto: OFF"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-gray-800/80 border-gray-700 hover:bg-gray-700/80 rounded-md transition-all duration-200 shadow-md"
              onClick={handleZoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4 text-gray-300" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-gray-800/80 border-gray-700 hover:bg-gray-700/80 rounded-md transition-all duration-200 shadow-md"
              onClick={handleZoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4 text-gray-300" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-gray-800/80 border-gray-700 hover:bg-gray-700/80 rounded-md transition-all duration-200 shadow-md"
              onClick={handleExport}
              aria-label="Export image"
            >
              <Download className="h-4 w-4 text-gray-300" />
            </Button>
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
          style={{ height: "100%" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
            aria-label="3D well trajectory visualization"
          />

          {/* Survey navigation controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-gray-800/90 border-cyan-900/50 hover:bg-cyan-900/30 hover:border-cyan-800 rounded-md shadow-lg transition-all duration-200"
              onClick={() =>
                setCurrentSurveyIndex((prev) => Math.max(prev - 1, 0))
              }
              disabled={surveys.length === 0}
              aria-label="Previous survey point"
            >
              <ArrowUp className="h-5 w-5 text-cyan-300" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-gray-800/90 border-cyan-900/50 hover:bg-cyan-900/30 hover:border-cyan-800 rounded-md shadow-lg transition-all duration-200"
              onClick={() =>
                setCurrentSurveyIndex((prev) =>
                  Math.min(prev + 1, surveys.length - 1),
                )
              }
              disabled={surveys.length === 0}
              aria-label="Next survey point"
            >
              <ArrowDown className="h-5 w-5 text-cyan-300" />
            </Button>
          </div>

          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg border border-gray-800 shadow-lg text-xs">
            <div className="flex flex-col gap-2">
              <div className="text-gray-200 font-medium mb-1 border-b border-gray-800 pb-1 flex items-center">
                <span className="tracking-wider uppercase text-cyan-400">
                  Controls
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
                  <div className="bg-gray-700 rounded p-0.5 text-[9px] font-mono text-white">
                    Mouse
                  </div>
                  <span className="text-gray-300 text-[10px]">Rotate View</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
                  <div className="bg-gray-700 rounded p-0.5 text-[9px] font-mono text-white">
                    Scroll
                  </div>
                  <span className="text-gray-300 text-[10px]">Zoom In/Out</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
                  <div className="bg-gray-700 rounded p-0.5 text-[9px] font-mono text-white">
                    ↑/↓
                  </div>
                  <span className="text-gray-300 text-[10px]">
                    Navigate Surveys
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
                  <div className="bg-cyan-900/80 rounded p-0.5 text-[9px] font-mono text-cyan-300">
                    Auto
                  </div>
                  <span className="text-gray-300 text-[10px]">
                    {isAutoRotating ? "Rotating On" : "Rotation Off"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gamma and depth legend */}
          <GammaLegend />
        </div>
      </CardContent>
    </Card>
  );
};

export default WellTrajectory3DInteractive;
