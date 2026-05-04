import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAppData, clearAppData } from '@/business/utils/onboarding/appState';
import { submitRegistration } from '@/business/lib/registrationAPI';
import { Rocket, CheckCircle2, Loader2 } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';

export default function Preview() {
  const navigate = useNavigate();
  const [appData, setAppData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = getAppData();
    setAppData(data);
  }, []);

  const handleLaunch = async () => {
    if (!appData) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await submitRegistration(appData);
      console.log('Registration submitted:', result);

      clearAppData();
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit registration';
      setError(errorMessage);
      console.error('Launch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!appData) {
    return (
      <OnboardingLayout step={5} totalSteps={5}>
        <Card>
          <CardContent className="p-20">
            <div className="text-center">
              <Loader2
                className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600"
              />
              <p className="text-muted-foreground">Loading your app...</p>
            </div>
          </CardContent>
        </Card>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={5} totalSteps={5}>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-foreground">Your App is Ready!</h2>
          <p className="text-sm text-muted-foreground mt-1">Review your app settings and launch</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-8">
            {/* App Preview Summary */}
            <div
              className="p-6 rounded border bg-secondary border-border"
            >
              <h3 className="m-0 mb-4 text-base font-semibold text-foreground">
                Your App Summary
              </h3>

              {/* Summary Items */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Business Name:</span>
                  <span className="font-semibold">
                    {appData.businessName}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-semibold">
                    {appData.category}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-semibold">
                    {appData.location}
                  </span>
                </div>

                {appData.selectedFeatures?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-2 text-sm">
                      Selected Features ({appData.selectedFeatures.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {appData.selectedFeatures.slice(0, 3).map((feature: string) => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                      {appData.selectedFeatures.length > 3 && (
                        <Badge variant="secondary">
                          +{appData.selectedFeatures.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {appData.customization?.appName && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">App Name:</span>
                    <span className="font-semibold">
                      {appData.customization.appName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-4">
              <h4 className="m-0 text-base font-semibold text-foreground">
                Launch Checklist
              </h4>
              {[
                { label: 'Business details configured', done: !!appData.businessName },
                { label: 'Category selected', done: !!appData.category },
                { label: 'Features selected', done: appData.selectedFeatures?.length > 0 },
                { label: 'App customized', done: !!appData.customization },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4"
                >
                  <CheckCircle2
                    className={`w-5 h-5 flex-shrink-0 ${
                      item.done ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      item.done ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-4 rounded border bg-red-500/10 border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 flex-col mt-2">
              <Button
                className="w-full h-11 text-base flex items-center justify-center gap-2"
                onClick={handleLaunch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Rocket className="w-5 h-5" />
                )}
                {isLoading ? 'Launching...' : 'Launch Your App'}
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 text-base"
                onClick={() => navigate('/register/customize')}
                disabled={isLoading}
              >
                Back to Customization
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
