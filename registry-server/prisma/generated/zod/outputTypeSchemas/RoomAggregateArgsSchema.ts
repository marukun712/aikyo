import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomWhereInputSchema } from '../inputTypeSchemas/RoomWhereInputSchema'
import { RoomOrderByWithRelationInputSchema } from '../inputTypeSchemas/RoomOrderByWithRelationInputSchema'
import { RoomWhereUniqueInputSchema } from '../inputTypeSchemas/RoomWhereUniqueInputSchema'

export const RoomAggregateArgsSchema: z.ZodType<Prisma.RoomAggregateArgs> = z.object({
  where: RoomWhereInputSchema.optional(),
  orderBy: z.union([ RoomOrderByWithRelationInputSchema.array(),RoomOrderByWithRelationInputSchema ]).optional(),
  cursor: RoomWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() as z.ZodType<Prisma.RoomAggregateArgs>;

export default RoomAggregateArgsSchema;
