import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Zap,
  ArrowRight,
  MessageSquare,
  UserPlus,
  Clock,
  Play,
  Pause,
  Eye,
  Copy,
  Trash2,
  Settings,
} from "lucide-react";

const automations = [
  {
    id: 1,
    name: "Welcome New Leads",
    description:
      "Send WhatsApp message when a new lead is added",
    enabled: true,
    trigger: "New Lead Added",
    triggerColor: "#3B82F6",
    actions: [
      "Send WhatsApp",
      "Assign to team",
      "Set reminder",
    ],
    runsToday: 12,
    totalRuns: 284,
    lastRun: "5 min ago",
    category: "Lead Nurturing",
  },
  {
    id: 2,
    name: "Follow-up Reminder",
    description:
      "Set follow-up task 24 hours after first contact",
    enabled: true,
    trigger: "Lead Contacted",
    triggerColor: "#F59E0B",
    actions: ["Set reminder", "Send email"],
    runsToday: 8,
    totalRuns: 156,
    lastRun: "1 hour ago",
    category: "Follow-up",
  },
  {
    id: 3,
    name: "Hot Lead Alert",
    description:
      "Notify manager when lead is marked as high priority",
    enabled: false,
    trigger: "Priority Changed",
    triggerColor: "#EF4444",
    actions: ["Notify manager", "Create task"],
    runsToday: 0,
    totalRuns: 42,
    lastRun: "2 days ago",
    category: "Alerts",
  },
  {
    id: 4,
    name: "Monthly Report",
    description:
      "Auto-generate and email business analytics every month",
    enabled: true,
    trigger: "Monthly Schedule",
    triggerColor: "#8B5CF6",
    actions: ["Generate report", "Send email"],
    runsToday: 0,
    totalRuns: 6,
    lastRun: "Apr 1, 2026",
    category: "Reporting",
  },
];

const flowTemplates = [
  {
    name: "Lead Welcome Flow",
    desc: "New lead → WhatsApp → Assign → Remind",
    icon: "👋",
    color: "#3B82F6",
  },
  {
    name: "Appointment Reminder",
    desc: "Booking created → 24h SMS → 1h push",
    icon: "📅",
    color: "#10B981",
  },
  {
    name: "Re-engagement Campaign",
    desc: "Inactive 30d → Email → WhatsApp",
    icon: "🔄",
    color: "#F59E0B",
  },
  {
    name: "Birthday Reward",
    desc: "Birthday → Send coupon → Track redemption",
    icon: "🎂",
    color: "#EC4899",
  },
];

