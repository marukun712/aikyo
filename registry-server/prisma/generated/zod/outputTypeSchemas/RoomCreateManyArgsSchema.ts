import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomCreateManyInputSchema } from '../inputTypeSchemas/RoomCreateManyInputSchema'

export const RoomCreateManyArgsSchema: z.ZodType<Prisma.RoomCreateManyArgs> = z.object({
  data: z.union([ RoomCreateManyInputSchema,RoomCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() as z.ZodType<Prisma.RoomCreateManyArgs>;

export default RoomCreateManyArgsSchema;
