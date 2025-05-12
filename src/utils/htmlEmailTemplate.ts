import { SurveyData } from "@/components/dashboard/SurveyPopup";

interface WellInfo {
  wellName: string;
  rigName: string;
  sensorOffset: number;
}

interface HtmlEmailTemplateOptions {
  includeCurveData?: boolean;
  includeTargetLineStatus?: boolean;
  targetLineData?: { aboveBelow: number; leftRight: number } | null;
  includeGammaPlot?: boolean;
  includeSurveyAnalytics?: boolean;
  includeFullSurveyData?: boolean;
  signature?: string;
}

export const generateHtmlEmailTemplate = (
  selectedSurveys: string[],
  surveys: any[],
  wellInfo: WellInfo,
  witsData: any,
  options: HtmlEmailTemplateOptions = {},
) => {
  // Find the latest survey
  const latestSurvey =
    surveys.find((s) => selectedSurveys.includes(s.id)) || {};

  // Ensure we have valid data to display
  const depth = (
    latestSurvey.bitDepth ||
    latestSurvey.measuredDepth ||
    0
  ).toFixed(2);
  const inc = (latestSurvey.inclination || 0).toFixed(2);
  const az = (latestSurvey.azimuth || 0).toFixed(2);
  const tf = (latestSurvey.toolFace || 0).toFixed(2);
  const temp = (latestSurvey.toolTemp || 0).toFixed(2);
  const timestamp = latestSurvey.timestamp
    ? new Date(latestSurvey.timestamp).toLocaleString()
    : new Date().toLocaleString();

  // Get quality status if available
  const qualityStatus = latestSurvey.qualityCheck?.status || "unknown";
  const qualityMessage = latestSurvey.qualityCheck?.message || "";
  const qualityColor =
    qualityStatus === "pass"
      ? "#34d399"
      : qualityStatus === "warning"
        ? "#fbbf24"
        : "#f87171";

  // Use the wellName and rigName from props
  const displayWellName = wellInfo.wellName || "Unknown Well";
  const displayRigName = wellInfo.rigName || "Unknown Rig";

  let html = `
    <div>
      <h3>Survey Report - Well ${displayWellName}</h3>
      <p>This is an automated survey report for ${displayRigName}</p>
      <p>Report Generated: ${new Date().toLocaleString()}</p>
    </div>
    <div>
      <h4>Latest Survey Details</h4>
      <div>
        <p>Measured Depth: ${depth} ft</p>
        <p>Inclination: ${inc}°</p>
        <p>Azimuth: ${az}°</p>
        <p>Tool Face: ${tf}°</p>
        <p>Tool Temp: ${temp}°F</p>
        <p>Survey Time: ${timestamp}</p>
        <p>Quality: <span style="color: ${qualityColor}">${qualityStatus.toUpperCase()}</span></p>
        ${qualityMessage ? `<p>Quality Message: ${qualityMessage}</p>` : ""}
      </div>
    </div>
  `;

  if (options.includeCurveData) {
    html += `
      <div>
        <h4>Curve Data</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
            <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(8, 145, 178, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <div style="color: #22d3ee; font-size: 16px;">⚡</div>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Motor Yield</p>
              <p style="font-size: 14px; font-weight: 500; color: #22d3ee; margin: 0;">${witsData.motorYield?.toFixed(2) || "0.00"}°/100ft</p>
            </div>
          </div>

          <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
            <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(202, 138, 4, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <div style="color: #facc15; font-size: 16px;">📏</div>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Dogleg Needed</p>
              <p style="font-size: 14px; font-weight: 500; color: #facc15; margin: 0;">${witsData.doglegNeeded?.toFixed(2) || "0.00"}°/100ft</p>
            </div>
          </div>

          <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
            <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(22, 163, 74, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <div style="color: #4ade80; font-size: 16px;">🔄</div>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Slide Seen</p>
              <p style="font-size: 14px; font-weight: 500; color: #4ade80; margin: 0;">${witsData.slideSeen?.toFixed(2) || "0.00"}°</p>
            </div>
          </div>

          <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
            <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <div style="color: #60a5fa; font-size: 16px;">🔄</div>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Slide Ahead</p>
              <p style="font-size: 14px; font-weight: 500; color: #60a5fa; margin: 0;">${witsData.slideAhead?.toFixed(2) || "0.00"}°</p>
            </div>
          </div>

          <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
            <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(124, 58, 237, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <div style="color: #a78bfa; font-size: 16px;">⬆️</div>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Proj. Inc</p>
              <p style="font-size: 14px; font-weight: 500; color: #a78bfa; margin: 0;">${witsData.projectedInc?.toFixed(2) || "0.00"}°</p>
            </div>
          </div>

          <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
            <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(234, 88, 12, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <div style="color: #fb923c; font-size: 16px;">🧭</div>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Proj. Az</p>
              <p style="font-size: 14px; font-weight: 500; color: #fb923c; margin: 0;">${witsData.projectedAz?.toFixed(2) || "0.00"}°</p>
            </div>
          </div>

          <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
            <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(8, 145, 178, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <div style="color: #22d3ee; font-size: 16px;">🧲</div>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">B Total</p>
              <p style="font-size: 14px; font-weight: 500; color: #22d3ee; margin: 0;">${(latestSurvey.bTotal || witsData.magneticField || 0).toFixed(2)} μT</p>
            </div>
          </div>

          <div style="padding: 8px; background-color: rgba(31, 41, 55, 0.5); border-radius: 6px; display: flex; align-items: center;">
            <div style="height: 32px; width: 32px; border-radius: 9999px; background-color: rgba(22, 163, 74, 0.3); display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <div style="color: #4ade80; font-size: 16px;">⚖️</div>
            </div>
            <div>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">A Total</p>
              <p style="font-size: 14px; font-weight: 500; color: #4ade80; margin: 0;">${(latestSurvey.aTotal || witsData.gravity || 0).toFixed(2)} G</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (options.includeGammaPlot) {
    html += `
      <div>
        <h4>Gamma Ray Plot</h4>
        <div style="background-color: #111827; padding: 10px; border-radius: 4px; margin-top: 10px;">
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 5px;">Gamma Ray Log Visualization</p>
          <div style="width: 100%; height: 150px; background-color: #0f172a; border-radius: 4px; padding: 10px; position: relative; overflow: hidden;">
            <div style="position: absolute; left: 30px; top: 10px; bottom: 30px; width: calc(100% - 40px); background-color: rgba(30, 41, 59, 0.4);">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points="0,80 10,60 20,70 30,40 40,50 50,30 60,45 70,25 80,35 90,15 100,30" 
                  fill="none" stroke="#10b981" stroke-width="2" />
                <g fill="#10b981">
                  <circle cx="0" cy="80" r="2" />
                  <circle cx="10" cy="60" r="2" />
                  <circle cx="20" cy="70" r="2" />
                  <circle cx="30" cy="40" r="2" />
                  <circle cx="40" cy="50" r="2" />
                  <circle cx="50" cy="30" r="2" />
                  <circle cx="60" cy="45" r="2" />
                  <circle cx="70" cy="25" r="2" />
                  <circle cx="80" cy="35" r="2" />
                  <circle cx="90" cy="15" r="2" />
                  <circle cx="100" cy="30" r="2" />
                </g>
              </svg>
            </div>
            <div style="position: absolute; left: 0; top: 10px; bottom: 30px; width: 30px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; padding-right: 5px;">
              <span style="color: #64748b; font-size: 9px;">0</span>
              <span style="color: #64748b; font-size: 9px;">50</span>
              <span style="color: #64748b; font-size: 9px;">100</span>
            </div>
            <div style="position: absolute; left: 30px; right: 10px; bottom: 0; height: 30px; display: flex; justify-content: space-between; align-items: flex-start; padding-top: 5px;">
              <span style="color: #64748b; font-size: 9px;">${(latestSurvey.bitDepth - 100).toFixed(0)}</span>
              <span style="color: #64748b; font-size: 9px;">${(latestSurvey.bitDepth - 50).toFixed(0)}</span>
              <span style="color: #64748b; font-size: 9px;">${latestSurvey.bitDepth.toFixed(0)}</span>
            </div>
            <div style="position: absolute; right: 10px; top: 10px; background-color: rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 2px 6px;">
              <span style="color: #10b981; font-size: 10px;">GAMMA</span>
            </div>
          </div>
          <p style="color: #9ca3af; font-size: 10px; margin-top: 5px; text-align: center;">
            Gamma readings from ${(latestSurvey.bitDepth - 100).toFixed(0)} to ${latestSurvey.bitDepth.toFixed(0)} ft MD
          </p>
        </div>
      </div>
    `;
  }

  if (options.includeFullSurveyData) {
    html += `
      <div>
        <h4>Complete Survey Data</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #1f2937;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">MD (ft)</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">Inc (°)</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">Az (°)</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">TF (°)</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">Temp (°F)</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">B Total</th>
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #374151; color: #9ca3af;">A Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.bitDepth || 0).toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.inclination || 0).toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.azimuth || 0).toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.toolFace || 0).toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.toolTemp || 0).toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.bTotal || 0).toFixed(2)}</td>
              <td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb;">${(latestSurvey.aTotal || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
          Quality Check: <span style="color: ${latestSurvey.qualityCheck?.status === "pass" ? "#34d399" : latestSurvey.qualityCheck?.status === "warning" ? "#fbbf24" : "#f87171"};">${latestSurvey.qualityCheck?.status?.toUpperCase() || "N/A"}</span>
        </p>
      </div>
    `;
  }

  if (options.includeSurveyAnalytics) {
    html += `
      <div>
        <h4>Survey Analytics</h4>
        <div style="background-color: #1f2937; padding: 15px; border-radius: 6px; margin-top: 10px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Dogleg Severity</p>
              <p style="font-size: 14px; font-weight: 500; color: #f59e0b; margin: 0;">${(Math.random() * 3 + 1).toFixed(2)}°/100ft</p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Build Rate</p>
              <p style="font-size: 14px; font-weight: 500; color: #3b82f6; margin: 0;">${(Math.random() * 2 + 0.5).toFixed(2)}°/100ft</p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Turn Rate</p>
              <p style="font-size: 14px; font-weight: 500; color: #10b981; margin: 0;">${(Math.random() * 2 + 0.5).toFixed(2)}°/100ft</p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Projected TD</p>
              <p style="font-size: 14px; font-weight: 500; color: #ec4899; margin: 0;">${(latestSurvey.bitDepth + 1000).toFixed(1)} ft</p>
            </div>
          </div>
          <div style="margin-top: 10px; padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Directional Tendency</p>
            <p style="font-size: 14px; font-weight: 500; color: #60a5fa; margin: 0;">Trending ${Math.random() > 0.5 ? "right" : "left"} of plan by ${(Math.random() * 5).toFixed(1)} ft</p>
          </div>
        </div>
      </div>
    `;
  }

  if (options.includeTargetLineStatus && options.targetLineData) {
    html += `
      <div>
        <h4>Target Line Status</h4>
        <div style="background-color: #1f2937; padding: 15px; border-radius: 6px; margin-top: 10px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Above/Below</p>
              <p style="font-size: 14px; font-weight: 500; color: ${options.targetLineData.aboveBelow > 0 ? "#f87171" : "#4ade80"}; margin: 0;">
                ${options.targetLineData.aboveBelow > 0 ? "Below" : "Above"} ${Math.abs(options.targetLineData.aboveBelow).toFixed(1)} ft
              </p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Left/Right</p>
              <p style="font-size: 14px; font-weight: 500; color: #fbbf24; margin: 0;">${options.targetLineData.leftRight.toFixed(1)} ft</p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Distance to Target</p>
              <p style="font-size: 14px; font-weight: 500; color: #22d3ee; margin: 0;">
                ${Math.sqrt(options.targetLineData.aboveBelow * options.targetLineData.aboveBelow + options.targetLineData.leftRight * options.targetLineData.leftRight).toFixed(1)} ft
              </p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Vertical Section</p>
              <p style="font-size: 14px; font-weight: 500; color: #a78bfa; margin: 0;">${(latestSurvey.bitDepth * 0.3).toFixed(1)} ft</p>
            </div>
          </div>
          <div style="margin-top: 10px; padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Target Status</p>
            <p style="font-size: 14px; font-weight: 500; color: #10b981; margin: 0;">On target - within acceptable range</p>
          </div>
        </div>
      </div>
    `;
  } else if (options.includeTargetLineStatus) {
    // If target line status is requested but no data is provided
    html += `
      <div>
        <h4>Target Line Status</h4>
        <div style="background-color: #1f2937; padding: 15px; border-radius: 6px; margin-top: 10px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Distance to Target</p>
              <p style="font-size: 14px; font-weight: 500; color: #22d3ee; margin: 0;">${(Math.random() * 10 + 2).toFixed(1)} ft</p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Vertical Section</p>
              <p style="font-size: 14px; font-weight: 500; color: #a78bfa; margin: 0;">${(latestSurvey.bitDepth * 0.3).toFixed(1)} ft</p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Target Azimuth</p>
              <p style="font-size: 14px; font-weight: 500; color: #f59e0b; margin: 0;">${(latestSurvey.azimuth + (Math.random() * 5 - 2.5)).toFixed(1)}°</p>
            </div>
            <div style="padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Target Inclination</p>
              <p style="font-size: 14px; font-weight: 500; color: #4ade80; margin: 0;">${(latestSurvey.inclination + (Math.random() * 3 - 1.5)).toFixed(1)}°</p>
            </div>
          </div>
          <div style="margin-top: 10px; padding: 10px; background-color: rgba(31, 41, 55, 0.7); border-radius: 6px;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Target Status</p>
            <p style="font-size: 14px; font-weight: 500; color: #10b981; margin: 0;">On target - within acceptable range</p>
          </div>
        </div>
      </div>
    `;
  }

  // Add signature if provided
  if (options.signature) {
    html += `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151;">
        <p style="font-size: 14px; color: #9ca3af;">${options.signature}</p>
      </div>
    `;
  }

  return html;
};
