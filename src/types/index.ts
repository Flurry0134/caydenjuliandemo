export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
  lastLogin?: Date;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  url: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  preview?: string;
  systemPrompt?: string;
  files: ChatFile[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  url: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  username: string;
  action: string;
  ipAddress: string;
}

export interface BrandingSettings {
  primaryColor: string;
  logo?: string;
  roundedCorners: boolean;
}

export type Language = 'de' | 'en';

export type ExportFormat = 'pdf' | 'txt' | 'json';