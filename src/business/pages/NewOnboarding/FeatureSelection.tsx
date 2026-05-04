import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { saveAppData, getAppData } from '@/business/utils/onboarding/appState';
import {
  Users, MessageSquare, Tag, Bot, BarChart2, Sparkles, Star, Package,
  Mail, Zap, Shield, Gift, Share2, MapPin,
} from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  price?: string;
  category: string;
}

const allFeatures: Feature[] = [
  {
    id: 'lead-management',
    name: 'Lead Management CRM',
    description: 'Capture, track and convert leads into customers',
    icon: Users,
    color: '#3B82F6',
    category: 'CRM',
  },
  {
    id: 'whatsapp-marketing',
    name: 'WhatsApp Marketing',
    description: 'Send personalised bulk campaigns via WhatsApp',
    icon: MessageSquare,
    color: '#25D366',
    category: 'Marketing',
  },
  {
    id: 'coupons-offers',
    name: 'Coupons & Offers',
    description: 'Create discount codes and track redemptions',
    icon: Tag,
    color: '#F59E0B',
    category: 'Marketing',
  },
  {
    id: 'loyalty-program',
    name: 'Loyalty Program',
    description: 'Reward repeat customers with points and perks',
    icon: Star,
    color: '#EF4444',
    category: 'Retention',
  },
  {
    id: 'ai-assistant',
    name: 'AI Business Assistant',
    description: 'Smart AI that suggests campaigns and predicts trends',
    icon: Bot,
    color: '#8B5CF6',
    category: 'AI',
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights into your business performance',
    icon: BarChart2,
    color: '#10B981',
    category: 'Analytics',
  },
  {
    id: 'email-campaigns',
    name: 'Email Marketing',
    description: 'Design and send professional email campaigns',
    icon: Mail,
    color: '#EC4899',
    category: 'Marketing',
  },
  {
    id: 'automation-rules',
    name: 'Workflow Automation',
    description: 'Create triggered workflows based on customer actions',
    icon: Zap,
    color: '#F97316',
    category: 'Automation',
  },
];

export default function FeatureSelection() {
  const navigate = useNavigate();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getAppData();
      setAppData(data);
    };
    loadData();
  }, []);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleNext = async () => {
    await saveAppData({
      ...appData,
      selectedFeatures,
    });
    navigate('/register/customize');
  };

  return (
    <OnboardingLayout step={4} totalSteps={5}>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-foreground">Select Your Features</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose the features that best fit your business needs</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-8">
            {allFeatures.map((feature) => {
              const Icon = feature.icon;
              const isSelected = selectedFeatures.includes(feature.id);

              return (
                <div
                  key={feature.id}
                  className={`p-4 rounded border cursor-pointer transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-500/5'
                      : 'border-border bg-transparent hover:border-blue-400 hover:bg-blue-500/5'
                  }`}
                  onClick={() => toggleFeature(feature.id)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFeature(feature.id)}
                    className="w-5 h-5 cursor-pointer accent-blue-600 mt-0.5 flex-shrink-0"
                  />

                  {/* Feature Icon */}
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: feature.color + '33',
                      color: feature.color,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Feature Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="m-0 text-base font-semibold text-foreground">
                        {feature.name}
                      </h4>
                      {feature.category && (
                        <Badge variant="secondary" className="text-xs">{feature.category}</Badge>
                      )}
                    </div>
                    <p className="m-0 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-4 flex-col mt-2">
            <Button
              className="w-full h-11 text-base"
              onClick={handleNext}
              disabled={selectedFeatures.length === 0}
            >
              Continue ({selectedFeatures.length} selected)
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 text-base"
              onClick={() => navigate('/register/details')}
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
