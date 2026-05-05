/**
 * E-Signature System Type Definitions
 * Redeem Rocket Multi-Tenant Platform
 * Version: 1.0.0
 * Date: May 2026
 *
 * This file contains all TypeScript interfaces and types for the E-Signature system.
 * Use these types across all frontend and backend code for type safety.
 */

// ============================================================================
// ENUMERATIONS
// ============================================================================

export enum DocumentStatus {
  DRAFT = "draft",
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  SIGNED = "signed",
  DECLINED = "declined",
  EXPIRED = "expired",
  ARCHIVED = "archived"
}

export enum SignRequestStatus {
  PENDING = "pending",
  VIEWED = "viewed",
  IN_PROGRESS = "in_progress",
  SIGNED = "signed",
  DECLINED = "declined",
  EXPIRED = "expired",
  RESENT = "resent"
}

export enum SigningMode {
  SEQUENTIAL = "sequential",
  PARALLEL = "parallel"
}

export enum SignatureType {
  DRAWN = "drawn",
  TYPED = "typed",
  UPLOADED = "uploaded",
  BIOMETRIC = "biometric"
}

export enum SignatureFormat {
  SVG = "svg",
  PNG = "png",
  IMAGE = "image",
  JWT_TOKEN = "jwt_token"
}

export enum SignerRole {
  CUSTOMER = "customer",
  MERCHANT = "merchant",
  MANAGER = "manager",
  ADMIN = "admin",
  WITNESS = "witness"
}

export enum DocumentType {
  CONTRACT = "contract",
  AGREEMENT = "agreement",
  APPROVAL = "approval",
  RECEIPT = "receipt",
  CONFIRMATION = "confirmation",
  TERM_AND_CONDITIONS = "terms"
}

export enum SignatureFieldType {
  SIGNATURE = "signature",
  INITIALS = "initials",
  DATE = "date",
  TEXT = "text",
  CHECKBOX = "checkbox"
}

export enum AuditEventType {
  DOCUMENT_CREATED = "document_created",
  DOCUMENT_UPLOADED = "document_uploaded",
  DOCUMENT_UPDATED = "document_updated",
  DOCUMENT_DELETED = "document_deleted",
  DOCUMENT_ARCHIVED = "document_archived",
  SIGN_REQUEST_CREATED = "sign_request_created",
  SIGN_REQUEST_SENT = "sign_request_sent",
  SIGN_REQUEST_RESENT = "sign_request_resent",
  SIGNATURE_STARTED = "signature_started",
  SIGNATURE_ADDED = "signature_added",
  SIGNATURE_DECLINED = "signature_declined",
  DOCUMENT_STATUS_CHANGED = "document_status_changed",
  REQUEST_STATUS_CHANGED = "request_status_changed",
  DOCUMENT_VIEWED = "document_viewed",
  AUDIT_TRAIL_ACCESSED = "audit_trail_accessed",
  SETTINGS_CHANGED = "settings_changed",
  TEMPLATE_CREATED = "template_created",
  TEMPLATE_UPDATED = "template_updated",
  SIGNATURE_VERIFIED = "signature_verified",
  SIGNATURE_VALIDATION_FAILED = "signature_validation_failed",
  DOCUMENT_INTEGRITY_CHECK = "document_integrity_check",
  ANOMALY_DETECTED = "anomaly_detected"
}

export enum ComplianceStandard {
  ESIGN_ACT = "esign_act",
  EIDAS = "eidas",
  CUSTOM = "custom"
}

// ============================================================================
// CORE DOMAIN MODELS
// ============================================================================

/**
 * ESignDocument - Main document entity
 */
