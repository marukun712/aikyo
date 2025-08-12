import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureIncludeSchema } from '../inputTypeSchemas/FurnitureIncludeSchema'
import { FurnitureUpdateInputSchema } from '../inputTypeSchemas/FurnitureUpdateInputSchema'
import { FurnitureUncheckedUpdateInputSchema } from '../inputTypeSchemas/FurnitureUncheckedUpdateInputSchema'
import { FurnitureWhereUniqueInputSchema } from '../inputTypeSchemas/FurnitureWhereUniqueInputSchema'
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
  room: z.union([z.boolean(),z.lazy(() => RoomArgsSchema)]).optional(),
}).strict()

export const FurnitureUpdateArgsSchema: z.ZodType<Prisma.FurnitureUpdateArgs> = z.object({
  select: FurnitureSelectSchema.optional(),
  include: z.lazy(() => FurnitureIncludeSchema).optional(),
  data: z.union([ FurnitureUpdateInputSchema,FurnitureUncheckedUpdateInputSchema ]),
  where: FurnitureWhereUniqueInputSchema,
}).strict() as z.ZodType<Prisma.FurnitureUpdateArgs>;

export default FurnitureUpdateArgsSchema;
