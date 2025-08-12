import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const FurnitureAvgOrderByAggregateInputSchema: z.ZodType<Prisma.FurnitureAvgOrderByAggregateInput> = z.object({
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  z: z.lazy(() => SortOrderSchema).optional()
}).strict() as z.ZodType<Prisma.FurnitureAvgOrderByAggregateInput>;

export default FurnitureAvgOrderByAggregateInputSchema;