export default function AutomationPage() {
  const [flows, setFlows] = useState(automations);

  const toggleAutomation = (id: number) => {
    setFlows((prev) =>
      prev.map((flow) => {
        if (flow.id !== id) return flow;
        const updated = { ...flow, enabled: !flow.enabled };
        toast.success(
          updated.enabled
            ? `${flow.name} activated`
            : `${flow.name} paused`,
        );
        return updated;
      }),
    );
  };

  const totalRuns = flows.reduce(
    (sum, f) => sum + f.runsToday,
    0,
  );
  const activeFlows = flows.filter((f) => f.enabled).length;

  return (
    <div className="p-6 py-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-gray-900"
            style={{ fontWeight: 700, fontSize: "1.3rem" }}
          >
            Automation
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {activeFlows} active flows • {totalRuns} runs today
          </p>
        </div>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={() =>
            toast.info("Flow builder coming soon!")
          }
        >
          <Plus className="w-4 h-4" /> Create Flow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Active Flows",
            value: activeFlows.toString(),
            color: "#10B981",
            icon: "⚡",
          },
          {
            label: "Runs Today",
            value: totalRuns.toString(),
            color: "#3B82F6",
            icon: "🔄",
          },
          {
            label: "Time Saved",
            value: "4.5 hrs",
            color: "#8B5CF6",
            icon: "⏱️",
          },
          {
            label: "Total Runs",
            value: flows
              .reduce((s, f) => s + f.totalRuns, 0)
              .toLocaleString(),
            color: "#F59E0B",
            icon: "📊",
          },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: stat.color,
                }}
              >
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Automation Flows */}
      <h3
        className="text-gray-700 mb-3"
        style={{ fontWeight: 600, fontSize: "0.95rem" }}
      >
        Your Flows
      </h3>
      <div className="space-y-3 mb-8">
        {flows.map((flow) => (
          <Card key={flow.id} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3
                      className="text-gray-900"
                      style={{ fontWeight: 600 }}
                    >
                      {flow.name}
                    </h3>
                    <Badge
                      className={
                        flow.enabled
                          ? "bg-green-100 text-green-700 border-0"
                          : "bg-gray-100 text-gray-600 border-0"
                      }
                    >
                      {flow.enabled ? "● Active" : "○ Paused"}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {flow.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {flow.description}
                  </p>

                  {/* Flow diagram */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                      style={{
                        backgroundColor:
                          flow.triggerColor + "18",
                        color: flow.triggerColor,
                        fontWeight: 600,
                      }}
                    >
                      <Zap className="w-3 h-3" />
                      {flow.trigger}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    {flow.actions.map((action, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1"
                      >
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs"
                          style={{ fontWeight: 500 }}
                        >
                          {action}
                        </div>
                        {i < flow.actions.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>{flow.runsToday} runs today</span>
                    <span>•</span>
                    <span>{flow.totalRuns} total</span>
                    <span>•</span>
                    <span>Last: {flow.lastRun}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  <Switch
                    checked={flow.enabled}
                    onCheckedChange={() =>
                      toggleAutomation(flow.id)
                    }
                  />
                  <div className="flex gap-1">
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                      onClick={() =>
                        toast.info("Edit flow coming soon!")
                      }
                      title="Edit"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                      onClick={() =>
                        toast.info("View logs coming soon!")
                      }
                      title="Logs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                      onClick={() =>
                        toast.info("Flow duplicated!")
                      }
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates */}
      <h3
        className="text-gray-700 mb-3"
        style={{ fontWeight: 600, fontSize: "0.95rem" }}
      >
        🚀 Start with a Template
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {flowTemplates.map((template) => (
          <button
            key={template.name}
            className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left"
            onClick={() =>
              toast.success(
                `"${template.name}" template applied!`,
              )
            }
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
              style={{ backgroundColor: template.color + "18" }}
            >
              {template.icon}
            </div>
            <div
              className="text-sm text-gray-900 mb-1"
              style={{ fontWeight: 600 }}
            >
              {template.name}
            </div>
            <div className="text-xs text-gray-400">
              {template.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Visual Flow Builder Example */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle style={{ fontSize: "1rem" }}>
            How Automation Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
            <div className="max-w-lg mx-auto">
              <div className="space-y-0">
                {[
                  {
                    step: "Trigger",
                    desc: "New Lead Added",
                    icon: Zap,
                    color: "#F59E0B",
                    bg: "bg-yellow-400",
                  },
                  {
                    step: "Action 1",
                    desc: "Send WhatsApp welcome message",
                    icon: MessageSquare,
                    color: "#3B82F6",
                    bg: "bg-blue-600",
                  },
                  {
                    step: "Action 2",
                    desc: "Assign to sales manager",
                    icon: UserPlus,
                    color: "#10B981",
                    bg: "bg-green-600",
                  },
                  {
                    step: "Action 3",
                    desc: "Set follow-up reminder for 24 hours",
                    icon: Clock,
                    color: "#8B5CF6",
                    bg: "bg-purple-600",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i}>
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 ${item.bg} rounded-full flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm">
                          <p className="text-xs text-gray-400 mb-0.5">
                            {item.step}
                          </p>
                          <p
                            className="text-sm text-gray-900"
                            style={{ fontWeight: 600 }}
                          >
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      {i < 3 && (
                        <div
                          className="ml-6 w-0.5 h-6 bg-gray-300 mx-auto"
                          style={{ marginLeft: 23 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <Button
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={() =>
                  toast.info("Flow builder launching soon!")
                }
              >
                <Plus className="w-4 h-4" /> Create This Flow
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}