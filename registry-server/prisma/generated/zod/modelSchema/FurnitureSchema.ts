import { z } from 'zod';

/////////////////////////////////////////
// FURNITURE SCHEMA
/////////////////////////////////////////

export const FurnitureSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int(),
  roomId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Furniture = z.infer<typeof FurnitureSchema>

export default FurnitureSchema;
