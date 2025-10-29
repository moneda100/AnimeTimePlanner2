export interface CalculationResult {
  episodes: number;
  durationPerEpisode: number;
  totalMinutes: number;
  days: number;
  hours: number;
  minutes: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  savedAt: string;
}

export interface ScheduledAnime {
  id: string;
  name: string;
  episodes: number;
  durationPerEpisode: number;
  totalMinutes: number;
  startDate: Date;
  endDate: Date;
  imageUrl?: string; // Added imageUrl
}

export interface DayInfo {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  scheduledItems: ScheduledAnime[];
}