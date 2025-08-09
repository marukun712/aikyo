import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionWhereInputSchema } from '../inputTypeSchemas/CompanionWhereInputSchema'
import { CompanionOrderByWithAggregationInputSchema } from '../inputTypeSchemas/CompanionOrderByWithAggregationInputSchema'
import { CompanionScalarFieldEnumSchema } from '../inputTypeSchemas/CompanionScalarFieldEnumSchema'
import { CompanionScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/CompanionScalarWhereWithAggregatesInputSchema'

export const CompanionGroupByArgsSchema: z.ZodType<Prisma.CompanionGroupByArgs> = z.object({
  where: CompanionWhereInputSchema.optional(),
  orderBy: z.union([ CompanionOrderByWithAggregationInputSchema.array(),CompanionOrderByWithAggregationInputSchema ]).optional(),
  by: CompanionScalarFieldEnumSchema.array(),
  having: CompanionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() as z.ZodType<Prisma.CompanionGroupByArgs>;

export default CompanionGroupByArgsSchema;
