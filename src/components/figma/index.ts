// Re-export shadcn/ui components with same names for compatibility
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export { Toggle } from '@/components/ui/toggle';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
export { Badge } from '@/components/ui/badge';
export { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
export { Label } from '@/components/ui/label';
export { Textarea } from '@/components/ui/textarea';
export { Checkbox } from '@/components/ui/checkbox';
export { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
export { Switch } from '@/components/ui/switch';
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
export { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export { ScrollArea } from '@/components/ui/scroll-area';
export { Separator } from '@/components/ui/separator';
export { Skeleton } from '@/components/ui/skeleton';

// Compatibility exports - custom components that wrap shadcn/ui
export { AppShell } from './layout/AppShell';
export { Navigation } from './layout/Navigation';
export { Header } from './layout/Header';
export { StatsCard } from './StatsCard';
export { RecentActivityList, type ActivityItem } from './RecentActivityList';
export { QuickActionButtons, type QuickAction } from './QuickActionButtons';
export { MetricsChart, type ChartDataPoint } from './MetricsChart';

// Type aliases for backward compatibility
export type CardProps = React.ComponentProps<typeof Card>;
export type ButtonProps = React.ComponentProps<typeof Button>;
export type InputProps = React.ComponentProps<typeof Input>;
