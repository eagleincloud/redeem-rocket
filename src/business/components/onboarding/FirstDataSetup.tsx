import { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, FileText, Plus, Loader } from 'lucide-react';

interface FirstDataSetupProps {
  onNext: () => void;
  onPrevious: () => void;
  businessType?: string;
}

type SetupMode = 'choose' | 'csv' | 'manual' | 'sample' | 'skip';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
}

interface LeadForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
}

export function FirstDataSetup({
  onNext,
  onPrevious,
  businessType = 'retail',
}: FirstDataSetupProps) {
  const [mode, setMode] = useState<SetupMode>('choose');
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [leadForm, setLeadForm] = useState<LeadForm>({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
  });

  const colors = {
    bg: '#0a0e27',
    card: '#111827',
    border: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#ff4400',
    success: '#10b981',
    hover: '#1a1f3a',
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        const lines = content.split('\n').slice(0, 5);
        setCsvPreview(lines.filter(line => line.trim()));
      };
      reader.readAsText(file);
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.price) {
      alert('Please fill in product name and price');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Product added:', productForm);

      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
      });

      // Move to next phase after product is added
      setTimeout(() => {
        setLoading(false);
        onNext();
      }, 500);
    } catch (err) {
      console.error('Error adding product:', err);
      setLoading(false);
    }
  };

  const handleAddLead = async () => {
    if (!leadForm.name || !leadForm.email) {
      alert('Please fill in name and email');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Lead added:', leadForm);

      setLeadForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'website',
      });

      // Move to next phase after lead is added
      setTimeout(() => {
        setLoading(false);
        onNext();
      }, 500);
    } catch (err) {
      console.error('Error adding lead:', err);
      setLoading(false);
    }
  };

  const handleGenerateSampleData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Sample data generated');
      onNext();
    } catch (err) {
      console.error('Error generating sample data:', err);
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  // Choose Mode
  if (mode === 'choose') {
    return (
      <div>
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 12px 0',
            }}
          >
            Add Your First Data
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: colors.textMuted,
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            Set up some initial data to see your dashboard in action. You can skip this and add data later.
          </p>
        </div>

        {/* Options Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {/* CSV Import */}
          <button
            onClick={() => setMode('csv')}
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
            onMouseEnter={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.accent;
              el.style.background = colors.hover;
            }}
            onMouseLeave={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.border;
              el.style.background = colors.card;
            }}
          >
            <FileText size={32} style={{ color: colors.accent }} />
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 4px 0',
                }}
              >
                Import CSV
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                Upload products or leads
              </p>
            </div>
          </button>

          {/* Manual Entry */}
          <button
            onClick={() => setMode('manual')}
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
            onMouseEnter={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.accent;
              el.style.background = colors.hover;
            }}
            onMouseLeave={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.border;
              el.style.background = colors.card;
            }}
          >
            <Plus size={32} style={{ color: colors.accent }} />
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 4px 0',
                }}
              >
                Manual Entry
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                Add one item at a time
              </p>
            </div>
          </button>

          {/* Sample Data */}
          <button
            onClick={() => setMode('sample')}
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
            onMouseEnter={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.accent;
              el.style.background = colors.hover;
            }}
            onMouseLeave={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.border;
              el.style.background = colors.card;
            }}
          >
            <div style={{ fontSize: '32px' }}>✨</div>
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 4px 0',
                }}
              >
                Generate Sample
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                Auto-populate with demo data
              </p>
            </div>
          </button>

          {/* Skip */}
          <button
            onClick={() => setMode('skip')}
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
            onMouseEnter={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.textMuted;
              el.style.background = colors.hover;
            }}
            onMouseLeave={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.border;
              el.style.background = colors.card;
            }}
          >
            <div style={{ fontSize: '32px' }}>⏭️</div>
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 4px 0',
                }}
              >
                Skip For Now
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                Add data after launch
              </p>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onPrevious}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: `1.5px solid ${colors.border}`,
              color: colors.textMuted,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.text;
              el.style.color = colors.text;
            }}
            onMouseLeave={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.border;
              el.style.color = colors.textMuted;
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </div>
      </div>
    );
  }

  // CSV Upload Mode
  if (mode === 'csv') {
    return (
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 8px 0',
            }}
          >
            Import CSV File
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: colors.textMuted,
              margin: 0,
            }}
          >
            Upload a CSV with your products or leads. First row should be headers.
          </p>
        </div>

        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          {!csvFile ? (
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
            >
              <Upload size={40} style={{ color: colors.accent }} />
              <div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.text,
                    margin: '0 0 4px 0',
                  }}
                >
                  Click to upload or drag and drop
                </h3>
                <p
                  style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                    margin: 0,
                  }}
                >
                  CSV file (Max 10MB)
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.success,
                    margin: 0,
                  }}
                >
                  File selected: {csvFile.name}
                </h3>
              </div>

              {csvPreview.length > 0 && (
                <div
                  style={{
                    background: colors.hover,
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    color: colors.textMuted,
                    fontFamily: 'monospace',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    marginBottom: '16px',
                  }}
                >
                  {csvPreview.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setCsvFile(null)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textMuted,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Choose Different File
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setMode('choose')}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: `1.5px solid ${colors.border}`,
              color: colors.textMuted,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <button
            onClick={handleSkip}
            disabled={!csvFile}
            style={{
              flex: 1,
              padding: '14px',
              background: colors.accent,
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: csvFile ? 'pointer' : 'not-allowed',
              opacity: csvFile ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            Continue
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Manual Entry Mode
  if (mode === 'manual') {
    return (
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 8px 0',
            }}
          >
            Add Your First {businessType === 'service' ? 'Lead' : 'Product'}
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: colors.textMuted,
              margin: 0,
            }}
          >
            Add a sample to see how it appears in your dashboard.
          </p>
        </div>

        {businessType === 'service' || businessType === 'consulting' ? (
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <input
              type="text"
              value={leadForm.name}
              onChange={e => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Lead Name"
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            <input
              type="email"
              value={leadForm.email}
              onChange={e => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            <input
              type="tel"
              value={leadForm.phone}
              onChange={e => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone (optional)"
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            <input
              type="text"
              value={leadForm.company}
              onChange={e => setLeadForm(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Company (optional)"
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            <select
              value={leadForm.source}
              onChange={e => setLeadForm(prev => ({ ...prev, source: e.target.value }))}
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            >
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="cold_call">Cold Call</option>
              <option value="social">Social Media</option>
            </select>

            <button
              onClick={handleAddLead}
              disabled={loading}
              style={{
                padding: '12px',
                background: colors.accent,
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Adding Lead...
                </>
              ) : (
                'Add Lead'
              )}
            </button>
          </div>
        ) : (
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <input
              type="text"
              value={productForm.name}
              onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Product Name"
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            <textarea
              value={productForm.description}
              onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description (optional)"
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                minHeight: '80px',
                resize: 'vertical',
              }}
            />
            <input
              type="number"
              value={productForm.price}
              onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Price"
              step="0.01"
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />
            <input
              type="text"
              value={productForm.category}
              onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Category (optional)"
              style={{
                padding: '12px',
                background: colors.hover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
            />

            <button
              onClick={handleAddProduct}
              disabled={loading}
              style={{
                padding: '12px',
                background: colors.accent,
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Adding Product...
                </>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setMode('choose')}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: `1.5px solid ${colors.border}`,
              color: colors.textMuted,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </div>
      </div>
    );
  }

  // Sample Data Mode
  if (mode === 'sample') {
    return (
      <div>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✨</div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 8px 0',
            }}
          >
            Generate Sample Data
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: colors.textMuted,
              margin: 0,
            }}
          >
            We'll create sample products and leads so you can explore your dashboard immediately.
          </p>
        </div>

        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          {!loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '32px' }}>🎯</div>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: 0,
                }}
              >
                Ready to generate?
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                This will add 5 sample products and 3 sample leads to your dashboard.
              </p>

              <button
                onClick={handleGenerateSampleData}
                style={{
                  padding: '12px 24px',
                  background: colors.accent,
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.opacity = '0.9';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.opacity = '1';
                }}
              >
                Generate Sample Data
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Loader size={40} style={{ color: colors.accent, animation: 'spin 2s linear infinite' }} />
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: 0,
                }}
              >
                Generating sample data...
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                This should take just a moment
              </p>
            </div>
          )}
        </div>

        {!loading && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setMode('choose')}
              style={{
                flex: 1,
                padding: '14px',
                background: 'transparent',
                border: `1.5px solid ${colors.border}`,
                color: colors.textMuted,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ChevronLeft size={16} />
              Back
            </button>
          </div>
        )}
      </div>
    );
  }

  // Skip Mode
  if (mode === 'skip') {
    return (
      <div>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>👍</div>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 8px 0',
            }}
          >
            Skip Data Setup
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: colors.textMuted,
              margin: 0,
            }}
          >
            You can add data anytime from your dashboard after launch.
          </p>
        </div>

        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '28px', textAlign: 'center' }}>⏭️</div>
            <p
              style={{
                fontSize: '14px',
                color: colors.textMuted,
                margin: 0,
                lineHeight: '1.6',
              }}
            >
              You're one step away from launching your dashboard! Click "Complete Onboarding" to finish the setup and
              start using Redeem Rocket.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setMode('choose')}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: `1.5px solid ${colors.border}`,
              color: colors.textMuted,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <button
            onClick={handleSkip}
            style={{
              flex: 1,
              padding: '14px',
              background: colors.accent,
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            Complete Onboarding
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
