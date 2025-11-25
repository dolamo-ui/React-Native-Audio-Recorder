// types.ts
export type RecordingItem = {
  id: number;
  uri: string;
  duration: number;
  createdAt: string;
  title?: string;
};

export type Settings = {
  highQuality: boolean;
  autoSave: boolean;
};
