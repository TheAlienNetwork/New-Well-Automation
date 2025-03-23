import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Plus,
  Trash2,
  Save,
  Users,
  Clock,
  Settings,
  AlertCircle,
} from "lucide-react";

interface SurveyEmailSettingsProps {
  emailEnabled?: boolean;
  onToggleEmail?: (enabled: boolean) => void;
  recipients?: string[];
  onUpdateRecipients?: (recipients: string[]) => void;
  surveys?: any[];
}

const SurveyEmailSettings = ({
  emailEnabled = false,
  onToggleEmail = () => {},
  recipients = [
    "john.operator@oiltech.com",
    "directional.team@oiltech.com",
    "rig.supervisor@oiltech.com",
  ],
  onUpdateRecipients = () => {},
  surveys = [],
}: SurveyEmailSettingsProps) => {
  const [newRecipient, setNewRecipient] = useState("");
  const [activeTab, setActiveTab] = useState("recipients");
  const [emailSettings, setEmailSettings] = useState({
    sendOnSave: true,
    sendDaily: false,
    dailyTime: "06:00",
    includeImages: true,
    includeTorqueDrag: false,
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeCurveData, setIncludeCurveData] = useState(false);
  const [latestSurvey, setLatestSurvey] = useState({});

  useEffect(() => {
    if (surveys.length > 0) {
      setLatestSurvey(surveys[0]);
    }
  }, [surveys]);

  const handleAddRecipient = () => {
    if (
      newRecipient &&
      !recipients.includes(newRecipient) &&
      validateEmail(newRecipient)
    ) {
      const updatedRecipients = [...recipients, newRecipient];
      onUpdateRecipients(updatedRecipients);
      setNewRecipient("");
    } else {
      alert("Invalid email address");
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleRemoveRecipient = (email) => {
    if (
      window.confirm(`Are you sure you want to remove ${email} as a recipient?`)
    ) {
      const updatedRecipients = recipients.filter((r) => r !== email);
      onUpdateRecipients(updatedRecipients);
    }
  };

  const handleSettingChange = (setting: string, value: any) => {
    setEmailSettings({
      ...emailSettings,
      [setting]: value,
    });
  };

  const handleSaveSettings = () => {
    setSaving(true);
    // Save the email settings
    setTimeout(() => {
      setSaving(false);
      alert("Email settings saved successfully");
    }, 1000);
  };

  const handleTestEmail = () => {
    const emailBody = getHtmlEmailBody();
    const emailSubject = "Survey Report - Well Alpha-123";
    const emailTo = recipients.join(",");
    const emailCC = "";
    const emailBCC = "";

    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${emailTo}&cc=${emailCC}&bcc=${emailBCC}&subject=${emailSubject}&body=${encodeURIComponent(emailBody)}`;
    window.open(outlookUrl, "_blank");
  };

  const getHtmlEmailBody = () => {
    let html = `
      <div>
        <h3>Survey Report - Well Alpha-123</h3>
        <p>This is a preview of the email that will be sent</p>
      </div>
      <div>
        <h4>Latest Survey Details</h4>
        <div>
          <p>Measured Depth: ${latestSurvey.measuredDepth}</p>
          <p>Inclination: ${latestSurvey.inclination}</p>
          <p>Azimuth: ${latestSurvey.azimuth}</p>
        </div>
      </div>
    `;

    if (includeCurveData) {
      html += `
        <div>
          <h4>Curve Data</h4>
          <div>
            <p>Curve 1: ${latestSurvey.curve1}</p>
            <p>Curve 2: ${latestSurvey.curve2}</p>
            <p>Curve 3: ${latestSurvey.curve3}</p>
          </div>
        </div>
      `;
    }

    return html;
  };

  const predefinedGroups = [
    { id: "directional", name: "Directional Team", count: 5 },
    { id: "company", name: "Company Representatives", count: 3 },
    { id: "rig", name: "Rig Crew", count: 8 },
    { id: "engineers", name: "Engineers", count: 4 },
  ];

  const filteredRecipients = recipients.filter((recipient) =>
    recipient.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Card className="w-full bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg font-medium text-gray-200">
              Survey Email Automation
            </CardTitle>
            {emailEnabled && (
              <Badge
                variant="outline"
                className="bg-green-900/30 text-green-400 border-green-800"
              >
                ENABLED
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="email-toggle" className="text-sm text-gray-400">
              Email Automation
            </Label>
            <Switch
              id="email-toggle"
              checked={emailEnabled}
              onCheckedChange={onToggleEmail}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs
          defaultValue="recipients"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-gray-800 mb-4">
            <TabsTrigger value="recipients">
              <Users className="h-4 w-4 mr-2" />
              Recipients
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Mail className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipients" className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-200"
                />
              </div>
              <Button
                onClick={handleAddRecipient}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="border border-gray-800 rounded-md">
              <div className="p-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-800">
                Current Recipients
              </div>
              <ScrollArea className="h-[200px] p-2">
                {filteredRecipients.length > 0 ? (
                  <ul className="space-y-2">
                    {filteredRecipients.map((email) => (
                      <li
                        key={email}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md"
                      >
                        <span className="text-sm text-gray-300">{email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-800"
                          onClick={() => handleRemoveRecipient(email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No recipients added</p>
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="border border-gray-800 rounded-md">
              <div className="p-2 bg-gray-800 text-sm font-medium text-gray-300 border-b border-gray-800">
                Predefined Groups
              </div>
              <div className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  {predefinedGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center p-2 bg-gray-800/50 rounded-md"
                    >
                      <Checkbox id={`group-${group.id}`} className="mr-2" />
                      <div>
                        <Label
                          htmlFor={`group-${group.id}`}
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          {group.name}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {group.count} recipients
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="send-on-save"
                    className="text-sm text-gray-300"
                  >
                    Send on Survey Save
                  </Label>
                  <span className="text-xs text-gray-500">
                    Automatically send email when a new survey is saved
                  </span>
                </div>
                <Switch
                  id="send-on-save"
                  checked={emailSettings.sendOnSave}
                  onCheckedChange={(checked) =>
                    handleSettingChange("sendOnSave", checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label htmlFor="send-daily" className="text-sm text-gray-300">
                    Send Daily Summary
                  </Label>
                  <span className="text-xs text-gray-500">
                    Send a daily summary of all surveys
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="send-daily"
                    checked={emailSettings.sendDaily}
                    onCheckedChange={(checked) =>
                      handleSettingChange("sendDaily", checked)
                    }
                    className="data-[state=checked]:bg-blue-600"
                  />
                  {emailSettings.sendDaily && (
                    <Input
                      type="time"
                      value={emailSettings.dailyTime}
                      onChange={(e) =>
                        handleSettingChange("dailyTime", e.target.value)
                      }
                      className="w-24 bg-gray-800 border-gray-700 text-gray-200"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="include-images"
                    className="text-sm text-gray-300"
                  >
                    Include Visualizations
                  </Label>
                  <span className="text-xs text-gray-500">
                    Include survey visualizations in email
                  </span>
                </div>
                <Switch
                  id="include-images"
                  checked={emailSettings.includeImages}
                  onCheckedChange={(checked) =>
                    handleSettingChange("includeImages", checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <Label
                    htmlFor="include-torque-drag"
                    className="text-sm text-gray-300"
                  >
                    Include Torque & Drag
                  </Label>
                  <span className="text-xs text-gray-500">
                    Include torque & drag analysis in email
                  </span>
                </div>
                <Switch
                  id="include-torque-drag"
                  checked={emailSettings.includeTorqueDrag}
                  onCheckedChange={(checked) =>
                    handleSettingChange("includeTorqueDrag", checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border border-gray-800 rounded-md p-4 bg-gray-800/30">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-300 mb-1">
                  Survey Report - Well Alpha-123
                </h3>
                <p className="text-sm text-gray-500">
                  This is a preview of the email that will be sent
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Latest Survey Details
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Measured Depth</p>
                      <p className="text-gray-300">
                        {latestSurvey.measuredDepth}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Inclination</p>
                      <p className="text-gray-300">
                        {latestSurvey.inclination}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Azimuth</p>
                      <p className="text-gray-300">{latestSurvey.azimuth}</p>
                    </div>
                  </div>
                </div>

                {includeCurveData && (
                  <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Curve Data
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Curve 1</p>
                        <p className="text-gray-300">{latestSurvey.curve1}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Curve 2</p>
                        <p className="text-gray-300">{latestSurvey.curve2}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Curve 3</p>
                        <p className="text-gray-300">{latestSurvey.curve3}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <h4 className="text-sm font-medium text-gray-300">
                      Survey Quality Check
                    </h4>
                  </div>
                  <p className="text-sm text-gray-300">
                    All parameters within acceptable ranges
                  </p>
                </div>

                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <h4 className="text-sm font-medium text-gray-300">
                      Survey Timestamp
                    </h4>
                  </div>
                  <p className="text-sm text-gray-300">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-500">
                  This email was automatically generated by the MWD Surface
                  Software. Please do not reply to this email.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Switch
                id="include-curve-data"
                checked={includeCurveData}
                onCheckedChange={(checked) => setIncludeCurveData(checked)}
                className="data-[state=checked]:bg-blue-600 mr-2"
              />
              <Button
                variant="outline"
                className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                onClick={handleTestEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SurveyEmailSettings;
