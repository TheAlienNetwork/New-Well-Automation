/**
 * Advanced directional drilling calculations
 */

/**
 * Calculate motor yield (degrees per 100ft)
 * @param currentInc - Current inclination in degrees
 * @param previousInc - Previous inclination in degrees
 * @param bitToBitDistance - Distance between bit positions in feet
 * @param slideDistance - Distance slid in feet (optional, for legacy calculation)
 * @param bendAngle - Bend angle in degrees (optional, for legacy calculation)
 * @param bitToBendDistance - Distance from bit to bend in feet (optional, for legacy calculation)
 */
export const calculateMotorYield = (
  currentInc?: number,
  previousInc?: number,
  bitToBitDistance?: number,
  slideDistance?: number,
  bendAngle?: number,
  bitToBendDistance?: number,
): number => {
  // If we have survey data, use the more accurate calculation
  if (
    typeof currentInc === "number" &&
    typeof previousInc === "number" &&
    typeof bitToBitDistance === "number" &&
    !isNaN(currentInc) &&
    !isNaN(previousInc) &&
    !isNaN(bitToBitDistance) &&
    isFinite(currentInc) &&
    isFinite(previousInc) &&
    isFinite(bitToBitDistance) &&
    bitToBitDistance > 0
  ) {
    // Motor yield = (Current Incl − Previous Incl) ÷ Bit-to-Bit Distance × 100
    const inclinationChange = Math.abs(currentInc - previousInc);
    return (inclinationChange / bitToBitDistance) * 100;
  }

  // Legacy calculation if survey data is not available
  if (
    typeof slideDistance === "number" &&
    typeof bendAngle === "number" &&
    typeof bitToBendDistance === "number" &&
    !isNaN(slideDistance) &&
    !isNaN(bendAngle) &&
    !isNaN(bitToBendDistance) &&
    isFinite(slideDistance) &&
    isFinite(bendAngle) &&
    isFinite(bitToBendDistance) &&
    slideDistance > 0
  ) {
    // Motor yield is the rate of angle change per 100ft of sliding
    const effectiveBend =
      bendAngle * (slideDistance / (slideDistance + bitToBendDistance));
    return (effectiveBend / slideDistance) * 100;
  }

  // Default value if no valid inputs
  return 2.5; // Standard default motor yield
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
  // Validate inputs
  if (
    typeof inc1 !== "number" ||
    typeof azi1 !== "number" ||
    typeof inc2 !== "number" ||
    typeof azi2 !== "number" ||
    typeof courseLength !== "number" ||
    isNaN(inc1) ||
    isNaN(azi1) ||
    isNaN(inc2) ||
    isNaN(azi2) ||
    isNaN(courseLength) ||
    !isFinite(inc1) ||
    !isFinite(azi1) ||
    !isFinite(inc2) ||
    !isFinite(azi2) ||
    !isFinite(courseLength) ||
    courseLength <= 0
  ) {
    return 0; // Return 0 if inputs are invalid
  }

  try {
    // Convert to radians
    const inc1Rad = (inc1 * Math.PI) / 180;
    const azi1Rad = (azi1 * Math.PI) / 180;
    const inc2Rad = (inc2 * Math.PI) / 180;
    const azi2Rad = (azi2 * Math.PI) / 180;

    // Calculate dogleg angle using the minimum curvature method
    const cosInc = Math.cos(inc1Rad) * Math.cos(inc2Rad);
    const sinInc = Math.sin(inc1Rad) * Math.sin(inc2Rad);
    const cosAzi = Math.cos(azi1Rad - azi2Rad);

    // Ensure the value for acos is within valid range (-1 to 1)
    const cosValue = cosInc + sinInc * cosAzi;
    const clampedCosValue = Math.max(-1, Math.min(1, cosValue));
    const doglegAngle = Math.acos(clampedCosValue);

    // Convert to degrees and calculate severity per 100ft
    const doglegDegrees = (doglegAngle * 180) / Math.PI;
    return (doglegDegrees / courseLength) * 100;
  } catch (error) {
    console.error("Error calculating dogleg severity:", error);
    return 0;
  }
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
  // Validate inputs
  if (
    typeof motorYield !== "number" ||
    typeof slideDistance !== "number" ||
    isNaN(motorYield) ||
    isNaN(slideDistance) ||
    !isFinite(motorYield) ||
    !isFinite(slideDistance)
  ) {
    return 0; // Return 0 if inputs are invalid
  }

  try {
    // If rotating, no slide is seen
    if (isRotating) {
      return 0;
    }
    // If sliding, calculate normally
    return (motorYield * slideDistance) / 100;
  } catch (error) {
    console.error("Error calculating slide seen:", error);
    return 0;
  }
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
  // Validate inputs
  if (
    typeof motorYield !== "number" ||
    typeof slideDistance !== "number" ||
    typeof bitToBendDistance !== "number" ||
    isNaN(motorYield) ||
    isNaN(slideDistance) ||
    isNaN(bitToBendDistance) ||
    !isFinite(motorYield) ||
    !isFinite(slideDistance) ||
    !isFinite(bitToBendDistance)
  ) {
    return 0; // Return 0 if inputs are invalid
  }

  try {
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
  } catch (error) {
    console.error("Error calculating slide ahead:", error);
    return 0;
  }
};

