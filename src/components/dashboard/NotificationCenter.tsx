import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSurveys } from "@/context/SurveyContext";
import {
  Bell,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  X,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "warning" | "error" | "success" | "info";
  timestamp: Date;
  read: boolean;
  surveyId?: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { surveys } = useSurveys();

  // Check surveys for issues and generate notifications
  useEffect(() => {
    if (!surveys || !Array.isArray(surveys) || surveys.length === 0) return;

    const newNotifications: Notification[] = [];

    // Sort surveys by timestamp (newest first)
    const sortedSurveys = [...surveys].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Check the latest survey for quality issues
    const latestSurvey = sortedSurveys[0];
    if (latestSurvey) {
      // Check quality status
      if (
        latestSurvey.qualityCheck &&
        latestSurvey.qualityCheck.status === "fail"
      ) {
        newNotifications.push({
          id: `quality-${latestSurvey.id}`,
          title: "Survey Quality Check Failed",
          message: `Survey at ${new Date(latestSurvey.timestamp).toLocaleTimeString()} failed quality check: ${latestSurvey.qualityCheck.message || "Unknown issue"}.`,
          type: "error",
          timestamp: new Date(),
          read: false,
          surveyId: latestSurvey.id,
        });
      }

      // Check for high dogleg severity (if available)
      if (latestSurvey.dls && latestSurvey.dls > 4.5) {
        newNotifications.push({
          id: `dls-${latestSurvey.id}`,
          title: "High Dogleg Severity",
          message: `Survey at ${new Date(latestSurvey.timestamp).toLocaleTimeString()} has high dogleg severity of ${latestSurvey.dls.toFixed(2)}°/100ft.`,
          type: "warning",
          timestamp: new Date(),
          read: false,
          surveyId: latestSurvey.id,
        });
      }

      // Check for magnetic interference
      if (
        latestSurvey.bTotal &&
        (latestSurvey.bTotal < 0.2 || latestSurvey.bTotal > 0.6)
      ) {
        newNotifications.push({
          id: `magnetic-${latestSurvey.id}`,
          title: "Magnetic Interference Detected",
          message: `Survey at ${new Date(latestSurvey.timestamp).toLocaleTimeString()} shows abnormal magnetic field strength of ${latestSurvey.bTotal.toFixed(3)} Gauss.`,
          type: "warning",
          timestamp: new Date(),
          read: false,
          surveyId: latestSurvey.id,
        });
      }

      // Check for high tool temperature
      if (latestSurvey.toolTemp && latestSurvey.toolTemp > 150) {
        newNotifications.push({
          id: `temp-${latestSurvey.id}`,
          title: "High Tool Temperature",
          message: `Survey at ${new Date(latestSurvey.timestamp).toLocaleTimeString()} shows high tool temperature of ${latestSurvey.toolTemp.toFixed(1)}°F.`,
          type: "warning",
          timestamp: new Date(),
          read: false,
          surveyId: latestSurvey.id,
        });
      }
    }

    // Add new notifications if they don't already exist
    if (newNotifications.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const filteredNew = newNotifications.filter(
          (n) => !existingIds.has(n.id),
        );
        return [...prev, ...filteredNew];
      });
    }
  }, [surveys]);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300 relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-gray-900 border-gray-800 text-gray-200"
        align="end"
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <h3 className="font-medium text-sm">Notifications</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-400 hover:text-gray-200"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 ${!notification.read ? "bg-gray-800/50" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      {getNotificationIcon(notification.type)}
                      <div>
                        <h4 className="text-sm font-medium">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-300"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs text-blue-400 hover:text-blue-300 p-0 h-auto mt-1"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Bell className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-sm text-gray-400">No notifications</p>
              <p className="text-xs text-gray-500 mt-1">
                Notifications about surveys and drilling operations will appear
                here
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
