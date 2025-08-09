import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { FurnitureUpdateManyWithoutRoomNestedInputSchema } from './FurnitureUpdateManyWithoutRoomNestedInputSchema';

export const RoomUpdateWithoutCompanionsInputSchema: z.ZodType<Prisma.RoomUpdateWithoutCompanionsInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  furniture: z.lazy(() => FurnitureUpdateManyWithoutRoomNestedInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomUpdateWithoutCompanionsInput>;

export default RoomUpdateWithoutCompanionsInputSchema;
