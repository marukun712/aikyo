import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';

export const RoomCountOutputTypeSelectSchema: z.ZodType<Prisma.RoomCountOutputTypeSelect> = z.object({
  furniture: z.boolean().optional(),
  companions: z.boolean().optional(),
}).strict();

export default RoomCountOutputTypeSelectSchema;
