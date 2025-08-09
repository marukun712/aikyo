import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomSelectSchema } from '../inputTypeSchemas/RoomSelectSchema';
import { RoomIncludeSchema } from '../inputTypeSchemas/RoomIncludeSchema';

export const RoomArgsSchema: z.ZodType<Prisma.RoomDefaultArgs> = z.object({
  select: z.lazy(() => RoomSelectSchema).optional(),
  include: z.lazy(() => RoomIncludeSchema).optional(),
}).strict();

export default RoomArgsSchema;
