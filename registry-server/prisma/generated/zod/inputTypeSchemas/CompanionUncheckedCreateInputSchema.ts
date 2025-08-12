import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';

export const CompanionUncheckedCreateInputSchema: z.ZodType<Prisma.CompanionUncheckedCreateInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  personality: z.string(),
  story: z.string(),
  sample: z.string(),
  icon: z.string(),
  roomId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict() as z.ZodType<Prisma.CompanionUncheckedCreateInput>;

export default CompanionUncheckedCreateInputSchema;
