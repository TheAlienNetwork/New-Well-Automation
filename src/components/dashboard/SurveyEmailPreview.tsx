import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SurveyEmailPreviewProps {
  emailSubject: string;
  emailBody: string;
  signature?: string;
}

const SurveyEmailPreview = ({
  emailSubject,
  emailBody,
  signature = "",
}: SurveyEmailPreviewProps) => {
  return (
    <Card className="w-full h-auto bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-sm text-gray-500">Email Preview</div>
        </div>

        <div className="flex flex-col">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Subject:</div>
            <div className="text-base font-medium">{emailSubject}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Body:</div>
            <div className="text-sm whitespace-pre-wrap">{emailBody}</div>
          </div>

          {signature && (
            <div className="mt-4 pt-2 border-t border-gray-200">
              <div className="text-sm whitespace-pre-wrap text-gray-700">
                {signature}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SurveyEmailPreview;
