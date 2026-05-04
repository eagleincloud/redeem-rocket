/**
 * Layer 7: Email Draft Assistant Component
 * Modal for generating, editing, and sending AI-powered email drafts
 */

import React, { useState, useEffect } from 'react';
import { Copy, Send, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { GlassCard } from '@/business/components/base/GlassCard';
import { generateEmailDraft } from '@/business/services/AIRecommendationEngine';

interface EmailDraftAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  onSend?: (subject: string, body: string) => Promise<void> | void;
}

export default function EmailDraftAssistant({
  open,
  onOpenChange,
  lead,
  onSend,
}: EmailDraftAssistantProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Generate initial draft when modal opens
  useEffect(() => {
    if (open && !subject) {
      handleGenerateDraft();
    }
  }, [open]);

  const handleGenerateDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      const draft = await generateEmailDraft({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        stage: 'unknown',
        value: 0,
        daysInStage: 0,
        lastActivity: 'unknown',
        source: 'crm',
      });

      setSubject(draft.subject || '');
      setBody(draft.body || '');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate draft';
      setError(errorMsg);
      console.error('Error generating email draft:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }

    setSending(true);
    setError(null);

    try {
      if (onSend) {
        await onSend(subject, body);
      }
      onOpenChange(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMsg);
      console.error('Error sending email:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Draft Email to {lead.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <GlassCard className="p-4 bg-white/5 border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/60 mb-1 text-xs">To</p>
                <p className="text-white font-medium">{lead.name}</p>
                <p className="text-white/80 text-xs break-all">{lead.email}</p>
              </div>
              <div>
                <p className="text-white/60 mb-1 text-xs">Company</p>
                <p className="text-white font-medium">{lead.company}</p>
              </div>
            </div>
          </GlassCard>

          {/* Error Display */}
          {error && (
            <GlassCard className="p-3 bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </GlassCard>
          )}

          {/* Generate Button (initial state) */}
          {!subject && !loading && (
            <Button
              onClick={handleGenerateDraft}
              className="w-full bg-orange-500/80 hover:bg-orange-500 text-white font-medium"
            >
              Generate AI Draft
            </Button>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-3" />
                <p className="text-white/60 text-sm">Generating email draft...</p>
              </div>
            </div>
          )}

          {/* Subject Line */}
          {subject && !loading && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg
                    text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50
                    focus:bg-white/10 transition-colors"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Body
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg
                    text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50
                    focus:bg-white/10 transition-colors
                    min-h-[200px] resize-none font-mono text-sm"
                  placeholder="Edit your email body here..."
                />
              </div>

              {/* Character Count */}
              <div className="text-xs text-white/50 text-right">
                {body.length} characters
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  className="flex-1 text-white border-white/20 hover:bg-white/10"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>

                <Button
                  onClick={handleGenerateDraft}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 text-white border-white/20 hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>

                <Button
                  onClick={handleSend}
                  disabled={sending || !subject.trim() || !body.trim()}
                  className="flex-1 bg-green-500/80 hover:bg-green-500 text-white disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>

              {/* Tips Section */}
              <GlassCard className="p-3 bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs text-blue-300/80 font-medium mb-1">Tips:</p>
                <ul className="text-xs text-blue-300/70 space-y-1">
                  <li>
                    • Personalize the message with specific details about their company
                  </li>
                  <li>• Keep subject lines under 50 characters</li>
                  <li>• Use regenerate if the tone doesn't feel right</li>
                </ul>
              </GlassCard>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-white border-white/20 hover:bg-white/10"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
