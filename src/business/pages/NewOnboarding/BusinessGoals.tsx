import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Target, Megaphone, Award } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';

const goals = [
  { id: 'customers', label: 'Get New Customers', icon: Users },
  { id: 'sales', label: 'Increase Sales', icon: TrendingUp },
  { id: 'leads', label: 'Manage Leads', icon: Target },
  { id: 'marketing', label: 'Run Marketing Campaigns', icon: Megaphone },
  { id: 'brand', label: 'Build Brand', icon: Award },
];

export default function BusinessGoals() {
  const navigate = useNavigate();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  return (
    <OnboardingLayout step={2} totalSteps={5}>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-foreground">What do you want to achieve?</h2>
          <p className="text-sm text-muted-foreground mt-1">Select all that apply to get personalized feature recommendations</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-8">
            {goals.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.id);

              return (
                <div
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`flex items-center gap-6 p-4 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-500/5'
                      : 'border-border bg-transparent hover:border-blue-400 hover:bg-blue-500/5'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleGoal(goal.id)}
                    className="w-5 h-5 cursor-pointer accent-blue-600"
                  />

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-secondary text-blue-500'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Label */}
                  <span className="text-base font-medium text-foreground">
                    {goal.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-4 flex-col">
            <Button
              onClick={() => navigate('/register/details')}
              disabled={selectedGoals.length === 0}
              className="w-full h-11 text-base"
            >
              Next
            </Button>
            <Button
              onClick={() => navigate('/register')}
              variant="outline"
              className="w-full h-11 text-base"
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}