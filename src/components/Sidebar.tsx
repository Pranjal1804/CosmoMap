import StatsCard from './StatsCard';
import UploadCard from './UploadCard';
import DetectionsList from './DetectionList';
import { Detection, Stats } from '@/types';

interface SidebarProps {
  stats: Stats;
  detections: Detection[];
  onUploadSuccess: () => void;
  onDetectionClick: (detectionId: string) => void;
  isLoading: boolean;
}

export default function Sidebar({ 
  stats, 
  detections, 
  onUploadSuccess, 
  onDetectionClick,
  isLoading 
}: SidebarProps) {
  return (
    <div className="sidebar">
      <StatsCard stats={stats} />
      <UploadCard onUploadSuccess={onUploadSuccess} isLoading={isLoading} />
      <DetectionsList 
        detections={detections} 
        onDetectionClick={onDetectionClick} 
      />
    </div>
  );
}