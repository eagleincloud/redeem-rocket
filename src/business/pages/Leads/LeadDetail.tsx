import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react';

interface LeadDetailData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  stage: string;
  priority: string;
  source: string;
  value?: number;
  createdAt: string;
  lastActivity?: string;
  description?: string;
  notes: Array<{ id: string; author: string; text: string; createdAt: string }>;
  activities: Array<{ id: string; type: string; description: string; createdAt: string }>;
}

// Mock lead data
const MOCK_LEAD: LeadDetailData = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@techcorp.com',
  phone: '+1 (555) 123-4567',
  company: 'Tech Corp',
  stage: 'qualified',
  priority: 'high',
  source: 'website',
  value: 5000,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  description: 'VP of Sales at Tech Corp. Looking for automation solutions.',
  notes: [
    {
      id: '1',
      author: 'You',
      text: 'John showed great interest in the product demo. Requesting a proposal.',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      author: 'You',
      text: 'Initial contact from website form. Added to qualified leads.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  activities: [
    {
      id: '1',
      type: 'email_sent',
      description: 'Sent product overview document',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'call',
      description: 'Scheduled demo call for tomorrow at 2 PM',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'email_opened',
      description: 'Opened welcome email',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export const LeadDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<LeadDetailData>(MOCK_LEAD);
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      setLead((prev) => ({
        ...prev,
        notes: [
          {
            id: Date.now().toString(),
            author: 'You',
            text: newNote,
            createdAt: new Date().toISOString(),
          },
          ...prev.notes,
        ],
      }));
      setNewNote('');
    }
  };

  const relativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const [activeTab, setActiveTab] = useState('timeline');

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{lead.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {lead.company ? `${lead.company} • ${lead.stage}` : lead.stage}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/app/leads')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact */}
              <div>
                <p className="m-0 text-xs text-muted-foreground font-semibold">
                  Email
                </p>
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors mt-2"
                >
                  <Mail className="w-4 h-4" />
                  {lead.email}
                </a>
              </div>

              {lead.phone && (
                <div>
                  <p className="m-0 text-xs text-muted-foreground font-semibold">
                    Phone
                  </p>
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors mt-2"
                  >
                    <Phone className="w-4 h-4" />
                    {lead.phone}
                  </a>
                </div>
              )}

              {lead.company && (
                <div>
                  <p className="m-0 text-xs text-muted-foreground font-semibold">
                    Company
                  </p>
                  <p className="flex items-center gap-2 text-sm text-foreground mt-2">
                    <Building2 className="w-4 h-4" />
                    {lead.company}
                  </p>
                </div>
              )}

              {lead.value && (
                <div>
                  <p className="m-0 text-xs text-muted-foreground font-semibold">
                    Deal Value
                  </p>
                  <p className="flex items-center gap-2 text-sm text-green-600 font-semibold mt-2">
                    <DollarSign className="w-4 h-4" />
                    ${lead.value.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="default" className="w-full text-sm">
                Send Email
              </Button>
              <Button variant="outline" className="w-full text-sm">
                Schedule Call
              </Button>
              <Button variant="outline" className="w-full text-sm">
                Convert to Deal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Timeline</span>
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Activities</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Notes</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {lead.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                      >
                        <div className="w-3 h-3 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="m-0 text-sm font-semibold text-foreground">
                            {activity.description}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {relativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="activities" className="mt-4">
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="m-0">No additional activities logged</p>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4 mt-4">
                  {/* Add Note */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleAddNote();
                        }
                      }}
                    />
                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                      Add
                    </Button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-3">
                    {lead.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-md bg-secondary border border-border"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <p className="m-0 text-sm font-semibold text-foreground">
                            {note.author}
                          </p>
                          <p className="m-0 text-xs text-muted-foreground">
                            {relativeTime(note.createdAt)}
                          </p>
                        </div>
                        <p className="m-0 text-sm text-muted-foreground leading-relaxed">
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
