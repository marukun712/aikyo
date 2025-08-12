import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const FurnitureScalarWhereInputSchema: z.ZodType<Prisma.FurnitureScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => FurnitureScalarWhereInputSchema),z.lazy(() => FurnitureScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => FurnitureScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => FurnitureScalarWhereInputSchema),z.lazy(() => FurnitureScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  label: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  x: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  y: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  z: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  roomId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict() as z.ZodType<Prisma.FurnitureScalarWhereInput>;

export default FurnitureScalarWhereInputSchema;
