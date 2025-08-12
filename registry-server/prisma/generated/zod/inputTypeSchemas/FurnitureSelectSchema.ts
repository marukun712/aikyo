import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomArgsSchema } from "../outputTypeSchemas/RoomArgsSchema"

export const FurnitureSelectSchema: z.ZodType<Prisma.FurnitureSelect> = z.object({
  id: z.boolean().optional(),
  label: z.boolean().optional(),
  x: z.boolean().optional(),
  y: z.boolean().optional(),
  z: z.boolean().optional(),
  roomId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  room: z.union([z.boolean(),z.lazy(() => RoomArgsSchema)]).optional(),
}).strict()

export default FurnitureSelectSchema;