/**
 * Calculate above/below (feet)
 * @param actualTVD - Actual TVD in feet
 * @param targetTVD - Target TVD in feet at the same VS or inclination
 */
export const calculateAboveBelow = (
  actualTVD: number,
  targetTVD: number,
): number => {
  // Validate inputs
  if (
    typeof actualTVD !== "number" ||
    typeof targetTVD !== "number" ||
    isNaN(actualTVD) ||
    isNaN(targetTVD) ||
    !isFinite(actualTVD) ||
    !isFinite(targetTVD)
  ) {
    return 0; // Return 0 if inputs are invalid
  }

  try {
    // Above/Below = Actual TVD − Target TVD
    // Positive value means above target (shallower), negative means below target (deeper)
    return targetTVD - actualTVD;
  } catch (error) {
    console.error("Error calculating above/below:", error);
    return 0;
  }
};

/**
 * Calculate left/right (feet)
 * @param actualVS - Actual vertical section in feet
 * @param actualAzimuth - Actual azimuth in degrees
 * @param targetVS - Target vertical section in feet
 * @param targetAzimuth - Target azimuth in degrees
 */
export const calculateLeftRight = (
  actualVS: number,
  actualAzimuth: number,
  targetVS: number,
  targetAzimuth: number,
): number => {
  // Validate inputs
  if (
    typeof actualVS !== "number" ||
    typeof actualAzimuth !== "number" ||
    typeof targetVS !== "number" ||
    typeof targetAzimuth !== "number" ||
    isNaN(actualVS) ||
    isNaN(actualAzimuth) ||
    isNaN(targetVS) ||
    isNaN(targetAzimuth) ||
    !isFinite(actualVS) ||
    !isFinite(actualAzimuth) ||
    !isFinite(targetVS) ||
    !isFinite(targetAzimuth)
  ) {
    return 0; // Return 0 if inputs are invalid
  }

  try {
    // Calculate the lateral offset between actual and target positions
    // Positive value means right of target, negative means left of target
    const vsOffset = actualVS - targetVS;
    const azimuthDiff = actualAzimuth - targetAzimuth;

    // Normalize azimuth difference to -180 to 180 range
    let normalizedAzimuthDiff = ((azimuthDiff + 180) % 360) - 180;
    if (normalizedAzimuthDiff < -180) normalizedAzimuthDiff += 360;

    // If azimuth difference is close to 0 or 180, the well is mostly on target line
    // If azimuth difference is positive and less than 90 or negative and greater than -90,
    // the well is to the right of target
    // Otherwise, it's to the left
    if (Math.abs(normalizedAzimuthDiff) < 90) {
      return vsOffset; // Right is positive, left is negative
    } else {
      return -vsOffset; // Reverse the sign for opposite direction
    }
  } catch (error) {
    console.error("Error calculating left/right:", error);
    return 0;
  }
};

/**
 * Calculate build rate (degrees per 100ft)
 * @param inc1 - Initial inclination in degrees
 * @param inc2 - Final inclination in degrees
 * @param md1 - Initial measured depth in feet
 * @param md2 - Final measured depth in feet
 */
