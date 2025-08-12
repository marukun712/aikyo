import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureWhereInputSchema } from './FurnitureWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { IntFilterSchema } from './IntFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { RoomScalarRelationFilterSchema } from './RoomScalarRelationFilterSchema';
import { RoomWhereInputSchema } from './RoomWhereInputSchema';

export const FurnitureWhereUniqueInputSchema: z.ZodType<Prisma.FurnitureWhereUniqueInput> = z.object({
  id: z.string().uuid()
})
.and(z.object({
  id: z.string().uuid().optional(),
  AND: z.union([ z.lazy(() => FurnitureWhereInputSchema),z.lazy(() => FurnitureWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => FurnitureWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => FurnitureWhereInputSchema),z.lazy(() => FurnitureWhereInputSchema).array() ]).optional(),
  label: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  x: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  y: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  z: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  roomId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  room: z.union([ z.lazy(() => RoomScalarRelationFilterSchema),z.lazy(() => RoomWhereInputSchema) ]).optional(),
}).strict()) as z.ZodType<Prisma.FurnitureWhereUniqueInput>;

export default FurnitureWhereUniqueInputSchema;
