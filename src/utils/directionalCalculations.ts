/**
 * Advanced directional drilling calculations
 */

/**
 * Calculate motor yield (degrees per 100ft)
 * @param slideDistance - Distance slid in feet
 * @param bendAngle - Bend angle in degrees
 * @param bitToBendDistance - Distance from bit to bend in feet
 */
export const calculateMotorYield = (
  slideDistance: number,
  bendAngle: number,
  bitToBendDistance: number,
): number => {
  // Motor yield is the rate of angle change per 100ft of sliding
  const effectiveBend =
    bendAngle * (slideDistance / (slideDistance + bitToBendDistance));
  return (effectiveBend / slideDistance) * 100;
};

/**
 * Calculate dogleg severity (degrees per 100ft)
 * @param inc1 - Initial inclination in degrees
 * @param azi1 - Initial azimuth in degrees
 * @param inc2 - Final inclination in degrees
 * @param azi2 - Final azimuth in degrees
 * @param courseLength - Course length in feet
 */
export const calculateDoglegSeverity = (
  inc1: number,
  azi1: number,
  inc2: number,
  azi2: number,
  courseLength: number,
): number => {
  // Convert to radians
  const inc1Rad = (inc1 * Math.PI) / 180;
  const azi1Rad = (azi1 * Math.PI) / 180;
  const inc2Rad = (inc2 * Math.PI) / 180;
  const azi2Rad = (azi2 * Math.PI) / 180;

  // Calculate dogleg angle using the minimum curvature method
  const cosInc = Math.cos(inc1Rad) * Math.cos(inc2Rad);
  const sinInc = Math.sin(inc1Rad) * Math.sin(inc2Rad);
  const cosAzi = Math.cos(azi1Rad - azi2Rad);
  const doglegAngle = Math.acos(cosInc + sinInc * cosAzi);

  // Convert to degrees and calculate severity per 100ft
  const doglegDegrees = (doglegAngle * 180) / Math.PI;
  return (doglegDegrees / courseLength) * 100;
};

/**
 * Calculate slide seen (degrees)
 * @param motorYield - Motor yield in degrees per 100ft
 * @param slideDistance - Distance slid in feet
 * @param isRotating - Boolean indicating if the tool is rotating
 */
export const calculateSlideSeen = (
  motorYield: number,
  slideDistance: number,
  isRotating: boolean = false,
): number => {
  // If rotating, no slide is seen
  if (isRotating) {
    return 0;
  }
  // If sliding, calculate normally
  return (motorYield * slideDistance) / 100;
};

/**
 * Calculate slide ahead (degrees)
 * @param motorYield - Motor yield in degrees per 100ft
 * @param slideDistance - Distance slid in feet
 * @param bitToBendDistance - Distance from bit to bend in feet
 * @param isRotating - Boolean indicating if the tool is rotating
 */
export const calculateSlideAhead = (
  motorYield: number,
  slideDistance: number,
  bitToBendDistance: number,
  isRotating: boolean = false,
): number => {
  // If rotating, no slide ahead is expected
  if (isRotating) {
    return 0;
  }
  // If sliding, calculate normally
  // Slide ahead is the angle change that will occur after the current position
  // due to the bend being ahead of the bit
  const totalAngleChange = (motorYield * slideDistance) / 100;
  const proportionAhead =
    bitToBendDistance / (slideDistance + bitToBendDistance);
  return totalAngleChange * proportionAhead;
};

/**
 * Calculate projected inclination
 * @param currentInc - Current inclination in degrees
 * @param buildRate - Build rate in degrees per 100ft
 * @param distance - Distance to project in feet
 */
export const calculateProjectedInclination = (
  currentInc: number,
  buildRate: number,
  distance: number,
): number => {
  return currentInc + (buildRate * distance) / 100;
};

/**
 * Calculate projected azimuth
 * @param currentAz - Current azimuth in degrees
 * @param turnRate - Turn rate in degrees per 100ft
 * @param distance - Distance to project in feet
 */
export const calculateProjectedAzimuth = (
  currentAz: number,
  turnRate: number,
  distance: number,
): number => {
  const projectedAz = currentAz + (turnRate * distance) / 100;
  // Normalize to 0-360 range
  return ((projectedAz % 360) + 360) % 360;
};

/**
 * Calculate dogleg needed to hit target
 * @param currentInc - Current inclination in degrees
 * @param currentAz - Current azimuth in degrees
 * @param targetInc - Target inclination in degrees
 * @param targetAz - Target azimuth in degrees
 * @param distance - Distance to target in feet
 */
export const calculateDoglegNeeded = (
  currentInc: number,
  currentAz: number,
  targetInc: number,
  targetAz: number,
  distance: number,
): number => {
  // Convert to radians
  const inc1Rad = (currentInc * Math.PI) / 180;
  const azi1Rad = (currentAz * Math.PI) / 180;
  const inc2Rad = (targetInc * Math.PI) / 180;
  const azi2Rad = (targetAz * Math.PI) / 180;

  // Calculate dogleg angle
  const cosInc = Math.cos(inc1Rad) * Math.cos(inc2Rad);
  const sinInc = Math.sin(inc1Rad) * Math.sin(inc2Rad);
  const cosAzi = Math.cos(azi1Rad - azi2Rad);
  const doglegAngle = Math.acos(cosInc + sinInc * cosAzi);

  // Convert to degrees and calculate severity per 100ft
  const doglegDegrees = (doglegAngle * 180) / Math.PI;
  return (doglegDegrees / distance) * 100;
};

/**
 * Calculate nudge projection
 * @param currentInc - Current inclination in degrees
 * @param currentAz - Current azimuth in degrees
 * @param toolFace - Tool face angle in degrees
 * @param motorYield - Motor yield in degrees per 100ft
 * @param slideDistance - Slide distance in feet
 */
export const calculateNudgeProjection = (
  currentInc: number,
  currentAz: number,
  toolFace: number,
  motorYield: number,
  slideDistance: number,
): { projectedInc: number; projectedAz: number } => {
  // Convert to radians
  const incRad = (currentInc * Math.PI) / 180;
  const aziRad = (currentAz * Math.PI) / 180;
  const tfRad = (toolFace * Math.PI) / 180;

  // Calculate dogleg angle for the slide
  const doglegAngle = (motorYield * slideDistance) / 100;
  const doglegRad = (doglegAngle * Math.PI) / 180;

  // Calculate inclination change
  const incChange = Math.cos(tfRad) * doglegAngle;
  const projectedInc = currentInc + incChange;

  // Calculate azimuth change (more complex due to spherical geometry)
  let aziChange = 0;
  if (currentInc > 0.1) {
    // Avoid division by zero or near-zero
    aziChange = (Math.sin(tfRad) * doglegRad) / Math.sin(incRad);
  }
  let projectedAz = currentAz + (aziChange * 180) / Math.PI;

  // Normalize azimuth to 0-360 range
  projectedAz = ((projectedAz % 360) + 360) % 360;

  return { projectedInc, projectedAz };
};
