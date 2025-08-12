import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';

export const FurnitureUncheckedCreateWithoutRoomInputSchema: z.ZodType<Prisma.FurnitureUncheckedCreateWithoutRoomInput> = z.object({
  id: z.string().uuid().optional(),
  label: z.string(),
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict() as z.ZodType<Prisma.FurnitureUncheckedCreateWithoutRoomInput>;

export default FurnitureUncheckedCreateWithoutRoomInputSchema;
