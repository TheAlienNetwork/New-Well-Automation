import React, { useState, useEffect } from "react";
import { useSurveys } from "@/context/SurveyContext";
import {
  Bell,
  Settings,
  User,
  HelpCircle,
  Menu,
  X,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useWits } from "@/context/WitsContext";

interface HeaderProps {
  systemStatus?: "online" | "offline" | "warning";
  companyName?: string;
  projectName?: string;
  userName?: string;
  notificationCount?: number;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
  profileImage?: string | null;
  wellName?: string;
  rigName?: string;
}

const Header = ({
  systemStatus = "online",
  companyName = "OilTech Solutions",
  projectName = "Well Alpha-123",
  userName,
  notificationCount = 3,
  onMenuToggle = () => {},
  menuOpen = false,
  profileImage,
  wellName: propWellName,
  rigName: propRigName,
}: HeaderProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { userProfile } = useUser();
  const { surveys } = useSurveys();
  const { witsData, isConnected } = useWits();

  // State for well information
  const [wellName, setWellName] = useState(propWellName || "Well Alpha-123");
  const [rigName, setRigName] = useState(
    propRigName || "Precision Drilling #42",
  );
  const [latestSurvey, setLatestSurvey] = useState<any>(null);

  // Use userProfile data if props are not provided
  const displayName =
    userName || `${userProfile.firstName} ${userProfile.lastName}`;
  const displayImage = profileImage || userProfile.profileImage;

  // Update well information and latest survey when surveys change
  useEffect(() => {
    if (surveys.length > 0) {
      // Sort surveys by timestamp (newest first)
      const sortedSurveys = [...surveys].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Get the latest survey
      const latest = sortedSurveys[0];
      setLatestSurvey(latest);

      // Update well name and rig name if available in the survey
      if (latest.wellName && !propWellName) {
        setWellName(latest.wellName);
      }

      if (latest.rigName && !propRigName) {
        setRigName(latest.rigName);
      }
    }
  }, [surveys, propWellName, propRigName]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const getStatusIcon = () => {
    // Use actual connection status from WitsContext
    if (isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    } else {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    // Use actual connection status from WitsContext
    if (isConnected) {
      return "System Online";
    } else {
      return "System Offline";
    }
  };

  return (
    <header className="w-full h-[60px] bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between shadow-md">
      {/* Left section with logo and menu toggle */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center mr-2 shadow-lg shadow-cyan-500/20">
            <span className="text-white font-bold text-sm">NWT</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-white font-medium">New Well Technologies</h1>
            <p className="text-gray-400 text-xs">
              {wellName} {rigName ? `- ${rigName}` : ""}
              {latestSurvey && (
                <span className="ml-2 text-blue-400">
                  Latest Survey:{" "}
                  {new Date(latestSurvey.timestamp).toLocaleTimeString()} -{" "}
                  {latestSurvey.bitDepth.toFixed(1)}ft
                  {latestSurvey.inclination && (
                    <span className="ml-1">
                      | Inc: {latestSurvey.inclination.toFixed(2)}°
                    </span>
                  )}
                  {latestSurvey.azimuth && (
                    <span className="ml-1">
                      | Az: {latestSurvey.azimuth.toFixed(2)}°
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Center section with system status */}
      <div className="hidden md:flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
          {getStatusIcon()}
          <span className="text-sm text-gray-300">{getStatusText()}</span>
        </div>
        {latestSurvey && (
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
            <span className="text-sm text-gray-300">
              MD: {latestSurvey.bitDepth.toFixed(1)}ft
            </span>
          </div>
        )}
        {latestSurvey && (
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
            <span className="text-sm text-gray-300">
              Inc: {latestSurvey.inclination.toFixed(2)}° | Az:{" "}
              {latestSurvey.azimuth.toFixed(2)}°
            </span>
          </div>
        )}
      </div>

      {/* Right section with actions */}
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 relative"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]"
                    variant="destructive"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Help</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9V4H4v5h5zm0 6H4v5h5v-5zm6 0v5h5v-5h-5zm5-6h-5V4h5v5z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                    />
                  </svg>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-gray-900 border-gray-800 text-gray-300"
          >
            <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
              System Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
              Display Preferences
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
              Calibration
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
              About
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800 flex items-center gap-2 ml-2"
            >
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="hidden md:inline-block text-sm">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-gray-900 border-gray-800 text-gray-300"
          >
            <Link to="/profile">
              <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800 cursor-pointer text-red-400">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
