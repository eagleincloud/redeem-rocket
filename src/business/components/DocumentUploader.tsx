import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, File } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface UploadedDocument {
  type: string;
  url: string;
  name: string;
  uploadedAt: string;
}

interface DocumentUploaderProps {
  onDocumentsUpdated: (documents: Record<string, string>) => void;
  documents?: Record<string, string>;
  disabled?: boolean;
}

const DOCUMENT_TYPES = [
  { key: 'business_license', label: 'Business License/Registration', icon: '📋' },
  { key: 'tax_id', label: 'Tax ID (GSTIN)', icon: '🏛️' },
  { key: 'owner_id', label: 'Owner ID Proof', icon: '🪪' },
  { key: 'address_proof', label: 'Address Proof', icon: '🏠' },
  { key: 'bank_details', label: 'Bank Details', icon: '🏦' },
];

export function DocumentUploader({ onDocumentsUpdated, documents = {}, disabled = false }: DocumentUploaderProps) {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>(
    Object.entries(documents).map(([type, url]) => ({
      type,
      url,
      name: DOCUMENT_TYPES.find((d) => d.key === type)?.label || type,
      uploadedAt: new Date().toISOString(),
    }))
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const processFile = async (file: File) => {
    if (!selectedType) {
      setError('Please select a document type first');
      return;
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File must be smaller than 5MB');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Mock upload - in production, upload to Supabase storage
      // For now, create a data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newDocs = { ...documents, [selectedType]: dataUrl };
        setUploadedDocs((prev) => [
          ...prev.filter((d) => d.type !== selectedType),
          {
            type: selectedType,
            url: dataUrl,
            name: DOCUMENT_TYPES.find((d) => d.key === selectedType)?.label || selectedType,
            uploadedAt: new Date().toISOString(),
          },
        ]);
        onDocumentsUpdated(newDocs);
        setSelectedType(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveDocument = (type: string) => {
    const newDocs = { ...documents };
    delete newDocs[type];
    setUploadedDocs((prev) => prev.filter((d) => d.type !== type));
    onDocumentsUpdated(newDocs);
  };

  return (
    <div style={{ background: isDark ? '#0e1530' : '#ffffff', borderRadius: 12, padding: 20, border: `1px solid ${isDark ? '#1c2a55' : '#e8d8cc'}` }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: isDark ? '#e2e8f0' : '#18100a' }}>
        Upload Documents
      </h3>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#94a3b8' : '#9a7860', marginBottom: 8, display: 'block' }}>
          Document Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => setSelectedType(type.key)}
              disabled={disabled || uploadedDocs.some((d) => d.type === type.key)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: `2px solid ${selectedType === type.key ? '#f97316' : isDark ? '#1c2a55' : '#e8d8cc'}`,
                background:
                  selectedType === type.key
                    ? isDark
                      ? '#1a2847'
                      : '#fff5ed'
                    : isDark
                      ? '#0f1838'
                      : '#ffffff',
                color: isDark ? '#e2e8f0' : '#18100a',
                cursor: disabled || uploadedDocs.some((d) => d.type === type.key) ? 'not-allowed' : 'pointer',
                opacity: disabled || uploadedDocs.some((d) => d.type === type.key) ? 0.5 : 1,
                fontSize: 11,
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 4 }}>{type.icon}</div>
              {type.label}
              {uploadedDocs.some((d) => d.type === type.key) && (
                <div style={{ marginTop: 4, fontSize: 10, color: '#22c55e' }}>✓ Uploaded</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#f97316' : isDark ? '#1c2a55' : '#e8d8cc'}`,
          borderRadius: 8,
          padding: 24,
          textAlign: 'center',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          background: dragActive ? (isDark ? '#1a2847' : '#fff5ed') : isDark ? '#162040' : '#fdf6f0',
          transition: 'all 0.2s',
          opacity: disabled || uploading ? 0.5 : 1,
          marginBottom: 16,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <>
            <Loader2 style={{ width: 32, height: 32, margin: '0 auto 8px', color: '#f97316', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#e2e8f0' : '#18100a' }}>
              Uploading...
            </div>
          </>
        ) : (
          <>
            <Upload style={{ width: 32, height: 32, margin: '0 auto 8px', color: '#f97316' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#e2e8f0' : '#18100a', marginBottom: 4 }}>
              {selectedType ? 'Drag & drop or click to upload' : 'Select a document type first'}
            </div>
            <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#9a7860' }}>
              PDF, JPG, or PNG (Max 5MB)
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fee2e2', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: '#991b1b' }}>{error}</span>
        </div>
      )}

      {/* Uploaded Documents */}
      {uploadedDocs.length > 0 && (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#94a3b8' : '#9a7860', marginBottom: 12 }}>
            Uploaded Documents ({uploadedDocs.length}/{DOCUMENT_TYPES.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {uploadedDocs.map((doc) => (
              <div key={doc.type} style={{ padding: 12, background: isDark ? '#162040' : '#fdf6f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <File style={{ width: 20, height: 20, color: '#f97316', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#e2e8f0' : '#18100a', marginBottom: 2 }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#9a7860' }}>
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 style={{ width: 18, height: 18, color: '#22c55e', flexShrink: 0 }} />
                  <button
                    onClick={() => handleRemoveDocument(doc.type)}
                    disabled={disabled}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      color: '#ef4444',
                      padding: '4px 8px',
                      borderRadius: 4,
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    <X style={{ width: 18, height: 18 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      <div style={{ marginTop: 16, fontSize: 12, color: isDark ? '#94a3b8' : '#9a7860' }}>
        {uploadedDocs.length} of {DOCUMENT_TYPES.length} documents uploaded
      </div>
    </div>
  );
}
