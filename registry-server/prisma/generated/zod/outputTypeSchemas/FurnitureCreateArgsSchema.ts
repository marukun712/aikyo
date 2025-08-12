import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureIncludeSchema } from '../inputTypeSchemas/FurnitureIncludeSchema'
import { FurnitureCreateInputSchema } from '../inputTypeSchemas/FurnitureCreateInputSchema'
import { FurnitureUncheckedCreateInputSchema } from '../inputTypeSchemas/FurnitureUncheckedCreateInputSchema'
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

export const FurnitureCreateArgsSchema: z.ZodType<Prisma.FurnitureCreateArgs> = z.object({
  select: FurnitureSelectSchema.optional(),
  include: z.lazy(() => FurnitureIncludeSchema).optional(),
  data: z.union([ FurnitureCreateInputSchema,FurnitureUncheckedCreateInputSchema ]),
}).strict() as z.ZodType<Prisma.FurnitureCreateArgs>;

export default FurnitureCreateArgsSchema;
