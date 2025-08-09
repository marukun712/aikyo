import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { FurnitureOrderByRelationAggregateInputSchema } from './FurnitureOrderByRelationAggregateInputSchema';
import { CompanionOrderByRelationAggregateInputSchema } from './CompanionOrderByRelationAggregateInputSchema';

export const RoomOrderByWithRelationInputSchema: z.ZodType<Prisma.RoomOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  furniture: z.lazy(() => FurnitureOrderByRelationAggregateInputSchema).optional(),
  companions: z.lazy(() => CompanionOrderByRelationAggregateInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomOrderByWithRelationInput>;

export default RoomOrderByWithRelationInputSchema;
