import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureWhereInputSchema } from '../inputTypeSchemas/FurnitureWhereInputSchema'
import { FurnitureOrderByWithRelationInputSchema } from '../inputTypeSchemas/FurnitureOrderByWithRelationInputSchema'
import { FurnitureWhereUniqueInputSchema } from '../inputTypeSchemas/FurnitureWhereUniqueInputSchema'

export const FurnitureAggregateArgsSchema: z.ZodType<Prisma.FurnitureAggregateArgs> = z.object({
  where: FurnitureWhereInputSchema.optional(),
  orderBy: z.union([ FurnitureOrderByWithRelationInputSchema.array(),FurnitureOrderByWithRelationInputSchema ]).optional(),
  cursor: FurnitureWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() as z.ZodType<Prisma.FurnitureAggregateArgs>;

export default FurnitureAggregateArgsSchema;
