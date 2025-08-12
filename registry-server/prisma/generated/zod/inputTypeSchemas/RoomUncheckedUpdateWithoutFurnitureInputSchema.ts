import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { CompanionUncheckedUpdateManyWithoutRoomNestedInputSchema } from './CompanionUncheckedUpdateManyWithoutRoomNestedInputSchema';

export const RoomUncheckedUpdateWithoutFurnitureInputSchema: z.ZodType<Prisma.RoomUncheckedUpdateWithoutFurnitureInput> = z.object({
  id: z.union([ z.string().uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  companions: z.lazy(() => CompanionUncheckedUpdateManyWithoutRoomNestedInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomUncheckedUpdateWithoutFurnitureInput>;

export default RoomUncheckedUpdateWithoutFurnitureInputSchema;
