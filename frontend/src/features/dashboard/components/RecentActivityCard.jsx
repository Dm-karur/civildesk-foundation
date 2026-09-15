import { FileText, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { ActivityFeed } from '../../../components/composite/ActivityFeed';
import { ActivityItem } from '../../../components/composite/ActivityItem';

// Map semantic activity types to icons
const getIconForType = (type, status) => {
  const baseClasses = "w-4 h-4";
  switch (type) {
    case 'submission': return <FileText className={baseClasses} />;
    case 'approval': return <CheckCircle2 className={`${baseClasses} text-success`} />;
    case 'alert': return <AlertTriangle className={`${baseClasses} text-warning`} />;
    case 'update': return <Users className={baseClasses} />;
    default: return <FileText className={baseClasses} />;
  }
};

export function RecentActivityCard({ activities }) {
  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-text-primary">Recent Activity</h3>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <ActivityFeed>
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              title={activity.title}
              description={activity.entity}
              timestamp={activity.timestamp}
              icon={getIconForType(activity.type, activity.status)}
            />
          ))}
        </ActivityFeed>
      </div>
    </Card>
  );
}
