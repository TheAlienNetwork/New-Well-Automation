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
}

interface UserContextType {
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateProfileImage: (imageUrl: string | null) => void;
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

// Export as a named function declaration
export function UserProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] =
    useState<UserProfile>(defaultUserProfile);

  // Use the external functions with the state setter
  const updateUserProfile = (profile: Partial<UserProfile>) => {
    updateUserProfileFn(setUserProfile, profile);
  };

  const updateProfileImage = (imageUrl: string | null) => {
    updateProfileImageFn(setUserProfile, imageUrl);
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        updateUserProfile,
        updateProfileImage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Export as a named function declaration
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
