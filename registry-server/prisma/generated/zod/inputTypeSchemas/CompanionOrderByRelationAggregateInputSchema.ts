import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const CompanionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CompanionOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict() as z.ZodType<Prisma.CompanionOrderByRelationAggregateInput>;

export default CompanionOrderByRelationAggregateInputSchema;
