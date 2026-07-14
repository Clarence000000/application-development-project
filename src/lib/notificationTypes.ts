export type NotificationEventType =
  | "application_submitted"
  | "status_updated"
  | "document_requested";

export type NotificationPreferences = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  applicationSubmitted: boolean;
  statusUpdates: boolean;
  documentRequests: boolean;
};

export type EmailNotificationPayload = {
  uid: string;
  recipientEmail: string;
  recipientName?: string;
  notificationId?: string;
  applicationId?: string;
  referenceNumber?: string;
  applicationTitle: string;
  eventType: NotificationEventType;
  status?: string;
  message?: string;
  actionUrl?: string;
};

export type NotificationHistoryItem = {
  id: string;
  uid: string;
  title: string;
  message: string;
  applicationId?: string;
  referenceNumber?: string;
  applicationTitle?: string;
  eventType: NotificationEventType;
  deliveryChannel: "in_app" | "email" | "sms";
  deliveryStatus: "sent" | "failed" | "disabled";
  emailStatus?: "sent" | "failed" | "disabled";
  smsStatus?: "sent" | "failed" | "disabled";
  recipient?: string;
  read: boolean;
  createdAt: Date | null;
};

export type InAppNotificationPayload = {
  uid: string;
  title: string;
  message: string;
  applicationId?: string;
  referenceNumber?: string;
  applicationTitle?: string;
  eventType: NotificationEventType;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  emailEnabled: true,
  smsEnabled: false,
  applicationSubmitted: true,
  statusUpdates: true,
  documentRequests: true,
};
