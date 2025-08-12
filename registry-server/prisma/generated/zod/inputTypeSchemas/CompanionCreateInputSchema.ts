import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomCreateNestedOneWithoutCompanionsInputSchema } from './RoomCreateNestedOneWithoutCompanionsInputSchema';

export const CompanionCreateInputSchema: z.ZodType<Prisma.CompanionCreateInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  personality: z.string(),
  story: z.string(),
  sample: z.string(),
  icon: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  room: z.lazy(() => RoomCreateNestedOneWithoutCompanionsInputSchema)
}).strict() as z.ZodType<Prisma.CompanionCreateInput>;

export default CompanionCreateInputSchema;