export const calculateBuildRate = (
  inc1: number,
  inc2: number,
  md1: number,
  md2: number,
): number => {
  // Validate inputs
  if (
    typeof inc1 !== "number" ||
    typeof inc2 !== "number" ||
    typeof md1 !== "number" ||
    typeof md2 !== "number" ||
    isNaN(inc1) ||
    isNaN(inc2) ||
    isNaN(md1) ||
    isNaN(md2) ||
    !isFinite(inc1) ||
    !isFinite(inc2) ||
    !isFinite(md1) ||
    !isFinite(md2) ||
    md1 === md2 ||
    Math.abs(md2 - md1) < 0.001 // Prevent division by very small numbers
  ) {
    return 0; // Return 0 if inputs are invalid
  }

  try {
    // Build Rate = (Incl₂ − Incl₁) ÷ (MD₂ − MD₁) × 100
    const incChange = inc2 - inc1;
    const mdChange = Math.abs(md2 - md1);
    return (incChange / mdChange) * 100;
  } catch (error) {
    console.error("Error calculating build rate:", error);
    return 0;
  }
};

/**
 * Calculate turn rate (degrees per 100ft)
 * @param azi1 - Initial azimuth in degrees
 * @param azi2 - Final azimuth in degrees
 * @param md1 - Initial measured depth in feet
 * @param md2 - Final measured depth in feet
 */
export const calculateTurnRate = (
  azi1: number,
  azi2: number,
  md1: number,
  md2: number,
): number => {
  // Validate inputs
  if (
    typeof azi1 !== "number" ||
    typeof azi2 !== "number" ||
    typeof md1 !== "number" ||
    typeof md2 !== "number" ||
    isNaN(azi1) ||
    isNaN(azi2) ||
    isNaN(md1) ||
    isNaN(md2) ||
    !isFinite(azi1) ||
    !isFinite(azi2) ||
    !isFinite(md1) ||
    !isFinite(md2) ||
    md1 === md2 ||
    Math.abs(md2 - md1) < 0.001 // Prevent division by very small numbers
  ) {
    return 0; // Return 0 if inputs are invalid
  }

  try {
    // Handle azimuth crossing 0/360 boundary
    let aziChange = azi2 - azi1;
    if (Math.abs(aziChange) > 180) {
      if (aziChange > 0) {
        aziChange = aziChange - 360;
      } else {
        aziChange = aziChange + 360;
      }
    }

    // Turn Rate = (Azi₂ − Azi₁) ÷ (MD₂ − MD₁) × 100
    const mdChange = Math.abs(md2 - md1);
    return (aziChange / mdChange) * 100;
  } catch (error) {
    console.error("Error calculating turn rate:", error);
    return 0;
  }
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
  // Validate inputs
  if (
    typeof currentInc !== "number" ||
    typeof buildRate !== "number" ||
    typeof distance !== "number" ||
    isNaN(currentInc) ||
    isNaN(buildRate) ||
    isNaN(distance) ||
    !isFinite(currentInc) ||
    !isFinite(buildRate) ||
    !isFinite(distance)
  ) {
    return currentInc || 0; // Return current inclination or 0 if inputs are invalid
  }

  try {
    return currentInc + (buildRate * distance) / 100;
  } catch (error) {
    console.error("Error calculating projected inclination:", error);
    return currentInc || 0;
  }
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
  // Validate inputs
  if (
    typeof currentAz !== "number" ||
    typeof turnRate !== "number" ||
    typeof distance !== "number" ||
    isNaN(currentAz) ||
    isNaN(turnRate) ||
    isNaN(distance) ||
    !isFinite(currentAz) ||
    !isFinite(turnRate) ||
    !isFinite(distance)
  ) {
    return currentAz || 0; // Return current azimuth or 0 if inputs are invalid
  }

  try {
    const projectedAz = currentAz + (turnRate * distance) / 100;
    // Normalize to 0-360 range
    return ((projectedAz % 360) + 360) % 360;
  } catch (error) {
    console.error("Error calculating projected azimuth:", error);
    return currentAz || 0;
  }
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
  // Validate inputs
  if (
    typeof currentInc !== "number" ||
    typeof currentAz !== "number" ||
    typeof targetInc !== "number" ||
    typeof targetAz !== "number" ||
    typeof distance !== "number" ||
    isNaN(currentInc) ||
    isNaN(currentAz) ||
    isNaN(targetInc) ||
    isNaN(targetAz) ||
    isNaN(distance) ||
    !isFinite(currentInc) ||
    !isFinite(currentAz) ||
    !isFinite(targetInc) ||
    !isFinite(targetAz) ||
    !isFinite(distance) ||
    distance <= 0
  ) {
    return 0; // Return 0 if inputs are invalid
  }

  try {
    // Convert to radians
    const inc1Rad = (currentInc * Math.PI) / 180;
    const azi1Rad = (currentAz * Math.PI) / 180;
    const inc2Rad = (targetInc * Math.PI) / 180;
    const azi2Rad = (targetAz * Math.PI) / 180;

    // Calculate dogleg angle
    const cosInc = Math.cos(inc1Rad) * Math.cos(inc2Rad);
    const sinInc = Math.sin(inc1Rad) * Math.sin(inc2Rad);
    const cosAzi = Math.cos(azi1Rad - azi2Rad);

    // Ensure the value for acos is within valid range (-1 to 1)
    const cosValue = cosInc + sinInc * cosAzi;
    const clampedCosValue = Math.max(-1, Math.min(1, cosValue));
    const doglegAngle = Math.acos(clampedCosValue);

    // Convert to degrees and calculate severity per 100ft
    const doglegDegrees = (doglegAngle * 180) / Math.PI;
    return (doglegDegrees / distance) * 100;
  } catch (error) {
    console.error("Error calculating dogleg needed:", error);
    return 0;
  }
};

