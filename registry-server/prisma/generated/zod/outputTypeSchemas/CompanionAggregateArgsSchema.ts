import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionWhereInputSchema } from '../inputTypeSchemas/CompanionWhereInputSchema'
import { CompanionOrderByWithRelationInputSchema } from '../inputTypeSchemas/CompanionOrderByWithRelationInputSchema'
import { CompanionWhereUniqueInputSchema } from '../inputTypeSchemas/CompanionWhereUniqueInputSchema'

export const CompanionAggregateArgsSchema: z.ZodType<Prisma.CompanionAggregateArgs> = z.object({
  where: CompanionWhereInputSchema.optional(),
  orderBy: z.union([ CompanionOrderByWithRelationInputSchema.array(),CompanionOrderByWithRelationInputSchema ]).optional(),
  cursor: CompanionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() as z.ZodType<Prisma.CompanionAggregateArgs>;

export default CompanionAggregateArgsSchema;
