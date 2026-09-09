import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "./firebaseAdmin";

export function getAdminAuth() {
  return getAuth(getAdminApp());
}