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
}

interface UserContextType {
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateProfileImage: (imageUrl: string | null) => void;
}

const defaultUserProfile: UserProfile = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@newwelltech.com",
  phone: "(555) 123-4567",
  position: "MWD Engineer",
  company: "New Well Technologies",
  location: "Houston, TX",
  bio: "Experienced MWD engineer with expertise in directional drilling operations.",
  emailSignature:
    "John Doe\nMWD Engineer\nNew Well Technologies\nPhone: (555) 123-4567\nEmail: john.doe@newwelltech.com",
  profileImage: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userProfile, setUserProfile] =
    useState<UserProfile>(defaultUserProfile);

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({
      ...prev,
      ...profile,
    }));
  };

  const updateProfileImage = (imageUrl: string | null) => {
    setUserProfile((prev) => ({
      ...prev,
      profileImage: imageUrl,
    }));
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
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
