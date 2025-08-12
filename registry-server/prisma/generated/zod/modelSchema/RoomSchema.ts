import { z } from 'zod';

/////////////////////////////////////////
// ROOM SCHEMA
/////////////////////////////////////////

export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Room = z.infer<typeof RoomSchema>

export default RoomSchema;
