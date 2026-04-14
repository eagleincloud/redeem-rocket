import { useState, useEffect } from 'react';
import { Mail, Loader2, AlertCircle, CheckCircle, X, FileText } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { supabase } from '@/app/lib/supabase';
import { sendBulkOutreach } from '@/app/lib/resendService';
import { HintTooltip } from './HintTooltip';

interface EmailDraft {
  id: string;
  recipient_email: string;
  subject: string;
  html_content: string;
  created_at: string;
}

interface SendSingleEmailModalProps {
  businessId: string;
  onClose: () => void;
  onSuccess?: (email: string) => void;
}

const EMAIL_TEMPLATES = [
  {
    name: 'Blank',
    subject: 'Hello {name}',
    html: '<h1>Hello {name}</h1><p>Your message here</p>',
  },
  {
    name: 'Promotional',
    subject: '🎉 Special Offer for You!',
    html: '<h1>Special Offer!</h1><p>Dear {name},</p><p>We have an exclusive offer for you: {offer}</p><p>Use code: {code}</p><button>Claim Offer</button>',
  },
  {
    name: 'Follow-up',
    subject: 'Following up on {business}',
    html: '<h1>Hi {name}</h1><p>I wanted to check in about {business}.</p><p>Happy to answer any questions!</p>',
  },
  {
    name: 'Feedback',
    subject: 'Your feedback matters - {business}',
    html: '<h1>We Value Your Feedback!</h1><p>Dear {name},</p><p>How was your experience with {business}?</p><p>Click below to share:</p><button>Share Feedback</button>',
  },
];

export function SendSingleEmailModal({
  businessId,
  onClose,
  onSuccess,
}: SendSingleEmailModalProps) {
  const [tab, setTab] = useState<'send' | 'drafts'>('send');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('Blank');
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingDraft, setSendingDraft] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load drafts on mount
  useEffect(() => {
    if (tab === 'drafts') {
      loadDrafts();
    }
  }, [tab]);

  // Update form when template changes
  useEffect(() => {
    const template = EMAIL_TEMPLATES.find(t => t.name === selectedTemplate);
    if (template) {
      setSubject(template.subject);
      setHtmlContent(template.html);
    }
  }, [selectedTemplate]);

  async function loadDrafts() {
    if (!supabase) return;
    try {
      const { data, error: err } = await supabase
        .from('email_drafts')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (!err && data) {
        setDrafts(data);
      }
    } catch (err) {
      console.error('Error loading drafts:', err);
    }
  }

  async function handleSaveDraft() {
    if (!recipientEmail.trim() || !subject.trim()) {
      setError('Please fill in recipient email and subject');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('email_drafts')
        .insert([{
          business_id: businessId,
          recipient_email: recipientEmail,
          subject,
          html_content: htmlContent,
        }]);

      if (err) {
        setError('Failed to save draft');
        return;
      }

      setSuccess('Draft saved successfully! 📝');
      setTimeout(() => {
        setSuccess('');
        setRecipientEmail('');
        setRecipientName('');
        setSubject('');
        setHtmlContent('');
      }, 1500);
    } catch (err) {
      setError('An error occurred while saving draft');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendNow() {
    if (!recipientEmail.trim() || !subject.trim()) {
      setError('Please fill in recipient email and subject');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await sendBulkOutreach({
        recipients: [{ email: recipientEmail }],
        subject,
        htmlContent,
        content: htmlContent.replace(/<[^>]*>/g, ''),
        campaignName: `Single Email to ${recipientEmail}`,
        businessId,
      });

      if (!result.ok) {
        setError(result.error || 'Failed to send email');
        return;
      }

      setSuccess(`Email sent successfully to ${recipientEmail}! ✉️`);
      setTimeout(() => {
        setSuccess('');
        onSuccess?.(recipientEmail);
        onClose();
      }, 1500);
    } catch (err) {
      setError('An error occurred while sending email');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendDraft(draft: EmailDraft) {
    setSendingDraft(draft.id);
    try {
      const result = await sendBulkOutreach({
        recipients: [{ email: draft.recipient_email }],
        subject: draft.subject,
        htmlContent: draft.html_content,
        content: draft.html_content.replace(/<[^>]*>/g, ''),
        campaignName: `Single Email to ${draft.recipient_email}`,
        businessId,
      });

      if (!result.ok) {
        setError('Failed to send draft');
        return;
      }

      // Delete draft after sending
      await supabase
        .from('email_drafts')
        .delete()
        .eq('id', draft.id);

      await loadDrafts();
      setSuccess('Draft sent successfully! ✉️');
      setTimeout(() => setSuccess(''), 1500);
    } catch (err) {
      setError('Failed to send draft');
    } finally {
      setSendingDraft(null);
    }
  }

  async function handleDeleteDraft(draftId: string) {
    try {
      await supabase
        .from('email_drafts')
        .delete()
        .eq('id', draftId);
      await loadDrafts();
    } catch (err) {
      setError('Failed to delete draft');
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={22} color="#3b82f6" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Send Email
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {['send', 'drafts'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as 'send' | 'drafts')}
              style={{
                flex: 1,
                padding: '12px',
                background: tab === t ? '#fff' : '#f8fafc',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: tab === t ? '600' : '500',
                color: tab === t ? '#3b82f6' : '#64748b',
                borderBottom: tab === t ? '2px solid #3b82f6' : 'none',
              }}
            >
              {t === 'send' ? '✉️ Send Now' : `📝 Drafts (${drafts.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Messages */}
          {error && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px',
                borderRadius: '6px',
                display: 'flex',
                gap: '10px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: '#dcfce7',
                border: '1px solid #86efac',
                color: '#166534',
                padding: '12px',
                borderRadius: '6px',
                display: 'flex',
                gap: '10px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              {success}
            </div>
          )}

          {tab === 'send' ? (
            // Send form
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Template selector */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginTop: '6px',
                  }}
                >
                  {EMAIL_TEMPLATES.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Email */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    Recipient Email
                  </label>
                  <HintTooltip
                    title="Email Address"
                    description="Enter the email address of the recipient."
                  />
                </div>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>

              {/* Recipient Name */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                  Recipient Name (Optional)
                </label>
                <Input
                  placeholder="John Doe"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>

              {/* Subject */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    Subject
                  </label>
                  <HintTooltip
                    title="Email Subject"
                    description="Keep under 50 characters. Use {name}, {business}, {offer}, {amount} for personalization."
                  />
                </div>
                <Input
                  placeholder="Your message subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* HTML Content */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '6px', display: 'block' }}>
                  Email Content (HTML)
                </label>
                <textarea
                  placeholder="<h1>Hello {name}</h1><p>Your message here</p>"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    '💾 Save Draft'
                  )}
                </Button>
                <Button
                  onClick={handleSendNow}
                  disabled={loading}
                  variant="default"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Sending...
                    </>
                  ) : (
                    '✉️ Send Now'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Drafts list
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {drafts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#64748b',
                }}>
                  <FileText size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p>No drafts yet. Create one to send later!</p>
                </div>
              ) : (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        {draft.subject}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        To: {draft.recipient_email}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        Saved {new Date(draft.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        onClick={() => handleSendDraft(draft)}
                        disabled={sendingDraft === draft.id}
                        size="sm"
                        variant="default"
                      >
                        {sendingDraft === draft.id ? '...' : 'Send'}
                      </Button>
                      <Button
                        onClick={() => handleDeleteDraft(draft.id)}
                        size="sm"
                        variant="outline"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
