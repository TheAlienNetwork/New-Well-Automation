// ProfilePage.js
import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import StatusBar from "@/components/dashboard/StatusBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Clock,
  DollarSign,
  Send,
  Upload,
  Save,
  Edit,
  CheckCircle,
  AlertTriangle,
  Trash,
} from "lucide-react";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  description: string;
  isOvertime?: boolean;
}

const ProfilePage = () => {
  const { userProfile, updateUserProfile, updateProfileImage } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [taxRate, setTaxRate] = useState(0.22); // Default tax rate at 22%
  const [isEditing, setIsEditing] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(85);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // Load time entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("timeEntries");
    if (savedEntries) {
      setTimeEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save time entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timeEntries", JSON.stringify(timeEntries));
  }, [timeEntries]);

  const [newEntry, setNewEntry] = useState<Omit<TimeEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    hours: 8,
    project: "Alpha-123 Well",
    description: "",
  });

  // Local state to track changes before saving to context
  const [profileData, setProfileData] = useState({
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    email: userProfile.email,
    phone: userProfile.phone,
    position: userProfile.position,
    company: userProfile.company,
    location: userProfile.location,
    bio: userProfile.bio,
    emailSignature: userProfile.emailSignature,
  });

  // Update local state when userProfile changes
  useEffect(() => {
    setProfileData({
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      email: userProfile.email,
      phone: userProfile.phone,
      position: userProfile.position,
      company: userProfile.company,
      location: userProfile.location,
      bio: userProfile.bio,
      emailSignature: userProfile.emailSignature,
    });
  }, [userProfile]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        updateProfileImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileDataChange = (field: string, value: string) => {
    setProfileData({
      ...profileData,
      [field]: value,
    });
  };

  const handleSaveProfile = () => {
    setIsEditing(false);

    // Update email signature with current profile data
    const updatedEmailSignature = `${profileData.firstName} ${profileData.lastName}\n${profileData.position}\n${profileData.company}\nPhone: ${profileData.phone}\nEmail: ${profileData.email}`;

    // Update local state
    setProfileData({
      ...profileData,
      emailSignature: updatedEmailSignature,
    });

    // Update global context
    updateUserProfile({
      ...profileData,
      emailSignature: updatedEmailSignature,
    });

    // Log confirmation for debugging
    console.log(
      "Profile updated:",
      profileData.firstName,
      profileData.lastName,
    );
  };

  const handleNewEntryChange = (
    field: keyof Omit<TimeEntry, "id">,
    value: string | number,
  ) => {
    setNewEntry({
      ...newEntry,
      [field]: value,
    });
  };

  const handleAddTimeEntry = () => {
    const entry: TimeEntry = {
      ...newEntry,
      id: Date.now().toString(),
    };
    setTimeEntries([...timeEntries, entry]);
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      hours: 8,
      project: "Alpha-123 Well",
      description: "",
    });
  };

  const handleDeleteTimeEntry = (id: string) => {
    const updatedEntries = timeEntries.filter((entry) => entry.id !== id);
    setTimeEntries(updatedEntries);
  };

  const calculateTotalHours = () => {
    return timeEntries.reduce((total, entry) => total + entry.hours, 0);
  };

  const calculateRegularHours = () => {
    // Group entries by date to calculate daily hours
    const dailyHours: Record<string, number> = {};

    timeEntries.forEach((entry) => {
      if (!dailyHours[entry.date]) {
        dailyHours[entry.date] = 0;
      }
      dailyHours[entry.date] += entry.hours;
    });

    // Calculate regular hours (8 hours per day max)
    let regularHours = 0;
    Object.values(dailyHours).forEach((hours) => {
      regularHours += Math.min(hours, 8);
    });

    return regularHours;
  };

  const calculateOvertimeHours = () => {
    // Group entries by date to calculate daily overtime
    const dailyHours: Record<string, number> = {};

    timeEntries.forEach((entry) => {
      if (!dailyHours[entry.date]) {
        dailyHours[entry.date] = 0;
      }
      dailyHours[entry.date] += entry.hours;
    });

    // Calculate overtime hours (hours over 8 per day)
    let overtimeHours = 0;
    Object.values(dailyHours).forEach((hours) => {
      overtimeHours += Math.max(0, hours - 8);
    });

    return overtimeHours;
  };

  const calculateTotalPay = () => {
    const regularHours = calculateRegularHours();
    const overtimeHours = calculateOvertimeHours();
    return regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5;
  };

  const sendTimesheet = () => {
    // Create email subject
    const subject = `Timesheet: ${profileData.firstName} ${profileData.lastName} - ${new Date().toLocaleDateString()}`;

    // Create email body
    const emailBody = `
Timesheet for: ${profileData.firstName} ${profileData.lastName}
Position: ${profileData.position}
Period: ${timeEntries[0]?.date} to ${timeEntries[timeEntries.length - 1]?.date}

Total Hours: ${calculateTotalHours()}
Hourly Rate: $${hourlyRate.toFixed(2)}
Total Amount: $${calculateTotalPay().toFixed(2)}

Time Entries:
${timeEntries.map((entry) => `- ${entry.date}: ${entry.hours} hours - ${entry.project} - ${entry.description}`).join("\n")}

${profileData.emailSignature}
`;

    // Create mailto link
    const mailtoLink = `mailto:payroll@newwelltech.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    // Open the link
    window.open(mailtoLink);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />
      <StatusBar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Profile</h1>
          {activeTab === "profile" && (
            <Button
              variant="outline"
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          )}
        </div>

        <Tabs
          defaultValue="profile"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-gray-800 mb-6">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="timesheet"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400"
            >
              <Clock className="h-4 w-4 mr-2" />
              Timesheet
            </TabsTrigger>
            <TabsTrigger
              value="payroll"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-blue-400"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Payroll
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-gray-800">
                      <AvatarImage
                        src={
                          userProfile.profileImage ||
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=john"
                        }
                      />
                      <AvatarFallback className="bg-blue-900 text-blue-200 text-2xl">
                        {profileData.firstName.charAt(0)}
                        {profileData.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute bottom-0 right-0">
                        <label
                          htmlFor="profile-image"
                          className="cursor-pointer"
                        >
                          <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1">
                            <Upload className="h-4 w-4" />
                          </div>
                          <input
                            id="profile-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfileImageChange}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-200">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={profileData.firstName}
                            onChange={(e) =>
                              handleProfileDataChange(
                                "firstName",
                                e.target.value,
                              )
                            }
                            className="bg-gray-800 border-gray-700 text-gray-200"
                            placeholder="First Name"
                          />
                          <Input
                            value={profileData.lastName}
                            onChange={(e) =>
                              handleProfileDataChange(
                                "lastName",
                                e.target.value,
                              )
                            }
                            className="bg-gray-800 border-gray-700 text-gray-200"
                            placeholder="Last Name"
                          />
                        </div>
                      ) : (
                        `${profileData.firstName} ${profileData.lastName}`
                      )}
                    </h2>
                    <div className="text-gray-400 mt-1">
                      {isEditing ? (
                        <Input
                          value={profileData.position}
                          onChange={(e) =>
                            handleProfileDataChange("position", e.target.value)
                          }
                          className="bg-gray-800 border-gray-700 text-gray-200 mt-2"
                          placeholder="Position"
                        />
                      ) : (
                        profileData.position
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-blue-400" />
                        {isEditing ? (
                          <Input
                            value={profileData.company}
                            onChange={(e) =>
                              handleProfileDataChange("company", e.target.value)
                            }
                            className="bg-gray-800 border-gray-700 text-gray-200 w-40"
                            placeholder="Company"
                          />
                        ) : (
                          <span>{profileData.company}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-red-400" />
                        {isEditing ? (
                          <Input
                            value={profileData.location}
                            onChange={(e) =>
                              handleProfileDataChange(
                                "location",
                                e.target.value,
                              )
                            }
                            className="bg-gray-800 border-gray-700 text-gray-200 w-40"
                            placeholder="Location"
                          />
                        ) : (
                          <span>{profileData.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-300">
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-gray-400">Email</div>
                          {isEditing ? (
                            <Input
                              value={profileData.email}
                              onChange={(e) =>
                                handleProfileDataChange("email", e.target.value)
                              }
                              className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                              placeholder="Email"
                            />
                          ) : (
                            <div className="text-gray-300">
                              {profileData.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-gray-400">Phone</div>
                          {isEditing ? (
                            <Input
                              value={profileData.phone}
                              onChange={(e) =>
                                handleProfileDataChange("phone", e.target.value)
                              }
                              className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                              placeholder="Phone"
                            />
                          ) : (
                            <div className="text-gray-300">
                              {profileData.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-300">Bio</h3>
                    {isEditing ? (
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) =>
                          handleProfileDataChange("bio", e.target.value)
                        }
                        className="bg-gray-800 border-gray-700 text-gray-200 min-h-[120px]"
                        placeholder="Tell us about yourself"
                      />
                    ) : (
                      <p className="text-gray-400">{profileData.bio}</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-800 my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-300">
                    Email Signature
                  </h3>
                  <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                    {isEditing ? (
                      <Textarea
                        value={profileData.emailSignature}
                        onChange={(e) =>
                          handleProfileDataChange(
                            "emailSignature",
                            e.target.value,
                          )
                        }
                        className="bg-gray-800 border-gray-700 text-gray-200 min-h-[120px] font-mono"
                        placeholder="Email signature"
                      />
                    ) : (
                      <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                        {profileData.emailSignature}
                      </pre>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                        onClick={handleSaveProfile}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timesheet" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Timesheet
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-900/30 text-blue-400 border-blue-800"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Current Pay Period
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">
                      Hours Summary
                    </div>
                    <div className="text-xl font-bold text-blue-400">
                      {calculateTotalHours()} Total
                    </div>
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-gray-400">
                        Regular:{" "}
                        <span className="text-green-400">
                          {calculateRegularHours()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Overtime:{" "}
                        <span className="text-orange-400">
                          {calculateOvertimeHours()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">
                      Hourly Rate
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      <div className="flex items-center gap-2">
                        <span>${hourlyRate.toFixed(2)}</span>
                        <Input
                          type="number"
                          value={hourlyRate}
                          onChange={(e) =>
                            setHourlyRate(Number(e.target.value))
                          }
                          className="bg-gray-700 border-gray-600 text-gray-200 w-24 h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Overtime Rate:{" "}
                      <span className="text-orange-400">
                        ${(hourlyRate * 1.5).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                    <div className="text-sm text-gray-400 mb-1">Total Pay</div>
                    <div className="text-xl font-bold text-purple-400">
                      ${calculateTotalPay().toFixed(2)}
                    </div>
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-gray-400">
                        Regular:{" "}
                        <span className="text-green-400">
                          ${(calculateRegularHours() * hourlyRate).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Overtime:{" "}
                        <span className="text-orange-400">
                          $
                          {(
                            calculateOvertimeHours() *
                            hourlyRate *
                            1.5
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-300">
                      Time Entries
                    </h3>
                    <Button
                      variant="outline"
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                      onClick={sendTimesheet}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Timesheet
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-800/50 border-b border-gray-800">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Hours
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {timeEntries.map((entry, index) => {
                          // Determine if this entry should be considered overtime
                          // For simplicity, we'll mark entries as overtime if the cumulative hours exceed 80
                          let cumulativeHours = 0;
                          for (let i = 0; i <= index; i++) {
                            cumulativeHours += timeEntries[i].hours;
                          }
                          const isOvertime = cumulativeHours > 80;

                          return (
                            <tr
                              key={entry.id}
                              className={`hover:bg-gray-800/30 ${isOvertime ? "bg-orange-900/10" : ""}`}
                            >
                              <td className="px-4 py-2">
                                <Input
                                  value={entry.date}
                                  onChange={(e) => {
                                    const updatedEntries = [...timeEntries];
                                    updatedEntries[index].date = e.target.value;
                                    setTimeEntries(updatedEntries);
                                  }}
                                  className="bg-transparent border-0 hover:bg-gray-800 focus:bg-gray-800 text-gray-300 text-sm h-7 p-1"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  type="number"
                                  value={entry.hours}
                                  onChange={(e) => {
                                    const updatedEntries = [...timeEntries];
                                    updatedEntries[index].hours = Number(
                                      e.target.value,
                                    );
                                    setTimeEntries(updatedEntries);
                                  }}
                                  className="bg-transparent border-0 hover:bg-gray-800 focus:bg-gray-800 text-gray-300 text-sm h-7 p-1 w-16"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  value={entry.project}
                                  onChange={(e) => {
                                    const updatedEntries = [...timeEntries];
                                    updatedEntries[index].project =
                                      e.target.value;
                                    setTimeEntries(updatedEntries);
                                  }}
                                  className="bg-transparent border-0 hover:bg-gray-800 focus:bg-gray-800 text-gray-300 text-sm h-7 p-1"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <Input
                                  value={entry.description}
                                  onChange={(e) => {
                                    const updatedEntries = [...timeEntries];
                                    updatedEntries[index].description =
                                      e.target.value;
                                    setTimeEntries(updatedEntries);
                                  }}
                                  className="bg-transparent border-0 hover:bg-gray-800 focus:bg-gray-800 text-gray-300 text-sm h-7 p-1"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <Button
                                  variant="destructive"
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() =>
                                    handleDeleteTimeEntry(entry.id)
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800 mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Add New Entry
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="date" className="text-xs text-gray-400">
                          Date
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={newEntry.date}
                          onChange={(e) =>
                            handleNewEntryChange("date", e.target.value)
                          }
                          className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="hours"
                          className="text-xs text-gray-400"
                        >
                          Hours
                        </Label>
                        <Input
                          id="hours"
                          type="number"
                          value={newEntry.hours}
                          onChange={(e) =>
                            handleNewEntryChange(
                              "hours",
                              Number(e.target.value),
                            )
                          }
                          className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="project"
                          className="text-xs text-gray-400"
                        >
                          Project
                        </Label>
                        <Input
                          id="project"
                          value={newEntry.project}
                          onChange={(e) =>
                            handleNewEntryChange("project", e.target.value)
                          }
                          className="bg-gray-800 border-gray-700 text-gray-200 mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="description"
                          className="text-xs text-gray-400"
                        >
                          Description
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="description"
                            value={newEntry.description}
                            onChange={(e) =>
                              handleNewEntryChange(
                                "description",
                                e.target.value,
                              )
                            }
                            className="bg-gray-800 border-gray-700 text-gray-200 mt-1 flex-1"
                          />
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white mt-1"
                            onClick={handleAddTimeEntry}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium text-gray-200 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    Bi-Weekly Pay Breakdown
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-purple-900/30 text-purple-400 border-purple-800"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Current Pay Period
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-300">
                      Pay Summary
                    </h3>
                    <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Regular Hours:</span>
                          <span className="text-green-400 font-medium">
                            {calculateRegularHours()} hrs
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Regular Pay:</span>
                          <span className="text-green-400 font-medium">
                            ${(calculateRegularHours() * hourlyRate).toFixed(2)}
                          </span>
                        </div>
                        <Separator className="bg-gray-700 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Overtime Hours:</span>
                          <span className="text-orange-400 font-medium">
                            {calculateOvertimeHours()} hrs
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Overtime Pay:</span>
                          <span className="text-orange-400 font-medium">
                            $
                            {(
                              calculateOvertimeHours() *
                              hourlyRate *
                              1.5
                            ).toFixed(2)}
                          </span>
                        </div>
                        <Separator className="bg-gray-700 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Gross Pay:</span>
                          <span className="text-blue-400 font-medium">
                            ${calculateTotalPay().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-300">
                      Deductions
                    </h3>
                    <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">
                            Federal Tax Rate:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-red-400 font-medium">
                              {(taxRate * 100).toFixed(0)}%
                            </span>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              step="1"
                              value={taxRate * 100}
                              onChange={(e) =>
                                setTaxRate(Number(e.target.value) / 100)
                              }
                              className="bg-gray-700 border-gray-600 text-gray-200 w-16 h-7 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Federal Tax:</span>
                          <span className="text-red-400 font-medium">
                            -${(calculateTotalPay() * taxRate).toFixed(2)}
                          </span>
                        </div>
                        <Separator className="bg-gray-700 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Net Pay:</span>
                          <span className="text-purple-400 font-bold">
                            ${(calculateTotalPay() * (1 - taxRate)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-md border border-gray-800 mt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Projected Annual Income
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Annual Gross:</span>
                          <span className="text-blue-400 font-medium">
                            ${(calculateTotalPay() * 26).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Annual Net:</span>
                          <span className="text-purple-400 font-medium">
                            $
                            {(calculateTotalPay() * (1 - taxRate) * 26).toFixed(
                              2,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
