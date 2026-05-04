import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveAppData, getAppData } from '@/business/utils/onboarding/appState';
import { Palette, Type, Upload, Sparkles } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';

const colorSwatches = [
  '#1565C0', '#7B1FA2', '#C62828', '#E65100', '#2E7D32',
  '#00695C', '#006064', '#4527A0', '#AD1457', '#263238',
  '#C8A951', '#FF4F7B', '#00BFA5', '#00E676', '#FF6B35',
];

const layoutOptions = [
  { value: 'modern', label: 'Modern - Clean and minimal' },
  { value: 'elegant', label: 'Elegant - Professional look' },
  { value: 'playful', label: 'Playful - Fun and colorful' },
];

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto (based on device)' },
];

export default function AppCustomization() {
  const navigate = useNavigate();
  const [appData, setAppData] = useState<any>(null);

  const [customization, setCustomization] = useState({
    appName: '',
    primaryColor: '#3B82F6',
    layout: 'modern',
    theme: 'dark',
    logoFile: null as File | null,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getAppData();
      setAppData(data);
      setCustomization((prev) => ({
        ...prev,
        appName: data?.businessName || '',
      }));
    };
    loadData();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomization((prev) => ({ ...prev, logoFile: file }));

      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    await saveAppData({
      ...appData,
      customization,
      logoPreview,
    });
    navigate('/register/preview');
  };

  return (
    <OnboardingLayout step={5} totalSteps={5}>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-foreground">Customize Your App</h2>
          <p className="text-sm text-muted-foreground mt-1">Personalize the look and feel of your business app</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-8">
            {/* App Name */}
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                placeholder="Enter your app name"
                value={customization.appName}
                onChange={(e) =>
                  setCustomization((prev) => ({ ...prev, appName: e.target.value }))
                }
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="flex items-center text-sm font-medium">
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Label>
              <div
                className="border-2 border-dashed border-border rounded p-6 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-500/5"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer block">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-w-full max-h-24 mx-auto"
                    />
                  ) : (
                    <p className="text-muted-foreground m-0 text-sm">
                      Click to upload or drag and drop
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label className="flex items-center text-sm font-medium">
                <Palette className="w-4 h-4 mr-2" />
                Primary Color
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {colorSwatches.map((color) => (
                  <div
                    key={color}
                    onClick={() =>
                      setCustomization((prev) => ({ ...prev, primaryColor: color }))
                    }
                    className="aspect-square rounded cursor-pointer transition-all"
                    style={{
                      backgroundColor: color,
                      border:
                        customization.primaryColor === color
                          ? '3px solid white'
                          : '2px solid transparent',
                      boxShadow:
                        customization.primaryColor === color
                          ? `0 0 12px ${color}80`
                          : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Layout */}
            <div className="space-y-2">
              <Label htmlFor="layout">Layout Style</Label>
              <Select value={customization.layout} onValueChange={(value) => setCustomization((prev) => ({ ...prev, layout: value }))}>
                <SelectTrigger id="layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {layoutOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={customization.theme} onValueChange={(value) => setCustomization((prev) => ({ ...prev, theme: value }))}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 flex-col mt-2">
              <Button
                className="w-full h-11 text-base"
                onClick={handleNext}
              >
                Preview Your App
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 text-base"
                onClick={() => navigate('/register/features')}
              >
                Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
