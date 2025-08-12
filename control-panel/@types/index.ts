export type RoomResult = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  furniture: {
    id: string;
    label: string;
    x: number;
    y: number;
    z: number;
    roomId: string;
    createdAt: string;
    updatedAt: string;
  }[];
  companions: {
    id: string;
    name: string;
    personality: string;
    story: string;
    sample: string;
    icon: string;
    roomId: string;
    createdAt: string;
    updatedAt: string;
  }[];
}[];

export type Companion = {
  id: string;
  name: string;
  personality: string;
  story: string;
  sample: string;
  icon: string;
  roomId: string;
  createdAt: string;
  updatedAt: string;
};
