
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface ScoreEntry {
  id: string;
  score: number;
  date: string;
}

export interface GameAction {
  char: string;
  isCorrect: boolean;
  timeDelta: number;
  penaltyApplied: boolean;
}
