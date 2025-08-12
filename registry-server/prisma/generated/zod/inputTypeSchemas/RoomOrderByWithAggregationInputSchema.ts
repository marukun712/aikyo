import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { RoomCountOrderByAggregateInputSchema } from './RoomCountOrderByAggregateInputSchema';
import { RoomMaxOrderByAggregateInputSchema } from './RoomMaxOrderByAggregateInputSchema';
import { RoomMinOrderByAggregateInputSchema } from './RoomMinOrderByAggregateInputSchema';

export const RoomOrderByWithAggregationInputSchema: z.ZodType<Prisma.RoomOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RoomCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RoomMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RoomMinOrderByAggregateInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomOrderByWithAggregationInput>;

export default RoomOrderByWithAggregationInputSchema;
