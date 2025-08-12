import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureUncheckedCreateNestedManyWithoutRoomInputSchema } from './FurnitureUncheckedCreateNestedManyWithoutRoomInputSchema';

export const RoomUncheckedCreateWithoutCompanionsInputSchema: z.ZodType<Prisma.RoomUncheckedCreateWithoutCompanionsInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  furniture: z.lazy(() => FurnitureUncheckedCreateNestedManyWithoutRoomInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomUncheckedCreateWithoutCompanionsInput>;

export default RoomUncheckedCreateWithoutCompanionsInputSchema;
