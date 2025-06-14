import { Stats } from '@/types';

interface StatsCardProps {
  stats: Stats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  // Calculate tactical detections and average confidence
  let tacticalCount = 0;
  let totalConfidence = 0;

  if (stats.objectTypes) {
    const tacticalTypes = ['person', 'car', 'truck', 'airplane', 'boat', 'motorcycle', 'bus', 'train'];
    stats.objectTypes.forEach(type => {
      if (tacticalTypes.includes(type._id)) {
        tacticalCount += type.count;
      }
      totalConfidence += type.avgConfidence * type.count;
    });
  }

  const avgConfidence = stats.totalDetections > 0 
    ? Math.round((totalConfidence / stats.totalDetections) * 100)
    : 0;

  return (
    <div className="card">
      <h3>
        <i className="fas fa-chart-bar"></i> Detection Statistics
      </h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.totalDetections}</div>
          <div className="stat-label">Total Detections</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.recentDetections}</div>
          <div className="stat-label">Last 24h</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{tacticalCount}</div>
          <div className="stat-label">Tactical Objects</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{avgConfidence}%</div>
          <div className="stat-label">Avg Confidence</div>
        </div>
      </div>
    </div>
  );
}