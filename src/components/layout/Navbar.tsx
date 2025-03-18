import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Compass,
  Gauge,
  Settings,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  X,
  BarChart3,
  Wifi,
  Brain,
  User,
} from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      path: "/directional",
      label: "Directional",
      icon: <Compass className="h-5 w-5" />,
    },
    {
      path: "/parameters",
      label: "Drilling Parameters",
      icon: <Gauge className="h-5 w-5" />,
    },
    {
      path: "/surveys",
      label: "Surveys",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      path: "/torquedrag",
      label: "Torque & Drag",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      path: "/witsconfig",
      label: "WITS Config",
      icon: <Wifi className="h-5 w-5" />,
    },
    {
      path: "/oppsupport",
      label: "Opp Support",
      icon: <Brain className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center mr-2">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl">
                New Well Technologies
              </span>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${location.pathname === item.path ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center">
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={toggleMenu}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${location.pathname === item.path ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
