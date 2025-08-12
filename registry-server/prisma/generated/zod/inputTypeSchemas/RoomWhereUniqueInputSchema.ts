import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomWhereInputSchema } from './RoomWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { FurnitureListRelationFilterSchema } from './FurnitureListRelationFilterSchema';
import { CompanionListRelationFilterSchema } from './CompanionListRelationFilterSchema';

export const RoomWhereUniqueInputSchema: z.ZodType<Prisma.RoomWhereUniqueInput> = z.object({
  id: z.string().uuid()
})
.and(z.object({
  id: z.string().uuid().optional(),
  AND: z.union([ z.lazy(() => RoomWhereInputSchema),z.lazy(() => RoomWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RoomWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RoomWhereInputSchema),z.lazy(() => RoomWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  furniture: z.lazy(() => FurnitureListRelationFilterSchema).optional(),
  companions: z.lazy(() => CompanionListRelationFilterSchema).optional()
}).strict()) as z.ZodType<Prisma.RoomWhereUniqueInput>;

export default RoomWhereUniqueInputSchema;
