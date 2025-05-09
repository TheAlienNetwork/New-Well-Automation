import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  location: string;
  bio: string;
  emailSignature: string;
  profileImage: string | null;
  wellName?: string;
  rigName?: string;
  sensorOffset?: number;
  currentWellId?: string;
}

interface UserContextType {
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateProfileImage: (imageUrl: string | null) => void;
  setCurrentWell: (wellId: string | null) => void;
  clearCurrentWell: () => void;
}

const defaultUserProfile: UserProfile = {
  firstName: "New Well Technology",
  lastName: "New Well",
  email: "NewWelltech@newwelltech.com",
  phone: "(555) 123-4567",
  position: "MWD Engineer",
  company: "New Well Technologies",
  location: "Houston, TX",
  bio: "Experienced MWD engineer with expertise in directional drilling operations.",
  emailSignature:
    "New Well\nMWD Engineer\nNew Well Technologies\nPhone: (555) 123-4567\nEmail: john.doe@newwelltech.com",
  profileImage: null,
  wellName: localStorage.getItem("wellName") || "Alpha-123",
  rigName: localStorage.getItem("rigName") || "Precision Drilling #42",
  sensorOffset: Number(localStorage.getItem("sensorOffset")) || 0,
  currentWellId: localStorage.getItem("currentWellId") || null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Define update functions outside of any component
function updateUserProfileFn(
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>,
  profile: Partial<UserProfile>,
) {
  setUserProfile((prev) => ({
    ...prev,
    ...profile,
  }));
}

function updateProfileImageFn(
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>,
  imageUrl: string | null,
) {
  setUserProfile((prev) => ({
    ...prev,
    profileImage: imageUrl,
  }));
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] =
    useState<UserProfile>(defaultUserProfile);

  // Use the external functions with the state setter
  const updateUserProfile = (profile: Partial<UserProfile>) => {
    updateUserProfileFn(setUserProfile, profile);

    // Save well-related data to localStorage for persistence
    if (profile.wellName) localStorage.setItem("wellName", profile.wellName);
    if (profile.rigName) localStorage.setItem("rigName", profile.rigName);
    if (profile.sensorOffset !== undefined)
      localStorage.setItem("sensorOffset", profile.sensorOffset.toString());
    if (profile.currentWellId)
      localStorage.setItem("currentWellId", profile.currentWellId);
  };

  const updateProfileImage = (imageUrl: string | null) => {
    updateProfileImageFn(setUserProfile, imageUrl);
  };

  const setCurrentWell = (wellId: string | null) => {
    // Store the previous well ID before updating
    const previousWellId = userProfile.currentWellId;

    if (wellId) {
      // Update the user profile with the new well ID
      updateUserProfile({ currentWellId: wellId });

      // If the well ID has changed, trigger a custom event to notify other components
      if (previousWellId !== wellId) {
        // First, clear surveys from localStorage immediately to prevent any confusion
        localStorage.removeItem("mwd_surveys_data");

        // Store the current well ID in localStorage for persistence
        localStorage.setItem("currentWellId", wellId);
        localStorage.setItem("lastWellId", wellId);

        // Dispatch a custom event that SurveyContext can listen for immediately
        const wellChangeEvent = new CustomEvent("wellChanged", {
          detail: { previousWellId, newWellId: wellId },
        });
        window.dispatchEvent(wellChangeEvent);

        console.log(
          "Well changed from",
          previousWellId,
          "to",
          wellId,
          "- dispatched wellChanged event",
        );
      }
    } else if (previousWellId) {
      // Handle case when wellId is null but we had a previous well
      // This ensures we clear surveys when deselecting a well too
      updateUserProfile({ currentWellId: null });

      // Clear surveys immediately
      localStorage.removeItem("mwd_surveys_data");
      localStorage.removeItem("currentWellId");
      localStorage.removeItem("lastWellId");

      const wellChangeEvent = new CustomEvent("wellChanged", {
        detail: { previousWellId, newWellId: null },
      });
      window.dispatchEvent(wellChangeEvent);

      console.log("Well deselected - dispatched wellChanged event");
    }
  };

  const clearCurrentWell = () => {
    // Clear user profile data
    updateUserProfile({
      currentWellId: null,
      wellName: "",
      rigName: "",
      sensorOffset: 0,
    });

    // Clear localStorage data
    localStorage.removeItem("currentWellId");
    localStorage.removeItem("wellName");
    localStorage.removeItem("rigName");
    localStorage.removeItem("sensorOffset");

    console.log("Cleared current well data from user profile and localStorage");
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        updateUserProfile,
        updateProfileImage,
        setCurrentWell,
        clearCurrentWell,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
