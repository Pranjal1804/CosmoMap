import { Detection } from '@/types';

interface DetectionsListProps {
  detections: Detection[];
  onDetectionClick: (detectionId: string) => void;
}

export default function DetectionsList({ detections, onDetectionClick }: DetectionsListProps) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (detections.length === 0) {
    return (
      <div className="card" style={{ flex: 1 }}>
        <h3>
          <i className="fas fa-list"></i> Recent Detections
        </h3>
        <div className="detections-list">
          <div style={{ textAlign: 'center', opacity: 0.6, padding: '2rem' }}>
            No detections yet. Upload an image to get started.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ flex: 1 }}>
      <h3>
        <i className="fas fa-list"></i> Recent Detections
      </h3>
      <div className="detections-list">
        {detections.slice(0, 20).map((detection) => {
          const timeAgo = getTimeAgo(new Date(detection.timestamp));
          const confidence = Math.round(detection.confidence * 100);
          
          return (
            <div 
              key={detection._id}
              className="detection-item"
              onClick={() => onDetectionClick(detection._id)}
            >
              <div className="detection-type">
                <i className="fas fa-crosshairs"></i> {detection.objectType}
              </div>
              <div className="detection-confidence">
                Confidence: {confidence}%
              </div>
              <div className="detection-time">{timeAgo}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}