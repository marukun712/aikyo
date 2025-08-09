import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { CompanionCountOrderByAggregateInputSchema } from './CompanionCountOrderByAggregateInputSchema';
import { CompanionMaxOrderByAggregateInputSchema } from './CompanionMaxOrderByAggregateInputSchema';
import { CompanionMinOrderByAggregateInputSchema } from './CompanionMinOrderByAggregateInputSchema';

export const CompanionOrderByWithAggregationInputSchema: z.ZodType<Prisma.CompanionOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  personality: z.lazy(() => SortOrderSchema).optional(),
  story: z.lazy(() => SortOrderSchema).optional(),
  sample: z.lazy(() => SortOrderSchema).optional(),
  icon: z.lazy(() => SortOrderSchema).optional(),
  roomId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => CompanionCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CompanionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CompanionMinOrderByAggregateInputSchema).optional()
}).strict() as z.ZodType<Prisma.CompanionOrderByWithAggregationInput>;

export default CompanionOrderByWithAggregationInputSchema;
