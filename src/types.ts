/**
 * GlassKeep Type Definitions
 * 
 * This file contains all TypeScript interfaces and types used throughout the application.
 * Import types from here to maintain consistency across the codebase.
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User account information
 */
export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  notesCount?: number;
  storageUsed?: number;
}

/**
 * User registration data
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * User login data
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================================================
// NOTE TYPES
// ============================================================================

/**
 * Supported note types
 */
export type NoteType = 'text' | 'checklist' | 'draw';

/**
 * Note colors
 */
export type NoteColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

/**
 * Base note interface
 */
export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NoteType;
  color?: NoteColor;
  tags: string[];
  pinned: boolean;
  pinned_to_dashboard?: boolean;
  archived: boolean;
  images: string[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
  lastEditedBy?: string;
  lastEditedAt?: Date;
}

/**
 * Checklist item
 */
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
}

/**
 * Note with checklist items
 */
export interface NoteWithItems extends Note {
  items?: ChecklistItem[];
}

/**
 * Note creation data
 */
export interface CreateNoteData {
  type: NoteType;
  title: string;
  content?: string;
  color?: NoteColor;
  tags?: string[];
  pinned?: boolean;
  items?: ChecklistItem[];
}

/**
 * Note update data
 */
export interface UpdateNoteData {
  title?: string;
  content?: string;
  color?: NoteColor;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  items?: ChecklistItem[];
}

/**
 * Note search filters
 */
export interface NoteFilters {
  query?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  type?: NoteType;
}

// ============================================================================
// COLLABORATION TYPES
// ============================================================================

/**
 * Note collaborator
 */
export interface Collaborator {
  userId: string;
  userName: string;
  email: string;
  addedBy: string;
  addedAt: Date;
}

/**
 * SSE event types
 */
export type SSEEventType = 
  | 'note_updated' 
  | 'collaborator_added' 
  | 'collaborator_removed' 
  | 'note_deleted';

/**
 * SSE event data
 */
export interface SSEEvent {
  type: SSEEventType;
  note?: Note;
  collaborator?: Collaborator;
  timestamp: Date;
}

// ============================================================================
// DASHBOARD WIDGET TYPES
// ============================================================================

/**
 * Dashboard widget types
 */
export type DashboardWidgetType = 
  | 'notes' 
  | 'rss' 
  | 'youtube' 
  | 'quick-note' 
  | 'weather' 
  | 'calendar';

/**
 * Dashboard widget position
 */
export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  position: WidgetPosition;
  config: Record<string, any>;
  enabled: boolean;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

/**
 * Theme type
 */
export type ThemeType = 'light' | 'dark' | 'system';

/**
 * Theme settings
 */
export interface ThemeSettings {
  type: ThemeType;
  preset?: string;
  background?: string;
  glassEffect?: boolean;
}

/**
 * User settings
 */
export interface UserSettings {
  theme: ThemeSettings;
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
  timezone: string;
}

/**
 * AI settings
 */
export interface AISettings {
  enabled: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Modal props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Toast notification props
 */
export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Error context for logging
 */
export interface ErrorContext {
  message: string;
  stack?: string;
  componentStack?: string;
  errorBoundary?: boolean;
  timestamp?: string;
  userId?: string;
  route?: string;
}

/**
 * Application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, public details: any) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of type T
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Omit keys from type
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Optional type
 */
export type Optional<T> = T | undefined;