export interface StudentItem {
  id: number; // 1 ~ 24
  name: string; // custom student name or empty
  isExcluded: boolean; // absent or excluded
  isPicked: boolean; // already drawn in current round
  pickedOrder?: number;
}

export type PickerMode = 'slot' | 'wheel' | 'cards' | 'lottery' | 'groups';

export interface DrawHistoryRecord {
  id: string;
  mode: PickerMode;
  numbers: number[];
  names: string[];
  timestamp: string;
  note?: string;
}

export interface ClassSettings {
  minNum: number;
  maxNum: number; // default 24
  preventDuplicates: boolean;
  pickCount: number; // 1, 2, 3, etc.
  soundEnabled: boolean;
  showNames: boolean;
  animationSpeed: 'normal' | 'fast' | 'slow';
}
