import { auth, db } from "./firebase"; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  
  email: string;
  role: "Applicant" | "Admin" | "SuperAdmin";
  createdAt: any;
  
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
}

export type RegistrationPayload = Omit<UserProfile, "uid" | "role" | "createdAt" | "email">;

export const signIn = async (email: string, password: string): Promise<UserProfile> => {
  // 1. Authenticate via Firebase
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // 2. Fetch the profile from Firestore
  const userDocRef = doc(db, "users", firebaseUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists()) {
    throw new Error("User account records not found in the system database.");
  }

  // 3. Return the fully typed schema
  return {
    uid: firebaseUser.uid,
    ...(userDocSnap.data() as Omit<UserProfile, "uid">)
  };
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
    role: "Applicant",
    createdAt: serverTimestamp(),
    
    ...profileData, 
  };

  // 3. Save to the 'users' collection in Firestore
  await setDoc(doc(db, "users", firebaseUser.uid), newUserProfile);

  return newUserProfile;
};