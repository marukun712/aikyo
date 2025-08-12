import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureWhereInputSchema } from './FurnitureWhereInputSchema';

export const FurnitureListRelationFilterSchema: z.ZodType<Prisma.FurnitureListRelationFilter> = z.object({
  every: z.lazy(() => FurnitureWhereInputSchema).optional(),
  some: z.lazy(() => FurnitureWhereInputSchema).optional(),
  none: z.lazy(() => FurnitureWhereInputSchema).optional()
}).strict() as z.ZodType<Prisma.FurnitureListRelationFilter>;

export default FurnitureListRelationFilterSchema;
