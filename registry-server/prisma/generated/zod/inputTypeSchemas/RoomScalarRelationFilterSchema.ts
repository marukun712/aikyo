import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomWhereInputSchema } from './RoomWhereInputSchema';

export const RoomScalarRelationFilterSchema: z.ZodType<Prisma.RoomScalarRelationFilter> = z.object({
  is: z.lazy(() => RoomWhereInputSchema).optional(),
  isNot: z.lazy(() => RoomWhereInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomScalarRelationFilter>;

export default RoomScalarRelationFilterSchema;
