import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const CompanionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CompanionScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => CompanionScalarWhereWithAggregatesInputSchema),z.lazy(() => CompanionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CompanionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CompanionScalarWhereWithAggregatesInputSchema),z.lazy(() => CompanionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  personality: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  story: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  sample: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  roomId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict() as z.ZodType<Prisma.CompanionScalarWhereWithAggregatesInput>;

export default CompanionScalarWhereWithAggregatesInputSchema;
