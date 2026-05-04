import { useState } from 'react';
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
import { saveAppData } from '@/business/utils/onboarding/appState';
import { categoryList } from '@/business/utils/onboarding/categoryStyles';
import OnboardingLayout from './OnboardingLayout';

export default function BusinessDetails() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    category: '',
    location: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    await saveAppData({
      businessName: formData.businessName,
      email: formData.email,
      phone: formData.phone,
      category: formData.category,
      location: formData.location,
    });

    navigate('/register/features');
  };

  const categoryOptions = categoryList.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  return (
    <OnboardingLayout step={3} totalSteps={5}>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-foreground">Business Details</h2>
          <p className="text-sm text-muted-foreground mt-1">Tell us about your business to get started</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                placeholder="Enter your business name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
              {errors.businessName && (
                <p className="text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Business Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select your business category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="City, State/Province"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              {errors.location && (
                <p className="text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-4 flex-col mt-2">
              <Button
                className="w-full h-11 text-base"
                onClick={handleNext}
              >
                Continue
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 text-base"
                onClick={() => navigate('/register')}
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
