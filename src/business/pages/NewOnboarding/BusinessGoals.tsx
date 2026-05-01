import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Users, TrendingUp, Target, Megaphone, Award } from 'lucide-react';

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
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          What do you want to achieve?
        </h2>
        <p className="text-gray-600 mb-8">
          Select all that apply to get personalized feature recommendations
        </p>

        <div className="space-y-4 mb-8">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoals.includes(goal.id);

            return (
              <div
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleGoal(goal.id)}
                />
                <div className={`
                  p-3 rounded-lg
                  ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}
                `}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className="text-lg font-medium text-gray-900">
                  {goal.label}
                </span>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => navigate('/register/details')}
          disabled={selectedGoals.length === 0}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg"
        >
          Next
        </Button>
      </div>
    </div>
  );
}