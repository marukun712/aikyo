import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureWhereInputSchema } from '../inputTypeSchemas/FurnitureWhereInputSchema'
import { FurnitureOrderByWithAggregationInputSchema } from '../inputTypeSchemas/FurnitureOrderByWithAggregationInputSchema'
import { FurnitureScalarFieldEnumSchema } from '../inputTypeSchemas/FurnitureScalarFieldEnumSchema'
import { FurnitureScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/FurnitureScalarWhereWithAggregatesInputSchema'

export const FurnitureGroupByArgsSchema: z.ZodType<Prisma.FurnitureGroupByArgs> = z.object({
  where: FurnitureWhereInputSchema.optional(),
  orderBy: z.union([ FurnitureOrderByWithAggregationInputSchema.array(),FurnitureOrderByWithAggregationInputSchema ]).optional(),
  by: FurnitureScalarFieldEnumSchema.array(),
  having: FurnitureScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() as z.ZodType<Prisma.FurnitureGroupByArgs>;

export default FurnitureGroupByArgsSchema;
