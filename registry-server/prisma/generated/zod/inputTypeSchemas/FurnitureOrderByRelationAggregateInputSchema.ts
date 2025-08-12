import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const FurnitureOrderByRelationAggregateInputSchema: z.ZodType<Prisma.FurnitureOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict() as z.ZodType<Prisma.FurnitureOrderByRelationAggregateInput>;

export default FurnitureOrderByRelationAggregateInputSchema;