export interface ESignDocument {
  id: string;
  businessId: string;
  ownerId: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  originalFilename: string;
  fileUrl: string;
  fileSizeBytes: number;
  fileMimeType?: string;
  status: DocumentStatus;
  signingMode: SigningMode;
  totalSigners: number;
  signedCount: number;
  expiresAt?: Date;
  signedAt?: Date;
  declinedAt?: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isEncrypted: boolean;
  encryptionKeyId?: string;
  signatureAlgorithm: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * ESignSignRequest - Individual signing request
 */
export interface ESignSignRequest {
  id: string;
  businessId: string;
  documentId: string;
  signerId: string;
  signerEmail: string;
  signerRole: SignerRole;
  status: SignRequestStatus;
  signingOrder: number;
  requiresWitness: boolean;
  witnessId?: string;
  canBeSignedByManager: boolean;
  assistingManagerId?: string;
  sentAt: Date;
  viewedAt?: Date;
  startedAt?: Date;
  signedAt?: Date;
  declinedAt?: Date;
  expiresAt?: Date;
  declineReason?: string;
  declineDetails?: Record<string, any>;
  lastReminderSentAt?: Date;
  reminderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ESignature - Actual signature data
 */
export interface ESignature {
  id: string;
  signRequestId: string;
  documentId: string;
  userId: string;
  signatureData: string; // SVG or base64 encoded
  signatureFormat: SignatureFormat;
  signatureType: SignatureType;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  geolocation?: GeolocationData;
  timestampToken?: string;
  timestampProvider?: string;
  signatureHash: string;
  certificateId?: string;
  isValid: boolean;
  validationError?: string;
  biometricType?: string;
  biometricData?: string;
  createdAt: Date;
  verifiedAt?: Date;
}

/**
 * ESignatureField - Signature field definition
 */
export interface ESignatureField {
  id: string;
  documentId: string;
  pageNumber: number;
  xPosition: number; // 0-100 percentage
  yPosition: number; // 0-100 percentage
  width: number;
  height: number;
  fieldName: string;
  fieldType: SignatureFieldType;
  required: boolean;
  tooltipText?: string;
  assignedSignerId?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ESignSettings - Business-level configuration
 */
export interface ESignSettings {
  id: string;
  businessId: string;
  isEnabled: boolean;
  maxSignersPerDocument: number;
  maxDocumentSizeMb: number;
  maxConcurrentDocuments: number;
  requireEmailVerification: boolean;
  requireMobileVerification: boolean;
  allowManagerAssistance: boolean;
  allowBulkSigning: boolean;
  defaultExpiryDays: number;
  minExpiryDays: number;
  maxExpiryDays: number;
  allowSequentialSigning: boolean;
  allowParallelSigning: boolean;
  requireSignatureWitness: boolean;
  sendEmailOnSent: boolean;
  sendEmailOnSigned: boolean;
  sendReminders: boolean;
  reminderIntervalDays: number;
  maxReminders: number;
  complianceStandard: ComplianceStandard;
  logIpAddresses: boolean;
  logDeviceInfo: boolean;
  storeSignedDocumentsEncrypted: boolean;
  signatureRetentionDays: number;
  enableBiometricSigning: boolean;
  biometricTypes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AuditLogEntry - Compliance audit trail
 */
export interface AuditLogEntry {
  id: string;
  businessId: string;
  documentId?: string;
  eventType: AuditEventType;
  actorId?: string;
  actorRole?: string;
  actorEmail?: string;
  actorIpAddress?: string;
  changeDescription: string;
  changeMetadata?: Record<string, any>;
  sessionId?: string;
  requestId?: string;
  isComplianceRelevant: boolean;
  retentionRequiredUntil?: Date;
  entryHash?: string;
  timestamp: Date;
  createdAt: Date;
}

/**
 * ESignTemplate - Reusable document template
 */
export interface ESignTemplate {
  id: string;
  businessId: string;
  templateName: string;
  templateDescription?: string;
  templateCategory?: string;
  baseDocumentUrl: string;
  isActive: boolean;
  signatureFields: ESignatureField[];
  defaultSigners?: DefaultSignerConfig[];
  defaultExpiryDays: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * SignatureVersion - Version history
 */
export interface SignatureVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  changeType?: string;
  changedById?: string;
  changeDescription: string;
  changeMetadata?: Record<string, any>;
  documentState: Record<string, any>;
  signersSnapshot: ESignSignRequest[];
  versionedFileUrl?: string;
  signedFileUrl?: string;
  documentHash: string;
  integrityVerified: boolean;
  createdAt: Date;
}

// ============================================================================
// REQUEST / RESPONSE PAYLOADS
// ============================================================================

/**
 * Create Document Request
 */
export interface CreateDocumentRequest {
  title: string;
  description?: string;
  documentType: DocumentType;
  file: File;
  expiresAt?: Date;
  signingMode?: SigningMode;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

/**
 * Create Document Response
 */
export interface CreateDocumentResponse {
  id: string;
  businessId: string;
  ownerId: string;
  title: string;
  status: DocumentStatus;
  fileUrl: string;
  uploadedAt: Date;
  expiresAt: Date;
  signingMode: SigningMode;
  signatureFields: ESignatureField[];
}

/**
 * Create Sign Request
 */
export interface CreateSignRequestRequest {
  documentId: string;
  signers: SignerConfig[];
  expiresAt?: Date;
  sendEmailImmediately?: boolean;
}

export interface SignerConfig {
  signerId?: string;
  signerEmail: string;
  signerRole: SignerRole;
  signingOrder?: number;
  canBeSignedByManager?: boolean;
  requiresWitness?: boolean;
}

/**
 * Create Sign Request Response
 */
export interface CreateSignRequestResponse {
  documentId: string;
  signRequests: ESignSignRequest[];
  batchId?: string;
  emailsSent: number;
}

/**
 * Add Signature Request
 */
export interface AddSignatureRequest {
  signRequestId: string;
  signatureData: string;
  signatureType: SignatureType;
  signatureFormat: SignatureFormat;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  signedByManagerId?: string;
  requestTimestamp?: boolean;
}

/**
 * Add Signature Response
 */
export interface AddSignatureResponse {
  signatureId: string;
  signRequestId: string;
  signedAt: Date;
  signatureHash: string;
  nextSignerEmail?: string;
  documentStatus: DocumentStatus;
  isDocumentComplete: boolean;
  downloadUrl?: string;
}

/**
 * Decline Document Request
 */
export interface DeclineDocumentRequest {
  signRequestId: string;
  declineReason: string;
  declineDetails?: Record<string, any>;
}

/**
 * Audit Trail Query
 */
export interface AuditTrailQuery {
  documentId: string;
  limit?: number;
  offset?: number;
  eventTypes?: AuditEventType[];
  startDate?: Date;
  endDate?: Date;
  exportFormat?: "json" | "csv" | "pdf";
}

/**
 * Audit Trail Response
 */
export interface AuditTrailResponse {
  documentId: string;
  totalEvents: number;
  events: AuditLogEntry[];
  exportUrl?: string;
}

// ============================================================================
// CONFIGURATION & SETTINGS
// ============================================================================

/**
 * Signature Capture Configuration
 */
export interface SignatureCaptureConfig {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  smoothingFactor: number;
  minStrokeLength: number;
  pressureSensitivity: boolean;
  touchSupport: boolean;
  penSupport: boolean;
  minComplexity: {
    minPoints: number;
    minDistance: number;
  };
  exportFormat: SignatureFormat;
  svgOutputQuality: "low" | "medium" | "high";
  pngOutputQuality: number;
}

/**
 * File Upload Configuration
 */
export interface FileUploadConfig {
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
  encryptionAlgorithm: string;
  signatureStorageFormat: SignatureFormat;
  versioningStrategy: "numbered" | "timestamped";
  compressionEnabled: boolean;
  compressionAlgorithm: string;
  redundancy: "none" | "single-region" | "cross-region";
  expirationPolicy: {
    draftDocuments: number;
    signedDocuments: number;
    declinedDocuments: number;
  };
}

/**
 * Encryption Configuration
 */
export interface EncryptionConfig {
  algorithm: string;
  keyManagement: "aws-kms" | "supabase-vault" | "custom";
  keyRotationDays: number;
  enableKeyVersioning: boolean;
  auditKeyAccess: boolean;
}

/**
 * Geolocation Data
 */
export interface GeolocationData {
  latitude: number;
  longitude: number;
  country: string;
  city?: string;
  region?: string;
  timestamp: Date;
}

/**
 * Signature Validation Result
 */
export interface SignatureValidationResult {
  isValid: boolean;
  errors: string[];
  complexity: number;
  estimatedComplexity?: "low" | "medium" | "high";
}

/**
 * Default Signer Config for Templates
 */
export interface DefaultSignerConfig {
  signerRole: SignerRole;
  signingOrder: number;
  canBeSignedByManager: boolean;
  requiresWitness: boolean;
}

/**
 * Webhook Payload
 */
export interface ESignWebhookPayload {
  event: ESignWebhookEvent;
  businessId: string;
  documentId?: string;
  signRequestId?: string;
  signatureId?: string;
  timestamp: Date;
  data: Record<string, any>;
}

export enum ESignWebhookEvent {
  DOCUMENT_CREATED = "esign.document.created",
  DOCUMENT_SENT = "esign.document.sent",
  SIGNATURE_REQUESTED = "esign.signature_request.created",
  SIGNATURE_VIEWED = "esign.signature_request.viewed",
  SIGNATURE_STARTED = "esign.signature_request.started",
  SIGNATURE_COMPLETED = "esign.signature.completed",
  SIGNATURE_DECLINED = "esign.signature_request.declined",
  DOCUMENT_SIGNED = "esign.document.signed",
  DOCUMENT_EXPIRED = "esign.document.expired"
}

/**
 * Compliance Report
 */
export interface ComplianceReport {
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalDocumentsSigned: number;
    averageSigningTime: number;
    documentCompletionRate: number;
    averageRemindersPerDocument: number;
    mostCommonDeclineReason: string;
  };
  riskIndicators: {
    unusualSigningPatterns: number;
    failedValidations: number;
    suspiciousBiometrics: number;
    anomalousLocations: number;
  };
  complianceStatus: {
    esignActCompliance: boolean;
    eidasCompliance: boolean;
    gdprCompliance: boolean;
    auditTrailComplete: boolean;
    encryptionVerified: boolean;
  };
  recommendations: string[];
}

/**
 * Error Response
 */
export interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
}

// ============================================================================
// FEATURE FLAG TYPES
// ============================================================================

export interface FeatureFlagConfig {
  esignEnabled: boolean;
  parallelSigningEnabled: boolean;
  biometricSigningEnabled: boolean;
  bulkSigningEnabled: boolean;
  templateSupportEnabled: boolean;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface EmailNotification {
  id: string;
  template: string;
  recipientEmail: string;
  subject: string;
  data: Record<string, any>;
  sentAt: Date;
  deliveredAt?: Date;
  bounced: boolean;
}

export interface InAppNotification {
  id: string;
  businessId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type DocumentFilter = Partial<{
  status: DocumentStatus;
  documentType: DocumentType;
  ownerOnly: boolean;
  relatedEntityType: string;
  createdAfter: Date;
  createdBefore: Date;
}>;

export type SignRequestFilter = Partial<{
  status: SignRequestStatus;
  signerRole: SignerRole;
  expiringWithinDays: number;
  unfinishedOnly: boolean;
}>;

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IDocumentService {
  createDocument(input: CreateDocumentRequest): Promise<ESignDocument>;
  getDocument(documentId: string): Promise<ESignDocument>;
  listDocuments(businessId: string, filters?: DocumentFilter): Promise<ESignDocument[]>;
  updateDocument(documentId: string, updates: Partial<ESignDocument>): Promise<void>;
  deleteDocument(documentId: string): Promise<void>;
  uploadDocumentFile(file: File, documentId: string): Promise<string>;
  downloadSignedDocument(documentId: string): Promise<Blob>;
}

export interface ISignRequestService {
  createSignRequest(input: CreateSignRequestRequest): Promise<CreateSignRequestResponse>;
  getSignRequest(requestId: string): Promise<ESignSignRequest>;
  updateRequestStatus(requestId: string, status: SignRequestStatus): Promise<void>;
  declineRequest(input: DeclineDocumentRequest): Promise<void>;
  resendRequest(requestId: string): Promise<void>;
}

export interface ISignatureService {
  addSignature(input: AddSignatureRequest): Promise<AddSignatureResponse>;
  validateSignature(signature: ESignature): Promise<SignatureValidationResult>;
  encryptSignatureData(data: string): Promise<string>;
  decryptSignatureData(encrypted: string): Promise<string>;
}

export interface IAuditService {
  logEvent(event: Omit<AuditLogEntry, "id" | "createdAt">): Promise<void>;
  getAuditTrail(query: AuditTrailQuery): Promise<AuditTrailResponse>;
  exportAuditTrail(documentId: string, format: "csv" | "json" | "pdf"): Promise<Blob>;
  generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport>;
}

export interface INotificationService {
  sendSigningRequest(signRequest: ESignSignRequest): Promise<void>;
  sendReminderEmail(signRequest: ESignSignRequest): Promise<void>;
  sendCompletionNotice(document: ESignDocument, signedBy: string): Promise<void>;
  sendDeclineNotice(signRequest: ESignSignRequest): Promise<void>;
}

export interface IFeatureFlagService {
  isESignEnabled(businessId: string): Promise<boolean>;
  getESignSettings(businessId: string): Promise<ESignSettings>;
  updateESignSettings(businessId: string, settings: Partial<ESignSettings>): Promise<void>;
}

/**
 * Export all types for convenience
 */
export type * from "./E_SIGNATURE_TYPES";
