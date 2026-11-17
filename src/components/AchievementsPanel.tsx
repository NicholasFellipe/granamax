// 🏆 PAINEL DE CONQUISTAS

import { Trophy, Lock } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
}

interface AchievementsPanelProps {
  achievements: Achievement[];
}

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = (unlockedCount / totalCount) * 100;

  return (
    <Card>
      <CardHeader 
        title="Conquistas"
        subtitle={`${unlockedCount} de ${totalCount} desbloqueadas`}
        action={
          <Badge variant={unlockedCount === totalCount ? 'success' : 'default'}>
            <Trophy size={14} />
            {progressPercentage.toFixed(0)}%
          </Badge>
        }
      />
      <CardContent>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`achievement-item ${achievement.unlocked ? 'achievement-unlocked' : 'achievement-locked'}`}
            >
              <div className="achievement-icon-wrapper">
                <span className="achievement-emoji">{achievement.icon}</span>
                {!achievement.unlocked && (
                  <div className="achievement-lock">
                    <Lock size={16} />
                  </div>
                )}
              </div>

              <div className="achievement-content">
                <h4 className="achievement-title">{achievement.title}</h4>
                <p className="achievement-description">{achievement.description}</p>
                
                {!achievement.unlocked && achievement.progress !== undefined && (
                  <div className="achievement-progress">
                    <div className="achievement-progress-bar">
                      <div 
                        className="achievement-progress-fill"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                    <span className="achievement-progress-text">
                      {achievement.progress.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {achievement.unlocked && (
                <div className="achievement-badge">
                  <Badge variant="success" size="sm">✓</Badge>
                </div>
              )}
            </div>
          ))}
        </div>

        {unlockedCount === totalCount && (
          <div className="achievements-complete">
            <Trophy size={48} className="text-primary" />
            <h3>Mestre Financeiro!</h3>
            <p>Você desbloqueou todas as conquistas! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
