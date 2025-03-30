import React, { useRef, useEffect, useState } from "react";
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

interface WellTrajectory3DInteractiveProps {
  surveys?: Array<{
    md: number;
    inc: number;
    az: number;
    tvd: number;
    ns: number;
    ew: number;
  }>;
  offsetWells?: Array<{
    name: string;
    color: string;
    surveys: Array<{
      md: number;
      tvd: number;
      ns: number;
      ew: number;
    }>;
  }>;
  onExport?: () => void;
}

const WellTrajectory3DInteractive = ({
  surveys = generateDummySurveys(),
  offsetWells = [
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
  ],
  onExport = () => {},
}: WellTrajectory3DInteractiveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.3 });
  const [zoom, setZoom] = useState(1.0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Generate dummy survey data for visualization
  function generateDummySurveys(nsOffset = 0, ewOffset = 0, randomFactor = 10) {
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
  }

  // Handle mouse events for 3D interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = (e.clientX - dragStart.x) * 0.01;
    const deltaY = (e.clientY - dragStart.y) * 0.01;

    setRotation((prev) => ({
      x: prev.x + deltaY,
      y: prev.y + deltaX,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      setCurrentSurveyIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "ArrowDown") {
      setCurrentSurveyIndex((prev) => Math.min(prev + 1, surveys.length - 1));
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Project 3D point to 2D - side view perspective
  const project3DPoint = (
    x: number,
    y: number,
    z: number,
    centerX: number,
    centerY: number,
    scale: number,
    rotation: { x: number; y: number },
  ) => {
    // Apply rotation - modified for side view perspective
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);

    // Adjust rotation to emphasize side view (earth cut in half)
    const rotatedX = x * cosY - z * sinY;
    const rotatedZ = x * sinY + z * cosY;
    const rotatedY = y * cosX + rotatedZ * sinX;

    // Project to 2D with enhanced depth perception
    return {
      x: centerX + rotatedX * scale,
      y: centerY + rotatedY * scale * 1.2, // Enhance vertical scale for better side view
    };
  };

  // Draw the 3D trajectory
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    if (containerRef.current) {
      canvas.width = containerRef.current.offsetWidth;
      canvas.height = containerRef.current.offsetHeight;
    }

    // Create background gradient for sky/underground effect
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, "#0a1525"); // Sky
    bgGradient.addColorStop(0.3, "#111827"); // Horizon
    bgGradient.addColorStop(1, "#1a1a20"); // Deep underground

    // Clear canvas with gradient background
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid with surface and oil rig
    drawGrid(ctx, canvas.width, canvas.height, rotation);

    // Draw axes
    drawAxes(ctx, canvas.width, canvas.height, rotation);

    // Calculate current bit depth for visualization
    // Use the currentSurveyIndex to determine how much of the well to show
    const currentBitDepth = surveys[currentSurveyIndex]?.md || 0;

    // Create a filtered survey array that only includes points up to the current bit depth
    const visibleSurveys = surveys.filter(
      (survey) => survey.md <= currentBitDepth,
    );

    // Draw offset wells
    offsetWells.forEach((well) => {
      drawWellPath(
        ctx,
        canvas.width,
        canvas.height,
        well.surveys,
        rotation,
        well.color,
        1,
        zoom,
      );
    });

    // Draw main well path up to current bit depth
    drawWellPath(
      ctx,
      canvas.width,
      canvas.height,
      visibleSurveys,
      rotation,
      "#00aaff",
      2,
      zoom,
    );

    // Draw current survey point
    if (surveys.length > 0 && currentSurveyIndex < surveys.length) {
      const currentSurvey = surveys[currentSurveyIndex];
      const point = project3DPoint(
        currentSurvey.ew / 100,
        -currentSurvey.tvd / 100,
        currentSurvey.ns / 100,
        canvas.width / 2,
        canvas.height / 2,
        Math.min(canvas.width, canvas.height) * 0.4 * zoom,
        rotation,
      );

      // Draw highlighted survey point
      ctx.fillStyle = "#00ffaa";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = "#00ffaa80";
      ctx.shadowBlur = 1;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw survey info
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px monospace";
      ctx.fillText(`MD: ${currentSurvey.md.toFixed(1)} ft`, 10, 20);
      ctx.fillText(`Inc: ${currentSurvey.inc.toFixed(2)}°`, 10, 40);
      ctx.fillText(`Az: ${currentSurvey.az.toFixed(2)}°`, 10, 60);
      ctx.fillText(`TVD: ${currentSurvey.tvd.toFixed(1)} ft`, 10, 80);
    }

    // Auto-rotation disabled by default
    if (isAutoRotating) {
      const rotationTimer = setTimeout(() => {
        setRotation((prev) => ({
          x: prev.x + 0.005,
          y: prev.y + 0.002,
        }));
      }, 50);

      return () => clearTimeout(rotationTimer);
    }
  }, [
    surveys,
    offsetWells,
    rotation,
    zoom,
    isAutoRotating,
    currentSurveyIndex,
  ]);

  // Draw grid lines and surface with oil rig - enhanced for side view
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    rotation: { x: number; y: number },
  ) => {
    const centerX = width / 2;
    const centerY = height / 3; // Move center point up to show more underground
    const gridSize = Math.min(width, height) * 0.6 * zoom; // Larger grid size
    const gridStep = gridSize / 5;

    // Draw earth layers (side view)
    drawEarthLayers(ctx, width, height, centerX, centerY, gridSize, rotation);

    // Draw flat surface plane
    ctx.save();
    ctx.fillStyle = "#1a2e44";
    ctx.globalAlpha = 0.8;

    // Create surface plane points - wider for side view
    const surfacePoints = [
      project3DPoint(-10, 0, -10, centerX, centerY, gridSize, rotation),
      project3DPoint(10, 0, -10, centerX, centerY, gridSize, rotation),
      project3DPoint(10, 0, 10, centerX, centerY, gridSize, rotation),
      project3DPoint(-10, 0, 10, centerX, centerY, gridSize, rotation),
    ];

    // Draw surface plane
    ctx.beginPath();
    ctx.moveTo(surfacePoints[0].x, surfacePoints[0].y);
    ctx.lineTo(surfacePoints[1].x, surfacePoints[1].y);
    ctx.lineTo(surfacePoints[2].x, surfacePoints[2].y);
    ctx.lineTo(surfacePoints[3].x, surfacePoints[3].y);
    ctx.closePath();
    ctx.fill();

    // Add surface texture
    ctx.strokeStyle = "#2a4a6a";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw grid lines on surface
    ctx.strokeStyle = "#2a4a6a";
    ctx.lineWidth = 1;

    // Draw horizontal grid lines (X-Z plane)
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

    // Draw vertical grid lines (X-Z plane)
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

    // Draw oil rig at surface
    drawOilRig(ctx, centerX, centerY, gridSize, rotation);
  };

  // Draw earth layers for side view with enhanced visual effects
  const drawEarthLayers = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    gridSize: number,
    rotation: { x: number; y: number },
  ) => {
    // Define earth layers with depths, colors and textures
    const layers = [
      { depth: 0, color: "#1a2e44", name: "Surface", texture: "smooth" },
      { depth: 2, color: "#2d2d1e", name: "Topsoil", texture: "grainy" },
      { depth: 4, color: "#3d3525", name: "Clay", texture: "smooth" },
      { depth: 7, color: "#4a3c2a", name: "Sandstone", texture: "grainy" },
      { depth: 10, color: "#5a4a35", name: "Limestone", texture: "smooth" },
      { depth: 15, color: "#3a3a45", name: "Shale", texture: "layered" },
      { depth: 25, color: "#2a2a35", name: "Bedrock", texture: "rough" },
      { depth: 40, color: "#1a1a25", name: "Deep Rock", texture: "rough" },
    ];

    // Draw each layer with enhanced visual effects
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const nextLayer = layers[i - 1] || { depth: 0 };

      ctx.save();

      // Create gradient fill for more realistic appearance
      const gradientY1 = project3DPoint(
        0,
        -nextLayer.depth,
        0,
        centerX,
        centerY,
        gridSize,
        rotation,
      ).y;

      const gradientY2 = project3DPoint(
        0,
        -layer.depth,
        0,
        centerX,
        centerY,
        gridSize,
        rotation,
      ).y;

      const gradient = ctx.createLinearGradient(0, gradientY1, 0, gradientY2);

      // Darker at bottom, lighter at top for 3D effect
      const baseColor = layer.color;
      const darkerColor = adjustColor(baseColor, -20); // Darker version
      const lighterColor = adjustColor(baseColor, 10); // Lighter version

      gradient.addColorStop(0, lighterColor);
      gradient.addColorStop(1, darkerColor);

      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.95;

      // Create layer points
      const layerTop = [];
      const layerBottom = [];

      // Create points across the width - more points for smoother curves
      for (let x = -20; x <= 20; x += 0.5) {
        // Add some natural variation to layer boundaries
        let depthVariation = 0;

        if (layer.texture === "rough") {
          depthVariation = Math.sin(x * 0.5) * 0.3;
        } else if (layer.texture === "grainy") {
          depthVariation = (Math.random() - 0.5) * 0.2;
        } else if (layer.texture === "layered") {
          depthVariation = Math.sin(x * 2) * 0.1;
        }

        // Top of layer
        layerTop.push(
          project3DPoint(
            x,
            -nextLayer.depth + depthVariation,
            -15,
            centerX,
            centerY,
            gridSize,
            rotation,
          ),
        );

        // Bottom of layer
        layerBottom.push(
          project3DPoint(
            x,
            -layer.depth + depthVariation * 0.5, // Less variation at deeper levels
            -15,
            centerX,
            centerY,
            gridSize,
            rotation,
          ),
        );
      }

      // Draw the layer with smooth curves
      ctx.beginPath();

      // Draw top edge with curve
      ctx.moveTo(layerTop[0].x, layerTop[0].y);

      // Use bezier curves for smoother appearance
      for (let j = 0; j < layerTop.length - 1; j += 3) {
        if (j + 3 < layerTop.length) {
          const cp1x = layerTop[j + 1].x;
          const cp1y = layerTop[j + 1].y;
          const cp2x = layerTop[j + 2].x;
          const cp2y = layerTop[j + 2].y;
          const x = layerTop[j + 3].x;
          const y = layerTop[j + 3].y;

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        } else {
          // Handle remaining points
          for (let k = j + 1; k < layerTop.length; k++) {
            ctx.lineTo(layerTop[k].x, layerTop[k].y);
          }
        }
      }

      // Draw bottom edge in reverse with curves
      for (let j = layerBottom.length - 1; j >= 0; j -= 3) {
        if (j - 3 >= 0) {
          const cp1x = layerBottom[j - 1].x;
          const cp1y = layerBottom[j - 1].y;
          const cp2x = layerBottom[j - 2].x;
          const cp2y = layerBottom[j - 2].y;
          const x = layerBottom[j - 3].x;
          const y = layerBottom[j - 3].y;

          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        } else {
          // Handle remaining points
          for (let k = j - 1; k >= 0; k--) {
            ctx.lineTo(layerBottom[k].x, layerBottom[k].y);
          }
        }
      }

      ctx.closePath();
      ctx.fill();

      // Add texture effects based on layer type
      if (i > 0) {
        // Add subtle texture patterns
        if (layer.texture === "grainy") {
          addGrainyTexture(
            ctx,
            layerTop[0].x,
            layerTop[0].y,
            layerBottom[layerBottom.length - 1].x,
            layerBottom[0].y,
          );
        } else if (layer.texture === "layered") {
          addLayeredTexture(ctx, layerTop, layerBottom);
        } else if (layer.texture === "rough") {
          addRoughTexture(
            ctx,
            layerTop[0].x,
            layerTop[0].y,
            layerBottom[layerBottom.length - 1].x,
            layerBottom[0].y,
          );
        }

        // Add subtle edge highlight
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(layerTop[0].x, layerTop[0].y);
        for (let j = 1; j < layerTop.length; j++) {
          ctx.lineTo(layerTop[j].x, layerTop[j].y);
        }
        ctx.stroke();

        // Add subtle bottom shadow
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(layerBottom[0].x, layerBottom[0].y);
        for (let j = 1; j < layerBottom.length; j++) {
          ctx.lineTo(layerBottom[j].x, layerBottom[j].y);
        }
        ctx.stroke();

        // Add layer name with enhanced styling
        if (layer.depth - nextLayer.depth > 3) {
          const labelPoint = project3DPoint(
            -12,
            -(nextLayer.depth + (layer.depth - nextLayer.depth) / 2),
            -15,
            centerX,
            centerY,
            gridSize,
            rotation,
          );

          // Add text shadow for better readability
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.font = "bold 10px monospace";
          ctx.fillText(layer.name, labelPoint.x + 1, labelPoint.y + 1);

          // Main text
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = 0.9;
          ctx.fillText(layer.name, labelPoint.x, labelPoint.y);
        }
      }

      ctx.restore();
    }
  };

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number): string => {
    // Parse hex color
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Adjust and clamp values
    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    return `#${Math.round(newR).toString(16).padStart(2, "0")}${Math.round(newG).toString(16).padStart(2, "0")}${Math.round(newB).toString(16).padStart(2, "0")}`;
  };

  // Add grainy texture to layer
  const addGrainyTexture = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#ffffff";

    // Add random dots
    for (let i = 0; i < 100; i++) {
      const x = x1 + Math.random() * (x2 - x1);
      const y = y1 + Math.random() * (y2 - y1);
      const size = Math.random() * 0.8;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Add layered texture to shale
  const addLayeredTexture = (
    ctx: CanvasRenderingContext2D,
    topPoints: { x: number; y: number }[],
    bottomPoints: { x: number; y: number }[],
  ) => {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.3;

    // Calculate layer height
    const height = bottomPoints[0].y - topPoints[0].y;
    const layers = 5; // Number of internal layers

    // Draw horizontal lines
    for (let i = 1; i < layers; i++) {
      const yOffset = (height * i) / layers;

      ctx.beginPath();
      for (let j = 0; j < topPoints.length; j += 3) {
        const x = topPoints[j].x;
        const y = topPoints[j].y + yOffset;

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  // Add rough texture to bedrock
  const addRoughTexture = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ) => {
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 0.4;

    // Add jagged lines
    for (let i = 0; i < 8; i++) {
      const yPos = y1 + (y2 - y1) * (i / 8);

      ctx.beginPath();
      ctx.moveTo(x1, yPos);

      let x = x1;
      while (x < x2) {
        x += 5 + Math.random() * 10;
        const yOffset = (Math.random() - 0.5) * 3;
        ctx.lineTo(x, yPos + yOffset);
      }

      ctx.stroke();
    }

    ctx.restore();
  };

  // Draw oil rig at surface - enhanced for more detail
  const drawOilRig = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    gridSize: number,
    rotation: { x: number; y: number },
  ) => {
    // Position the rig at the wellhead (0,0,0)
    const rigBasePoint = project3DPoint(
      0,
      0,
      0,
      centerX,
      centerY,
      gridSize,
      rotation,
    );

    // Draw rig base - larger and more detailed
    ctx.fillStyle = "#444444";
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;

    // Base platform
    ctx.beginPath();
    ctx.rect(rigBasePoint.x - 30, rigBasePoint.y - 15, 60, 30);
    ctx.fill();
    ctx.stroke();

    // Add platform details
    ctx.fillStyle = "#555555";
    ctx.beginPath();
    ctx.rect(rigBasePoint.x - 25, rigBasePoint.y - 10, 50, 20);
    ctx.fill();
    ctx.stroke();

    // Draw derrick - taller and more detailed
    ctx.beginPath();
    // Left leg
    ctx.moveTo(rigBasePoint.x - 20, rigBasePoint.y - 15);
    ctx.lineTo(rigBasePoint.x - 15, rigBasePoint.y - 90);
    // Right leg
    ctx.moveTo(rigBasePoint.x + 20, rigBasePoint.y - 15);
    ctx.lineTo(rigBasePoint.x + 15, rigBasePoint.y - 90);
    // Top
    ctx.moveTo(rigBasePoint.x - 15, rigBasePoint.y - 90);
    ctx.lineTo(rigBasePoint.x + 15, rigBasePoint.y - 90);

    // Cross supports - more of them for detail
    for (let i = 1; i <= 4; i++) {
      const y = rigBasePoint.y - 15 - i * 18;
      ctx.moveTo(rigBasePoint.x - 20 + i * 1, rigBasePoint.y - 15);
      ctx.lineTo(rigBasePoint.x + 20 - i * 1, y);
      ctx.moveTo(rigBasePoint.x + 20 - i * 1, rigBasePoint.y - 15);
      ctx.lineTo(rigBasePoint.x - 20 + i * 1, y);
    }

    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw rig floor
    ctx.fillStyle = "#555555";
    ctx.beginPath();
    ctx.rect(rigBasePoint.x - 25, rigBasePoint.y - 25, 50, 10);
    ctx.fill();
    ctx.stroke();

    // Draw crown block at top
    ctx.fillStyle = "#666666";
    ctx.beginPath();
    ctx.rect(rigBasePoint.x - 15, rigBasePoint.y - 95, 30, 5);
    ctx.fill();

    // Draw traveling block
    ctx.fillStyle = "#777777";
    ctx.beginPath();
    ctx.rect(rigBasePoint.x - 10, rigBasePoint.y - 70, 20, 10);
    ctx.fill();
    ctx.stroke();

    // Draw drill line from top of derrick - multiple lines for detail
    ctx.beginPath();
    // Main line
    ctx.moveTo(rigBasePoint.x, rigBasePoint.y - 90);
    ctx.lineTo(rigBasePoint.x, rigBasePoint.y - 70);
    // Line from traveling block to surface
    ctx.moveTo(rigBasePoint.x, rigBasePoint.y - 60);
    ctx.lineTo(rigBasePoint.x, rigBasePoint.y);
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw drill pipe
    ctx.beginPath();
    ctx.moveTo(rigBasePoint.x, rigBasePoint.y);
    // Draw pipe going into the ground
    const depthPoint = project3DPoint(
      0,
      -2,
      0,
      centerX,
      centerY,
      gridSize,
      rotation,
    );
    ctx.lineTo(depthPoint.x, depthPoint.y);
    ctx.strokeStyle = "#aaaaaa";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Add glow to indicate active drilling
    ctx.beginPath();
    ctx.arc(rigBasePoint.x, rigBasePoint.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#00aaff";
    ctx.fill();

    // Add glow effect
    ctx.shadowColor = "#00aaff80";
    ctx.shadowBlur = 1;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Add small equipment around the rig
    // Mud pumps
    ctx.fillStyle = "#666666";
    ctx.beginPath();
    ctx.rect(rigBasePoint.x - 50, rigBasePoint.y - 10, 15, 20);
    ctx.fill();
    ctx.stroke();

    // Mud tanks
    ctx.fillStyle = "#555555";
    ctx.beginPath();
    ctx.rect(rigBasePoint.x + 40, rigBasePoint.y - 5, 25, 15);
    ctx.fill();
    ctx.stroke();
  };

  // Empty function for axes - removed as requested
  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    rotation: { x: number; y: number },
  ) => {
    // Axes removed as requested
  };

  // Generate gamma data for visualization
  const generateGammaData = (pathData: any[]) => {
    return pathData.map((point) => {
      // Generate gamma values based on depth
      let gamma = 50;
      if (point.tvd > 8000) {
        // Shale formation (high gamma)
        gamma = 80 + Math.random() * 40;
      } else if (point.tvd > 7500) {
        // Sandstone (low gamma)
        gamma = 20 + Math.random() * 15;
      } else if (point.tvd > 7000) {
        // Limestone (medium gamma)
        gamma = 40 + Math.random() * 20;
      } else if (point.tvd > 6500) {
        // Shale again
        gamma = 90 + Math.random() * 30;
      } else if (point.tvd > 6000) {
        // Sandstone again
        gamma = 15 + Math.random() * 10;
      } else {
        // Mixed formation
        gamma = 50 + Math.random() * 25;
      }
      return { ...point, gamma };
    });
  };

  // Generate vibration data for visualization
  const generateVibrationData = (pathData: any[]) => {
    return pathData.map((point) => {
      // Generate vibration values - higher in certain sections
      let vibration = 0;
      if (point.tvd > 7800 && point.tvd < 8200) {
        vibration = 70 + Math.random() * 30; // High vibration zone
      } else if (point.tvd > 6300 && point.tvd < 6700) {
        vibration = 60 + Math.random() * 30; // Medium-high vibration zone
      } else if (point.md % 500 < 100) {
        // Periodic high vibration at connections
        vibration = 50 + Math.random() * 40;
      } else {
        vibration = Math.random() * 30; // Normal background vibration
      }
      return { ...point, vibration };
    });
  };

  // Draw well path with enhanced drill string visualization
  const drawWellPath = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pathData: any[],
    rotation: { x: number; y: number },
    color: string,
    lineWidth: number,
    zoomFactor: number,
  ) => {
    const centerX = width / 2;
    const centerY = height / 3; // Adjusted to match grid center
    const scale = Math.min(width, height) * 0.6 * zoomFactor; // Larger scale to match grid

    // Add gamma and vibration data
    const enhancedPathData = generateVibrationData(generateGammaData(pathData));

    // Draw gamma heatmap first (as background)
    drawGammaHeatmap(
      ctx,
      width,
      height,
      enhancedPathData,
      rotation,
      scale,
      centerX,
      centerY,
    );

    // Draw drill string segments with consistent coloring (no vibration colors)
    enhancedPathData.forEach((point, index) => {
      if (index === 0) return; // Skip first point (need pairs for segments)

      // Get current and previous points
      const prevPoint = enhancedPathData[index - 1];

      // Scale the coordinates to fit the canvas
      const x1 = prevPoint.ew / 100;
      const y1 = -prevPoint.tvd / 100;
      const z1 = prevPoint.ns / 100;

      const x2 = point.ew / 100;
      const y2 = -point.tvd / 100;
      const z2 = point.ns / 100;

      const projectedPoint1 = project3DPoint(
        x1,
        y1,
        z1,
        centerX,
        centerY,
        scale,
        rotation,
      );
      const projectedPoint2 = project3DPoint(
        x2,
        y2,
        z2,
        centerX,
        centerY,
        scale,
        rotation,
      );

      // Use consistent color instead of vibration-based coloring
      const segmentColor = color;

      // Draw drill pipe segment with consistent color
      ctx.save();
      ctx.strokeStyle = segmentColor;
      ctx.lineWidth = lineWidth * 3; // Thicker for better visibility
      ctx.beginPath();
      ctx.moveTo(projectedPoint1.x, projectedPoint1.y);
      ctx.lineTo(projectedPoint2.x, projectedPoint2.y);
      ctx.stroke();

      // Add very subtle glow effect
      ctx.shadowColor = segmentColor + "88";
      ctx.shadowBlur = 3;
      ctx.stroke();
      ctx.restore();

      // Draw drill pipe connections every 90 feet (3 survey points)
      if (index % 3 === 0) {
        ctx.save();
        ctx.fillStyle = "#aaaaaa";
        ctx.strokeStyle = "#888888";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
          projectedPoint2.x,
          projectedPoint2.y,
          lineWidth * 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Draw survey points with enhanced depth labels
      if (index % 10 === 0) {
        ctx.save();
        // Draw survey marker with glowing effect
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

        // Add inner circle
        ctx.fillStyle = "#00aaff";
        ctx.beginPath();
        ctx.arc(projectedPoint2.x, projectedPoint2.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Add depth label with better visibility
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `${point.md.toFixed(0)}'`,
          projectedPoint2.x,
          projectedPoint2.y - 12,
        );

        // Add inclination and azimuth
        ctx.font = "9px monospace";
        ctx.fillText(
          `${point.inc.toFixed(1)}° / ${point.az.toFixed(0)}°`,
          projectedPoint2.x,
          projectedPoint2.y - 24,
        );
        ctx.restore();
      }
    });

    // Add bit at the end of the drill string
    if (enhancedPathData.length > 0) {
      const lastPoint = enhancedPathData[enhancedPathData.length - 1];
      const x = lastPoint.ew / 100;
      const y = -lastPoint.tvd / 100;
      const z = lastPoint.ns / 100;

      const projectedBit = project3DPoint(
        x,
        y,
        z,
        centerX,
        centerY,
        scale,
        rotation,
      );

      // Draw drill bit
      ctx.save();
      // Outer glow
      const bitGradient = ctx.createRadialGradient(
        projectedBit.x,
        projectedBit.y,
        0,
        projectedBit.x,
        projectedBit.y,
        12,
      );
      bitGradient.addColorStop(0, "#00eeff");
      bitGradient.addColorStop(0.6, "#0088ff80");
      bitGradient.addColorStop(1, "#0044ff00");

      ctx.fillStyle = bitGradient;
      ctx.beginPath();
      ctx.arc(projectedBit.x, projectedBit.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Bit body
      ctx.fillStyle = "#dddddd";
      ctx.strokeStyle = "#aaaaaa";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(projectedBit.x, projectedBit.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Add pulsating effect
      ctx.shadowColor = "#00aaff";
      ctx.shadowBlur = 1;
      ctx.beginPath();
      ctx.arc(projectedBit.x, projectedBit.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  // Draw gamma heatmap - enhanced for side view with full space coloring
  const drawGammaHeatmap = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pathData: any[],
    rotation: { x: number; y: number },
    scale: number,
    centerX: number,
    centerY: number,
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

    // First, color the entire underground space with a gradient based on depth
    const drawUndergroundGammaGradient = () => {
      // Create a gradient that spans the entire underground area
      const surfaceY = centerY; // Surface level Y coordinate

      // Create multiple gradient zones for different formations
      const formations = [
        { depth: 0, color: "rgba(0,255,136,0.05)" }, // Surface - light green
        { depth: height * 0.2, color: "rgba(255,170,0,0.1)" }, // Medium depth - light orange
        { depth: height * 0.4, color: "rgba(255,0,136,0.15)" }, // Deep - light pink
        { depth: height * 0.7, color: "rgba(0,0,0,0.1)" }, // Very deep - fade to black
      ];

      // Draw each formation layer as a rectangle
      for (let i = 0; i < formations.length - 1; i++) {
        const gradient = ctx.createLinearGradient(
          0,
          surfaceY + formations[i].depth,
          0,
          surfaceY + formations[i + 1].depth,
        );

        gradient.addColorStop(0, formations[i].color);
        gradient.addColorStop(1, formations[i + 1].color);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          0,
          surfaceY + formations[i].depth,
          width,
          formations[i + 1].depth - formations[i].depth,
        );
      }
    };

    // Draw the underground gradient first
    drawUndergroundGammaGradient();

    // Process path data points
    pathData.forEach((point) => {
      const x = point.ew / 100;
      const y = -point.tvd / 100;
      const z = point.ns / 100;

      const projectedPoint = project3DPoint(
        x,
        y,
        z,
        centerX,
        centerY,
        scale,
        rotation,
      );

      // Store original TVD and gamma value with the projected point
      const enhancedPoint = {
        ...projectedPoint,
        tvd: point.tvd,
        gamma: point.gamma,
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
            >
              <ZoomIn className="h-4 w-4 text-gray-300" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-gray-800/80 border-gray-700 hover:bg-gray-700/80 rounded-md transition-all duration-200 shadow-md"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4 text-gray-300" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-gray-800/80 border-gray-700 hover:bg-gray-700/80 rounded-md transition-all duration-200 shadow-md"
              onClick={onExport}
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
          />

          {/* Survey navigation controls - modernized */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-gray-800/90 border-cyan-900/50 hover:bg-cyan-900/30 hover:border-cyan-800 rounded-md shadow-lg transition-all duration-200"
              onClick={() =>
                setCurrentSurveyIndex((prev) => Math.max(prev - 1, 0))
              }
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
            >
              <ArrowDown className="h-5 w-5 text-cyan-300" />
            </Button>
          </div>

          {/* Instructions overlay - moved outside the plot */}
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

          {/* Heat map and vibration legend - moved outside the plot */}
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
                  <span className="text-green-400 text-[9px] font-mono">
                    &lt;30%
                  </span>
                </div>
                <div className="flex flex-col items-center bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 mb-1 shadow-glow-yellow"></div>
                  <span className="text-gray-300 text-[10px]">Moderate</span>
                  <span className="text-yellow-400 text-[9px] font-mono">
                    30-60%
                  </span>
                </div>
                <div className="flex flex-col items-center bg-gray-800/50 rounded-md p-1.5 border border-gray-700">
                  <div className="w-4 h-4 rounded-full bg-red-500 mb-1 shadow-glow-red"></div>
                  <span className="text-gray-300 text-[10px]">Severe</span>
                  <span className="text-red-400 text-[9px] font-mono">
                    &gt;60%
                  </span>
                </div>
              </div>

              <div className="text-gray-200 font-medium mt-3 mb-1 border-b border-gray-800 pb-1 flex items-center">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div>
                <span className="tracking-wider uppercase">Bit Depth</span>
              </div>
              <div className="bg-gray-800/80 rounded-md p-2 border border-cyan-900/50 text-center">
                <div className="text-lg text-cyan-300 font-mono font-bold tracking-wider">
                  {surveys[currentSurveyIndex]?.md.toFixed(1)} ft
                </div>
                <div className="text-[10px] text-gray-400">
                  Current Survey: {currentSurveyIndex + 1} of {surveys.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellTrajectory3DInteractive;
