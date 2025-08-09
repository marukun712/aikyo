import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { RoomOrderByWithRelationInputSchema } from './RoomOrderByWithRelationInputSchema';

export const FurnitureOrderByWithRelationInputSchema: z.ZodType<Prisma.FurnitureOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  label: z.lazy(() => SortOrderSchema).optional(),
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  z: z.lazy(() => SortOrderSchema).optional(),
  roomId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  Room: z.lazy(() => RoomOrderByWithRelationInputSchema).optional()
}).strict() as z.ZodType<Prisma.FurnitureOrderByWithRelationInput>;

export default FurnitureOrderByWithRelationInputSchema;
