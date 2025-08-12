import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionIncludeSchema } from '../inputTypeSchemas/CompanionIncludeSchema'
import { CompanionWhereInputSchema } from '../inputTypeSchemas/CompanionWhereInputSchema'
import { CompanionOrderByWithRelationInputSchema } from '../inputTypeSchemas/CompanionOrderByWithRelationInputSchema'
import { CompanionWhereUniqueInputSchema } from '../inputTypeSchemas/CompanionWhereUniqueInputSchema'
import { CompanionScalarFieldEnumSchema } from '../inputTypeSchemas/CompanionScalarFieldEnumSchema'
import { RoomArgsSchema } from "../outputTypeSchemas/RoomArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const CompanionSelectSchema: z.ZodType<Prisma.CompanionSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  personality: z.boolean().optional(),
  story: z.boolean().optional(),
  sample: z.boolean().optional(),
  icon: z.boolean().optional(),
  roomId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  room: z.union([z.boolean(),z.lazy(() => RoomArgsSchema)]).optional(),
}).strict()

export const CompanionFindFirstArgsSchema: z.ZodType<Prisma.CompanionFindFirstArgs> = z.object({
  select: CompanionSelectSchema.optional(),
  include: z.lazy(() => CompanionIncludeSchema).optional(),
  where: CompanionWhereInputSchema.optional(),
  orderBy: z.union([ CompanionOrderByWithRelationInputSchema.array(),CompanionOrderByWithRelationInputSchema ]).optional(),
  cursor: CompanionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ CompanionScalarFieldEnumSchema,CompanionScalarFieldEnumSchema.array() ]).optional(),
}).strict() as z.ZodType<Prisma.CompanionFindFirstArgs>;

export default CompanionFindFirstArgsSchema;
