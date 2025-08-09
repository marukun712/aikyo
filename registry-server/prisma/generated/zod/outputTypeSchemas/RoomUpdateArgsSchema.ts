import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomIncludeSchema } from '../inputTypeSchemas/RoomIncludeSchema'
import { RoomUpdateInputSchema } from '../inputTypeSchemas/RoomUpdateInputSchema'
import { RoomUncheckedUpdateInputSchema } from '../inputTypeSchemas/RoomUncheckedUpdateInputSchema'
import { RoomWhereUniqueInputSchema } from '../inputTypeSchemas/RoomWhereUniqueInputSchema'
import { FurnitureFindManyArgsSchema } from "../outputTypeSchemas/FurnitureFindManyArgsSchema"
import { CompanionFindManyArgsSchema } from "../outputTypeSchemas/CompanionFindManyArgsSchema"
import { RoomCountOutputTypeArgsSchema } from "../outputTypeSchemas/RoomCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const RoomSelectSchema: z.ZodType<Prisma.RoomSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  furniture: z.union([z.boolean(),z.lazy(() => FurnitureFindManyArgsSchema)]).optional(),
  companions: z.union([z.boolean(),z.lazy(() => CompanionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => RoomCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const RoomUpdateArgsSchema: z.ZodType<Prisma.RoomUpdateArgs> = z.object({
  select: RoomSelectSchema.optional(),
  include: z.lazy(() => RoomIncludeSchema).optional(),
  data: z.union([ RoomUpdateInputSchema,RoomUncheckedUpdateInputSchema ]),
  where: RoomWhereUniqueInputSchema,
}).strict() as z.ZodType<Prisma.RoomUpdateArgs>;

export default RoomUpdateArgsSchema;
