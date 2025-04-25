import { useState } from "react";

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

export const useEmailRecipients = ({
  initialRecipients = [],
  onUpdateRecipients = () => {},
}: UseEmailRecipientsProps) => {
  const [recipients, setRecipients] = useState<string[]>(initialRecipients);
  const [newRecipient, setNewRecipient] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Predefined groups
  const predefinedGroups: PredefinedGroup[] = [
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
  };
};
