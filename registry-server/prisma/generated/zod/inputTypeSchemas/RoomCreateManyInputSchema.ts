import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';

export const RoomCreateManyInputSchema: z.ZodType<Prisma.RoomCreateManyInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict() as z.ZodType<Prisma.RoomCreateManyInput>;

export default RoomCreateManyInputSchema;
