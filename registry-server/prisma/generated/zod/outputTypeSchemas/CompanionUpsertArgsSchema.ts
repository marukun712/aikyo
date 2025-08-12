import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionIncludeSchema } from '../inputTypeSchemas/CompanionIncludeSchema'
import { CompanionWhereUniqueInputSchema } from '../inputTypeSchemas/CompanionWhereUniqueInputSchema'
import { CompanionCreateInputSchema } from '../inputTypeSchemas/CompanionCreateInputSchema'
import { CompanionUncheckedCreateInputSchema } from '../inputTypeSchemas/CompanionUncheckedCreateInputSchema'
import { CompanionUpdateInputSchema } from '../inputTypeSchemas/CompanionUpdateInputSchema'
import { CompanionUncheckedUpdateInputSchema } from '../inputTypeSchemas/CompanionUncheckedUpdateInputSchema'
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

export const CompanionUpsertArgsSchema: z.ZodType<Prisma.CompanionUpsertArgs> = z.object({
  select: CompanionSelectSchema.optional(),
  include: z.lazy(() => CompanionIncludeSchema).optional(),
  where: CompanionWhereUniqueInputSchema,
  create: z.union([ CompanionCreateInputSchema,CompanionUncheckedCreateInputSchema ]),
  update: z.union([ CompanionUpdateInputSchema,CompanionUncheckedUpdateInputSchema ]),
}).strict() as z.ZodType<Prisma.CompanionUpsertArgs>;

export default CompanionUpsertArgsSchema;
