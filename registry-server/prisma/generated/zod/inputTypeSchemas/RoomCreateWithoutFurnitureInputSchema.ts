import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionCreateNestedManyWithoutRoomInputSchema } from './CompanionCreateNestedManyWithoutRoomInputSchema';

export const RoomCreateWithoutFurnitureInputSchema: z.ZodType<Prisma.RoomCreateWithoutFurnitureInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  companions: z.lazy(() => CompanionCreateNestedManyWithoutRoomInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomCreateWithoutFurnitureInput>;

export default RoomCreateWithoutFurnitureInputSchema;
