// components/GoalCard.tsx
export default function GoalCard({ title, progress, streak }: {
  title: string;
  progress: number;
  streak: number;
}) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <div className="streak-badge inline-block mt-1">🔥 {streak} day streak</div>
        </div>
        <div className="progress-text">{progress}%</div>
      </div>

      <div className="h-2 bg-[#2B2B2B] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#DAC09A] transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
