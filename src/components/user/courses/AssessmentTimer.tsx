import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatTime } from "./learn";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Assessment Timer Component
const AssessmentTimer = ({ 
  timeLimit, 
  onTimeUp,
  isPaused = false 
}: { 
  timeLimit: number; 
  onTimeUp: () => void;
  isPaused?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, isPaused]);

  const progressPercentage = (timeLeft / (timeLimit * 60)) * 100;
  const isWarning = timeLeft < 300;
  const isCritical = timeLeft < 60;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${
            isCritical ? 'text-red-500' : 
            isWarning ? 'text-amber-500' : 
            'text-emerald-600'
          }`} />
          <span className={`font-medium ${
            isCritical ? 'text-red-600' : 
            isWarning ? 'text-amber-600' : 
            'text-emerald-700'
          }`}>
            Time Remaining: {formatTime(timeLeft)}
          </span>
        </div>
        {isPaused && (
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            Paused
          </Badge>
        )}
      </div>
      <Progress
        value={progressPercentage} 
        className={`h-2 ${
          isCritical ? 'bg-red-100' : 
          isWarning ? 'bg-amber-100' : 
          'bg-emerald-100'
        }`}
      />
    </div>
  );
};
export default AssessmentTimer;