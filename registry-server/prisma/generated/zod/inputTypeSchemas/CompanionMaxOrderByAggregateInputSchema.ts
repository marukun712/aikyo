import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const CompanionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CompanionMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  personality: z.lazy(() => SortOrderSchema).optional(),
  story: z.lazy(() => SortOrderSchema).optional(),
  sample: z.lazy(() => SortOrderSchema).optional(),
  icon: z.lazy(() => SortOrderSchema).optional(),
  roomId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict() as z.ZodType<Prisma.CompanionMaxOrderByAggregateInput>;

export default CompanionMaxOrderByAggregateInputSchema;
