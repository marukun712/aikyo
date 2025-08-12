import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureCreateNestedManyWithoutRoomInputSchema } from './FurnitureCreateNestedManyWithoutRoomInputSchema';

export const RoomCreateWithoutCompanionsInputSchema: z.ZodType<Prisma.RoomCreateWithoutCompanionsInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  furniture: z.lazy(() => FurnitureCreateNestedManyWithoutRoomInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomCreateWithoutCompanionsInput>;

export default RoomCreateWithoutCompanionsInputSchema;
