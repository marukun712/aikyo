import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomWhereInputSchema } from './RoomWhereInputSchema';
import { RoomUpdateWithoutCompanionsInputSchema } from './RoomUpdateWithoutCompanionsInputSchema';
import { RoomUncheckedUpdateWithoutCompanionsInputSchema } from './RoomUncheckedUpdateWithoutCompanionsInputSchema';

export const RoomUpdateToOneWithWhereWithoutCompanionsInputSchema: z.ZodType<Prisma.RoomUpdateToOneWithWhereWithoutCompanionsInput> = z.object({
  where: z.lazy(() => RoomWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => RoomUpdateWithoutCompanionsInputSchema),z.lazy(() => RoomUncheckedUpdateWithoutCompanionsInputSchema) ]),
}).strict() as z.ZodType<Prisma.RoomUpdateToOneWithWhereWithoutCompanionsInput>;

export default RoomUpdateToOneWithWhereWithoutCompanionsInputSchema;
