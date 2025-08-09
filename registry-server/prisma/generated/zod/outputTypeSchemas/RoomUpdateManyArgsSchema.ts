import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomUpdateManyMutationInputSchema } from '../inputTypeSchemas/RoomUpdateManyMutationInputSchema'
import { RoomUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/RoomUncheckedUpdateManyInputSchema'
import { RoomWhereInputSchema } from '../inputTypeSchemas/RoomWhereInputSchema'

export const RoomUpdateManyArgsSchema: z.ZodType<Prisma.RoomUpdateManyArgs> = z.object({
  data: z.union([ RoomUpdateManyMutationInputSchema,RoomUncheckedUpdateManyInputSchema ]),
  where: RoomWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() as z.ZodType<Prisma.RoomUpdateManyArgs>;

export default RoomUpdateManyArgsSchema;
