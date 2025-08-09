import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureIncludeSchema } from '../inputTypeSchemas/FurnitureIncludeSchema'
import { FurnitureWhereInputSchema } from '../inputTypeSchemas/FurnitureWhereInputSchema'
import { FurnitureOrderByWithRelationInputSchema } from '../inputTypeSchemas/FurnitureOrderByWithRelationInputSchema'
import { FurnitureWhereUniqueInputSchema } from '../inputTypeSchemas/FurnitureWhereUniqueInputSchema'
import { FurnitureScalarFieldEnumSchema } from '../inputTypeSchemas/FurnitureScalarFieldEnumSchema'
import { RoomArgsSchema } from "../outputTypeSchemas/RoomArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const FurnitureSelectSchema: z.ZodType<Prisma.FurnitureSelect> = z.object({
  id: z.boolean().optional(),
  label: z.boolean().optional(),
  x: z.boolean().optional(),
  y: z.boolean().optional(),
  z: z.boolean().optional(),
  roomId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  Room: z.union([z.boolean(),z.lazy(() => RoomArgsSchema)]).optional(),
}).strict()

export const FurnitureFindFirstArgsSchema: z.ZodType<Prisma.FurnitureFindFirstArgs> = z.object({
  select: FurnitureSelectSchema.optional(),
  include: z.lazy(() => FurnitureIncludeSchema).optional(),
  where: FurnitureWhereInputSchema.optional(),
  orderBy: z.union([ FurnitureOrderByWithRelationInputSchema.array(),FurnitureOrderByWithRelationInputSchema ]).optional(),
  cursor: FurnitureWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ FurnitureScalarFieldEnumSchema,FurnitureScalarFieldEnumSchema.array() ]).optional(),
}).strict() as z.ZodType<Prisma.FurnitureFindFirstArgs>;

export default FurnitureFindFirstArgsSchema;
