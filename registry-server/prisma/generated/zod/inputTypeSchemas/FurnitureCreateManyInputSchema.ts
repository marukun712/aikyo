import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';

export const FurnitureCreateManyInputSchema: z.ZodType<Prisma.FurnitureCreateManyInput> = z.object({
  id: z.string().uuid().optional(),
  label: z.string(),
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int(),
  roomId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict() as z.ZodType<Prisma.FurnitureCreateManyInput>;

export default FurnitureCreateManyInputSchema;
