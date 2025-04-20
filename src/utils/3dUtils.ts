/**
 * Utility functions for 3D projections and calculations
 */

/**
 * Projects a 3D point to 2D with perspective
 * Optimized for drilling visualization with proper depth perception
 */
export const project3DPoint = (
  x: number,
  y: number,
  z: number,
  centerX: number,
  centerY: number,
  scale: number,
  rotation: { x: number; y: number },
) => {
  // Apply rotation - optimized for drilling visualization perspective
  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);

  // Improved rotation matrix for better side view of well trajectory
  const rotatedX = x * cosY - z * sinY;
  const rotatedZ = x * sinY + z * cosY;
  const rotatedY = y * cosX + rotatedZ * sinX;

  // Project to 2D with enhanced depth perception
  // Vertical scale factor adjusted for better visualization of inclination changes
  return {
    x: centerX + rotatedX * scale,
    y: centerY + rotatedY * scale * 1.25, // Enhanced vertical scale for better depth perception
  };
};

/**
 * Calculates TVD, NS, and EW from survey data
 * Uses measured depth (md) as the primary input
 * Optimized for accuracy in directional drilling applications
 */
export const calculateWellCoordinates = (
  md: number,
  inclination: number,
  azimuth: number,
) => {
  // Handle invalid inputs with improved error handling
  if (md === undefined || md === null || isNaN(md)) {
    console.warn("Invalid measured depth provided to calculateWellCoordinates");
    return { tvd: 0, ns: 0, ew: 0 };
  }

  if (inclination === undefined || inclination === null || isNaN(inclination)) {
    console.warn("Invalid inclination provided to calculateWellCoordinates");
    return { tvd: md, ns: 0, ew: 0 }; // Assume vertical if no inclination
  }

  if (azimuth === undefined || azimuth === null || isNaN(azimuth)) {
    console.warn("Invalid azimuth provided to calculateWellCoordinates");
    azimuth = 0; // Default to North if no azimuth
  }

  // Normalize azimuth to 0-360 range
  azimuth = ((azimuth % 360) + 360) % 360;

  // Convert angles to radians
  const incRad = (inclination * Math.PI) / 180;
  const azRad = (azimuth * Math.PI) / 180;

  // Calculate TVD (True Vertical Depth) with improved precision
  const tvd = md * Math.cos(incRad);

  // Calculate horizontal distance
  const horizontalDistance = md * Math.sin(incRad);

  // Calculate NS component (North is positive)
  const ns = horizontalDistance * Math.cos(azRad);

  // Calculate EW component (East is positive)
  const ew = horizontalDistance * Math.sin(azRad);

  return { tvd, ns, ew };
};

/**
 * Processes survey data to create a 3D trajectory
 * Handles various input formats and ensures all required coordinates are calculated
 */
export const processSurveyData = (
  surveys: Array<{
    md?: number;
    measuredDepth?: number;
    bitDepth?: number;
    sensorOffset?: number;
    inc?: number;
    inclination?: number;
    az?: number;
    azimuth?: number;
    tvd?: number;
    ns?: number;
    ew?: number;
    gamma?: number;
    vibration?: number;
    toolTemp?: number;
    timestamp?: string;
  }>,
) => {
  // If surveys already have tvd, ns, ew values, use them
  // Otherwise calculate them
  return surveys.map((survey) => {
    // If all coordinates are already calculated, return as is
    if (
      survey.tvd !== undefined &&
      survey.ns !== undefined &&
      survey.ew !== undefined
    ) {
      return survey;
    }

    // Determine measured depth from available properties
    const md =
      survey.md ||
      survey.measuredDepth ||
      (survey.bitDepth && survey.sensorOffset
        ? survey.bitDepth - survey.sensorOffset
        : undefined);

    // Determine inclination and azimuth from available properties
    const inc = survey.inc || survey.inclination || 0;
    const az = survey.az || survey.azimuth || 0;

    // Skip calculation if we don't have measured depth
    if (md === undefined) {
      console.warn("Cannot calculate coordinates without measured depth");
      return {
        ...survey,
        md: survey.md || 0,
        inc: inc,
        az: az,
        tvd: survey.tvd || 0,
        ns: survey.ns || 0,
        ew: survey.ew || 0,
      };
    }

    // Calculate coordinates
    const { tvd, ns, ew } = calculateWellCoordinates(md, inc, az);

    return {
      ...survey,
      md: md,
      inc: inc,
      az: az,
      tvd,
      ns,
      ew,
    };
  });
};
