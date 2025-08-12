import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { FurnitureCountOrderByAggregateInputSchema } from './FurnitureCountOrderByAggregateInputSchema';
import { FurnitureAvgOrderByAggregateInputSchema } from './FurnitureAvgOrderByAggregateInputSchema';
import { FurnitureMaxOrderByAggregateInputSchema } from './FurnitureMaxOrderByAggregateInputSchema';
import { FurnitureMinOrderByAggregateInputSchema } from './FurnitureMinOrderByAggregateInputSchema';
import { FurnitureSumOrderByAggregateInputSchema } from './FurnitureSumOrderByAggregateInputSchema';

export const FurnitureOrderByWithAggregationInputSchema: z.ZodType<Prisma.FurnitureOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  z: z.lazy(() => SortOrderSchema).optional(),
  roomId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => FurnitureCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => FurnitureAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => FurnitureMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => FurnitureMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => FurnitureSumOrderByAggregateInputSchema).optional()
}).strict() as z.ZodType<Prisma.FurnitureOrderByWithAggregationInput>;

export default FurnitureOrderByWithAggregationInputSchema;
