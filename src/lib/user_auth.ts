import { auth, db } from "./firebase"; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, type FieldValue } from "firebase/firestore";

export const SUPERADMIN_EMAIL = "penghulusystem@gmail.com";
export type UserRole = "Applicant" | "Admin" | "SuperAdmin";

export interface UserProfile {
  uid: string;
  
  email: string;
  role: UserRole;
  createdAt: FieldValue;
  
  // Auto-filled via MyKad OCR Scan
  name?: string;
  icNumber?: string;
  addressIC?: string;
  gender?: string;
  religion?: string;
  citizenship?: string;
  
  // Manual Profile Setup
  addressCurrent?: string;
  maritalStatus?: string;
  occupation?: string;
  monthlyIncome?: number;
  phoneNumber?: string;

  // Staff Credentials (Sprint 2)
  staffId?: string;
  department?: string;
  district?: string;
}

export type RegistrationPayload = Omit<UserProfile, "uid" | "role" | "createdAt" | "email">;

function getRoleForEmail(email: string, role: UserRole): UserRole {
  return email.trim().toLowerCase() === SUPERADMIN_EMAIL ? "SuperAdmin" : role;
}

function isSuperAdminEmail(email: string) {
  return email.trim().toLowerCase() === SUPERADMIN_EMAIL;
}

function normalizeUserProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    role: getRoleForEmail(profile.email, profile.role),
  };
}

export const signIn = async (email: string, password: string): Promise<UserProfile> => {
  // 1. Authenticate via Firebase
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // 2. Fetch the profile from Firestore
  const userDocRef = doc(db, "users", firebaseUser.uid);
  const userDocSnap = await getDoc(userDocRef);
  const resolvedEmail = firebaseUser.email || email;

  if (!userDocSnap.exists()) {
    if (isSuperAdminEmail(resolvedEmail)) {
      const superAdminProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: resolvedEmail,
        role: "SuperAdmin",
        createdAt: serverTimestamp(),
        name: "Penghulu System Superadmin",
        staffId: "SUPERADMIN",
        department: "Penghulu Office",
        district: "All Mukims",
      };

      await setDoc(userDocRef, superAdminProfile);
      return superAdminProfile;
    }

    throw new Error("User account records not found in the system database.");
  }

  // 3. Return the fully typed schema
  const profile = normalizeUserProfile({
    uid: firebaseUser.uid,
    ...(userDocSnap.data() as Omit<UserProfile, "uid">)
  });

  if (profile.role === "SuperAdmin" && userDocSnap.data().role !== "SuperAdmin") {
    await setDoc(userDocRef, { role: "SuperAdmin" }, { merge: true });
  }

  return profile;
};

export const registerAccount = async (
  email: string, 
  password: string, 
  profileData: RegistrationPayload
): Promise<UserProfile> => {
  
  // 1. Create the base authentication credentials
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // 2. Construct the full user object using your exact schema constraints
  const newUserProfile: UserProfile = {
    uid: firebaseUser.uid,
    email: email,
    role: getRoleForEmail(email, "Applicant"),
    createdAt: serverTimestamp(),
    
    ...profileData, 
  };

  // 3. Save to the 'users' collection in Firestore
  await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);

  return newUserProfile;
};

export const registerStaffAccount = async (
  email: string,
  password: string,
  profileData: { name: string; staffId: string; department: string; district: string; role?: UserRole; }
): Promise<UserProfile> => {
  // 1. Create the base authentication credentials
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // 2. Construct the admin profile using staff parameters
  const newUserProfile: UserProfile = {
    uid: firebaseUser.uid,
    email: email,
    role: getRoleForEmail(email, profileData.role || "Admin"),
    createdAt: serverTimestamp(),
    name: profileData.name,
    staffId: profileData.staffId,
    department: profileData.department,
    district: profileData.district,
  };

  // 3. Save to the 'users' collection in Firestore
  await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);

  return newUserProfile;
};

export const signInWithStaffId = async (
  staffId: string,
  password: string
): Promise<UserProfile> => {
  // 1. Query users collection to find the document with matching staffId
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("staffId", "==", staffId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Invalid Staff ID. No account found.");
  }

  const userDoc = querySnapshot.docs[0];
  const userData = userDoc.data();
  const email = userData.email;

  if (!email) {
    throw new Error("No email associated with this Staff ID.");
  }

  // 2. Authenticate the corresponding email with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  return normalizeUserProfile({
    uid: firebaseUser.uid,
    ...(userData as Omit<UserProfile, "uid">)
  });
};