/**
 * Calculate nudge projection
 * @param currentInc - Current inclination in degrees
 * @param currentAz - Current azimuth in degrees
 * @param toolFace - Tool face angle in degrees
 * @param motorYield - Motor yield in degrees per 100ft
 * @param slideDistance - Slide distance in feet
 * @param isGravityToolface - Boolean indicating if gravity toolface is used instead of magnetic
 */
export const calculateNudgeProjection = (
  currentInc: number,
  currentAz: number,
  toolFace: number,
  motorYield: number,
  slideDistance: number,
  isGravityToolface: boolean = false,
): { projectedInc: number; projectedAz: number } => {
  try {
    // Handle null or undefined values with defaults
    const safeCurrentInc = currentInc ?? 0;
    const safeCurrentAz = currentAz ?? 0;
    const safeToolFace = toolFace ?? 0;
    const safeMotorYield = motorYield ?? 2.5;
    const safeSlideDistance = slideDistance ?? 30;

    // Convert to radians
    const incRad = (safeCurrentInc * Math.PI) / 180;
    const aziRad = (safeCurrentAz * Math.PI) / 180;

    // Adjust toolface angle based on mode (magnetic vs gravity)
    let adjustedToolFace = safeToolFace;

    if (isGravityToolface) {
      // For gravity toolface, we need to adjust based on the current azimuth
      // This converts gravity toolface to an equivalent magnetic toolface
      // The adjustment depends on the well's current azimuth and inclination
      adjustedToolFace = (((safeToolFace - safeCurrentAz) % 360) + 360) % 360;
    }

    const tfRad = (adjustedToolFace * Math.PI) / 180;

    // Calculate dogleg angle for the slide
    const doglegAngle = (safeMotorYield * safeSlideDistance) / 100;
    const doglegRad = (doglegAngle * Math.PI) / 180;

    // Calculate inclination change
    const incChange = Math.cos(tfRad) * doglegAngle;
    const projectedInc = safeCurrentInc + incChange;

    // Calculate azimuth change (more complex due to spherical geometry)
    let aziChange = 0;
    if (safeCurrentInc > 0.1) {
      // Avoid division by zero or near-zero
      aziChange = (Math.sin(tfRad) * doglegRad) / Math.sin(incRad);
    }
    // Convert back to degrees
    const aziChangeDegrees = (aziChange * 180) / Math.PI;
    let projectedAz = safeCurrentAz + aziChangeDegrees;

    // Normalize azimuth to 0-360 range
    projectedAz = ((projectedAz % 360) + 360) % 360;

    return { projectedInc, projectedAz };
  } catch (error) {
    console.error("Error calculating nudge projection:", error);
    return { projectedInc: currentInc || 0, projectedAz: currentAz || 0 };
  }
};
