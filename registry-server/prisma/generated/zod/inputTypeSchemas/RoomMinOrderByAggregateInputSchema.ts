import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const RoomMinOrderByAggregateInputSchema: z.ZodType<Prisma.RoomMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict() as z.ZodType<Prisma.RoomMinOrderByAggregateInput>;

export default RoomMinOrderByAggregateInputSchema;
