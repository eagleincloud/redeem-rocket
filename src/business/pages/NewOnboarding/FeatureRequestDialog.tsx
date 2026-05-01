import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Lightbulb, Send } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureRequestDialogProps {
  trigger?: React.ReactNode;
}

export default function FeatureRequestDialog({ trigger }: FeatureRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    featureName: '',
    category: '',
    description: '',
    useCase: '',
    priority: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    toast.success('Feature request submitted successfully!', {
      description: 'Our team will review your request and get back to you soon.'
    });

    setFormData({
      featureName: '',
      category: '',
      description: '',
      useCase: '',
      priority: ''
    });
    setOpen(false);
  };

  const isFormValid = formData.featureName && formData.category && formData.description;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Lightbulb className="w-4 h-4 mr-2" />
            Request Custom Feature
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request a Custom Feature</DialogTitle>
          <DialogDescription>
            Tell us what you need and we'll build it for you. Our team specializes in creating custom features tailored to your business needs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="feature-name">Feature Name *</Label>
            <Input
              id="feature-name"
              placeholder="e.g., Inventory Management System"
              value={formData.featureName}
              onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
              className="mt-2"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crm">CRM & Leads</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales & Payments</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
                <SelectItem value="analytics">Analytics & Reports</SelectItem>
                <SelectItem value="integrations">Integrations</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the feature you need in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-2"
              rows={5}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Be as specific as possible about what you want this feature to do
            </p>
          </div>

          <div>
            <Label htmlFor="use-case">Use Case</Label>
            <Textarea
              id="use-case"
              placeholder="How will you use this feature in your business?"
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="How urgent is this feature?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Nice to have</SelectItem>
                <SelectItem value="medium">Medium - Important for growth</SelectItem>
                <SelectItem value="high">High - Critical for business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
              <li>Our team will review your request within 24-48 hours</li>
              <li>We'll provide a cost estimate and timeline</li>
              <li>Once approved, we'll build and integrate it into your app</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
