import React, { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, Download, Maximize2, RotateCw } from "lucide-react";

interface WellTrajectory3DProps {
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

const WellTrajectory3D = ({
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
}: WellTrajectory3DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = React.useState({ x: 0.5, y: 0.3 });
  const [isRotating, setIsRotating] = React.useState(true);

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
        ns += horizontalDistance * Math.cos(radAz) + (Math.random() - 0.5) * randomFactor;
        ew += horizontalDistance * Math.sin(radAz) + (Math.random() - 0.5) * randomFactor;
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

  // Draw the 3D trajectory
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    if (containerRef.current) {
      canvas.width = containerRef.current.offsetWidth;
      canvas.height = containerRef.current.offsetHeight;
    }

    // Clear canvas
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height, rotation);

    // Draw axes
    drawAxes(ctx, canvas.width, canvas.height, rotation);

    // Draw offset wells
    offsetWells.forEach(well => {
      drawWellPath(ctx, canvas.width, canvas.height, well.surveys, rotation, well.color, 1);
    });

    // Draw main well path
    drawWellPath(ctx, canvas.width, canvas.height, surveys, rotation, '#00aaff', 2);

    // Auto-rotation
    if (isRotating) {
      const rotationTimer = setTimeout(() => {
        setRotation(prev => ({
          x: prev.x + 0.005,
          y: prev.y + 0.002
        }));
      }, 50);

      return () => clearTimeout(rotationTimer);
    }
  }, [surveys, offsetWells, rotation, isRotating]);

  // Draw grid lines
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, rotation: {x: number, y: number}) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const gridSize = Math.min(width, height) * 0.8;
    const gridStep = gridSize / 10;

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;

    // Draw horizontal grid lines (X-Z plane)
    for (let z = -5; z <= 5; z++) {
      const startPoint = project3DPoint(-5, 0, z, centerX, centerY, gridSize, rotation);
      const endPoint = project3DPoint(5, 0, z,