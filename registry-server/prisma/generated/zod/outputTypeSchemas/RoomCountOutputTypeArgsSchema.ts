import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomCountOutputTypeSelectSchema } from './RoomCountOutputTypeSelectSchema';

export const RoomCountOutputTypeArgsSchema: z.ZodType<Prisma.RoomCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => RoomCountOutputTypeSelectSchema).nullish(),
}).strict();

export default RoomCountOutputTypeSelectSchema;
