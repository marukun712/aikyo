import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { RoomScalarRelationFilterSchema } from './RoomScalarRelationFilterSchema';
import { RoomWhereInputSchema } from './RoomWhereInputSchema';

export const CompanionWhereInputSchema: z.ZodType<Prisma.CompanionWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CompanionWhereInputSchema),z.lazy(() => CompanionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CompanionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CompanionWhereInputSchema),z.lazy(() => CompanionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  personality: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  story: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  sample: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  icon: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  roomId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  room: z.union([ z.lazy(() => RoomScalarRelationFilterSchema),z.lazy(() => RoomWhereInputSchema) ]).optional(),
}).strict() as z.ZodType<Prisma.CompanionWhereInput>;

export default CompanionWhereInputSchema;
