import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomCreateNestedOneWithoutFurnitureInputSchema } from './RoomCreateNestedOneWithoutFurnitureInputSchema';

export const FurnitureCreateInputSchema: z.ZodType<Prisma.FurnitureCreateInput> = z.object({
  id: z.string().uuid().optional(),
  label: z.string(),
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  room: z.lazy(() => RoomCreateNestedOneWithoutFurnitureInputSchema)
}).strict() as z.ZodType<Prisma.FurnitureCreateInput>;

export default FurnitureCreateInputSchema;
