import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { IntWithAggregatesFilterSchema } from './IntWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const FurnitureScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.FurnitureScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => FurnitureScalarWhereWithAggregatesInputSchema),z.lazy(() => FurnitureScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => FurnitureScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => FurnitureScalarWhereWithAggregatesInputSchema),z.lazy(() => FurnitureScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  label: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  x: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  y: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  z: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  roomId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict() as z.ZodType<Prisma.FurnitureScalarWhereWithAggregatesInput>;

export default FurnitureScalarWhereWithAggregatesInputSchema;
