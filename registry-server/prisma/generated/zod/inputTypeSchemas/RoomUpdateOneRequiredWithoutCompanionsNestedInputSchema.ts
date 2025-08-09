import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomWhereUniqueInputSchema } from './RoomWhereUniqueInputSchema';
import { RoomUpdateToOneWithWhereWithoutCompanionsInputSchema } from './RoomUpdateToOneWithWhereWithoutCompanionsInputSchema';
import { RoomUpdateWithoutCompanionsInputSchema } from './RoomUpdateWithoutCompanionsInputSchema';
import { RoomUncheckedUpdateWithoutCompanionsInputSchema } from './RoomUncheckedUpdateWithoutCompanionsInputSchema';

export const RoomUpdateOneRequiredWithoutCompanionsNestedInputSchema: z.ZodType<Prisma.RoomUpdateOneRequiredWithoutCompanionsNestedInput> = z.object({
  connect: z.lazy(() => RoomWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => RoomUpdateToOneWithWhereWithoutCompanionsInputSchema),z.lazy(() => RoomUpdateWithoutCompanionsInputSchema),z.lazy(() => RoomUncheckedUpdateWithoutCompanionsInputSchema) ]).optional(),
}).strict() as z.ZodType<Prisma.RoomUpdateOneRequiredWithoutCompanionsNestedInput>;

export default RoomUpdateOneRequiredWithoutCompanionsNestedInputSchema;
