import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database as DatabaseIcon,
  Plus,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  FileDown,
  Save,
} from "lucide-react";

interface DatabaseInfo {
  id: string;
  name: string;
  created_at: string;
  size: string;
  tables_count: number;
  last_modified: string;
  is_active: boolean;
  description?: string;
  user_id?: string;
}

interface DatabaseManagementProps {
  databases: DatabaseInfo[];
  selectedDatabaseId: string | null;
  isLoading: boolean;
  operationType: string;
  onRefresh: () => void;
  onCreateClick: () => void;
  onSelectDatabase: (databaseId: string) => void;
  onDeleteClick: (databaseId: string) => void;
  onBackupClick: () => void;
  onRestoreClick: () => void;
  onDownloadClick: () => void;
}

const DatabaseManagement: React.FC<DatabaseManagementProps> = ({
  databases,
  selectedDatabaseId,
  isLoading,
  operationType,
  onRefresh,
  onCreateClick,
  onSelectDatabase,
  onDeleteClick,
  onBackupClick,
  onRestoreClick,
  onDownloadClick,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-200">
          Database Management
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            onClick={onRefresh}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading && operationType === "fetching" ? "animate-spin" : ""}`}
            />
            {isLoading && operationType === "fetching"
              ? "Refreshing..."
              : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
            onClick={onCreateClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Database
          </Button>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg font-medium text-gray-200">
              Available Databases
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-800">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tables
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {!databases || databases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No databases found. Create a new database to get started.
                    </td>
                  </tr>
                ) : (
                  databases.map((db) => (
                    <tr
                      key={db.id}
                      className={`hover:bg-gray-800/30 ${db.id === selectedDatabaseId ? "bg-blue-900/20" : ""}`}
                      onClick={() => onSelectDatabase(db.id)}
                    >
                      <td className="px-4 py-2 text-sm font-medium">
                        {db.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">
                        {new Date(db.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">
                        {db.size}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">
                        {db.tables_count}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">
                        {new Date(db.last_modified).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {db.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClick(db.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800 shadow-lg overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5 text-green-400" />
              <CardTitle className="text-lg font-medium text-gray-200">
                Database Operations
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">
                Selected Database
              </h3>
              {selectedDatabaseId && databases && databases.length > 0 ? (
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">
                      {
                        databases.find((db) => db.id === selectedDatabaseId)
                          ?.name
                      }
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Created:{" "}
                    {new Date(
                      databases.find((db) => db.id === selectedDatabaseId)
                        ?.created_at || "",
                    ).toLocaleDateString()}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Last Modified:{" "}
                    {new Date(
                      databases.find((db) => db.id === selectedDatabaseId)
                        ?.last_modified || "",
                    ).toLocaleDateString()}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Description:{" "}
                    {databases.find((db) => db.id === selectedDatabaseId)
                      ?.description || "No description"}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-800/50 rounded-md border border-gray-800 text-gray-500">
                  No database selected
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">
                Database Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                  onClick={onBackupClick}
                  disabled={!selectedDatabaseId || isLoading}
                >
                  {isLoading && operationType === "backing up" ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Backing up...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                  onClick={onRestoreClick}
                  disabled={isLoading}
                >
                  {isLoading && operationType === "restoring" ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Restore Database
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                  onClick={onDownloadClick}
                  disabled={!selectedDatabaseId || isLoading}
                >
                  {isLoading && operationType === "downloading" ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseManagement;
