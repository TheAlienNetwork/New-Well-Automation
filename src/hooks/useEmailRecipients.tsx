import { useState, useEffect } from "react";

export interface UseEmailRecipientsProps {
  initialRecipients?: string[];
  onUpdateRecipients?: (recipients: string[]) => void;
}

export interface PredefinedGroup {
  id: string;
  name: string;
  count: number;
  emails: string[];
}

// Local storage key for predefined groups
const PREDEFINED_GROUPS_STORAGE_KEY = "mwd_predefined_email_groups";

// Default predefined groups
const defaultPredefinedGroups: PredefinedGroup[] = [
  {
    id: "directional",
    name: "Directional Team",
    count: 5,
    emails: [
      "directional.lead@oiltech.com",
      "mwd.engineer@oiltech.com",
      "directional.driller@oiltech.com",
      "survey.analyst@oiltech.com",
      "directional.supervisor@oiltech.com",
    ],
  },
  {
    id: "company",
    name: "Company Representatives",
    count: 3,
    emails: [
      "company.man@oiltech.com",
      "drilling.engineer@oiltech.com",
      "operations.manager@oiltech.com",
    ],
  },
  {
    id: "rig",
    name: "Rig Crew",
    count: 4,
    emails: [
      "toolpusher@oiltech.com",
      "driller@oiltech.com",
      "rig.manager@oiltech.com",
      "rig.supervisor@oiltech.com",
    ],
  },
  {
    id: "engineers",
    name: "Engineers",
    count: 4,
    emails: [
      "drilling.engineer@oiltech.com",
      "reservoir.engineer@oiltech.com",
      "completion.engineer@oiltech.com",
      "production.engineer@oiltech.com",
    ],
  },
];

export const useEmailRecipients = ({
  initialRecipients = [],
  onUpdateRecipients = () => {},
}: UseEmailRecipientsProps) => {
  const [recipients, setRecipients] = useState<string[]>(initialRecipients);
  const [newRecipient, setNewRecipient] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [predefinedGroups, setPredefinedGroups] = useState<PredefinedGroup[]>(
    [],
  );

  // New state for group editing
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<PredefinedGroup | null>(
    null,
  );
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmails, setNewGroupEmails] = useState("");

  // Load predefined groups from localStorage on mount
  useEffect(() => {
    try {
      const storedGroups = localStorage.getItem(PREDEFINED_GROUPS_STORAGE_KEY);
      if (storedGroups) {
        setPredefinedGroups(JSON.parse(storedGroups));
      } else {
        // Use default groups if none are stored
        setPredefinedGroups(defaultPredefinedGroups);
        // Save default groups to localStorage
        localStorage.setItem(
          PREDEFINED_GROUPS_STORAGE_KEY,
          JSON.stringify(defaultPredefinedGroups),
        );
      }
    } catch (error) {
      console.error("Error loading predefined groups:", error);
      setPredefinedGroups(defaultPredefinedGroups);
    }
  }, []);

  // Save predefined groups to localStorage whenever they change
  useEffect(() => {
    if (predefinedGroups.length > 0) {
      localStorage.setItem(
        PREDEFINED_GROUPS_STORAGE_KEY,
        JSON.stringify(predefinedGroups),
      );
    }
  }, [predefinedGroups]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleAddRecipient = () => {
    if (!newRecipient) {
      alert("Please enter an email address");
      return;
    }

    if (!validateEmail(newRecipient)) {
      alert("Invalid email address format");
      return;
    }

    if (recipients.includes(newRecipient)) {
      alert("This email address is already in the recipients list");
      return;
    }

    const updatedRecipients = [...recipients, newRecipient];
    setRecipients(updatedRecipients);
    onUpdateRecipients(updatedRecipients);
    setNewRecipient("");
  };

  const handleRemoveRecipient = (email: string) => {
    const updatedRecipients = recipients.filter((r) => r !== email);
    setRecipients(updatedRecipients);
    onUpdateRecipients(updatedRecipients);
  };

  const handleAddGroup = (groupId: string) => {
    const group = predefinedGroups.find((g) => g.id === groupId);
    if (!group) return;

    // Filter out emails that are already in the recipients list
    const newEmails = group.emails.filter(
      (email) => !recipients.includes(email),
    );

    if (newEmails.length === 0) {
      alert("All emails from this group are already in the recipients list");
      return;
    }

    const updatedRecipients = [...recipients, ...newEmails];
    setRecipients(updatedRecipients);
    onUpdateRecipients(updatedRecipients);
  };

  // New functions for managing predefined groups
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    // Parse and validate emails
    const emailList = newGroupEmails
      .split(/[,;\n]/) // Split by comma, semicolon, or newline
      .map((email) => email.trim())
      .filter((email) => email && validateEmail(email));

    if (emailList.length === 0) {
      alert("Please enter at least one valid email address");
      return;
    }

    // Check if group name already exists
    if (predefinedGroups.some((g) => g.name === newGroupName)) {
      alert("A group with this name already exists");
      return;
    }

    // Create new group
    const newGroup: PredefinedGroup = {
      id: `group-${Date.now()}`, // Generate unique ID
      name: newGroupName,
      count: emailList.length,
      emails: emailList,
    };

    // Add to predefined groups
    setPredefinedGroups([...predefinedGroups, newGroup]);

    // Reset form
    setNewGroupName("");
    setNewGroupEmails("");
    setIsEditingGroup(false);
    setCurrentGroup(null);
  };

  const handleEditGroup = (group: PredefinedGroup) => {
    setCurrentGroup(group);
    setNewGroupName(group.name);
    setNewGroupEmails(group.emails.join("\n"));
    setIsEditingGroup(true);
  };

  const handleUpdateGroup = () => {
    if (!currentGroup) return;

    if (!newGroupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    // Parse and validate emails
    const emailList = newGroupEmails
      .split(/[,;\n]/)
      .map((email) => email.trim())
      .filter((email) => email && validateEmail(email));

    if (emailList.length === 0) {
      alert("Please enter at least one valid email address");
      return;
    }

    // Check if group name already exists (excluding current group)
    if (
      predefinedGroups.some(
        (g) => g.name === newGroupName && g.id !== currentGroup.id,
      )
    ) {
      alert("A group with this name already exists");
      return;
    }

    // Update group
    const updatedGroups = predefinedGroups.map((g) =>
      g.id === currentGroup.id
        ? {
            ...g,
            name: newGroupName,
            emails: emailList,
            count: emailList.length,
          }
        : g,
    );

    setPredefinedGroups(updatedGroups);

    // Reset form
    setNewGroupName("");
    setNewGroupEmails("");
    setIsEditingGroup(false);
    setCurrentGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      const updatedGroups = predefinedGroups.filter((g) => g.id !== groupId);
      setPredefinedGroups(updatedGroups);
    }
  };

  const handleCancelEdit = () => {
    setNewGroupName("");
    setNewGroupEmails("");
    setIsEditingGroup(false);
    setCurrentGroup(null);
  };

  const filteredRecipients = recipients.filter((recipient) =>
    recipient.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return {
    recipients,
    filteredRecipients,
    newRecipient,
    searchQuery,
    predefinedGroups,
    setNewRecipient,
    setSearchQuery,
    handleAddRecipient,
    handleRemoveRecipient,
    handleAddGroup,
    // New group management functions
    isEditingGroup,
    currentGroup,
    newGroupName,
    newGroupEmails,
    setNewGroupName,
    setNewGroupEmails,
    handleCreateGroup,
    handleEditGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleCancelEdit,
    setIsEditingGroup,
  };
};
