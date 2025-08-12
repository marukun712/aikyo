import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const CompanionScalarWhereInputSchema: z.ZodType<Prisma.CompanionScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CompanionScalarWhereInputSchema),z.lazy(() => CompanionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CompanionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CompanionScalarWhereInputSchema),z.lazy(() => CompanionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  personality: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  story: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  sample: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  roomId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict() as z.ZodType<Prisma.CompanionScalarWhereInput>;

export default CompanionScalarWhereInputSchema;
