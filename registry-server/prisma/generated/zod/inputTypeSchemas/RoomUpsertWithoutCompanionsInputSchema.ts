import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomUpdateWithoutCompanionsInputSchema } from './RoomUpdateWithoutCompanionsInputSchema';
import { RoomUncheckedUpdateWithoutCompanionsInputSchema } from './RoomUncheckedUpdateWithoutCompanionsInputSchema';
import { RoomCreateWithoutCompanionsInputSchema } from './RoomCreateWithoutCompanionsInputSchema';
import { RoomUncheckedCreateWithoutCompanionsInputSchema } from './RoomUncheckedCreateWithoutCompanionsInputSchema';
import { RoomWhereInputSchema } from './RoomWhereInputSchema';

export const RoomUpsertWithoutCompanionsInputSchema: z.ZodType<Prisma.RoomUpsertWithoutCompanionsInput> = z.object({
  update: z.union([ z.lazy(() => RoomUpdateWithoutCompanionsInputSchema),z.lazy(() => RoomUncheckedUpdateWithoutCompanionsInputSchema) ]),
  create: z.union([ z.lazy(() => RoomCreateWithoutCompanionsInputSchema),z.lazy(() => RoomUncheckedCreateWithoutCompanionsInputSchema) ]),
  where: z.lazy(() => RoomWhereInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomUpsertWithoutCompanionsInput>;

export default RoomUpsertWithoutCompanionsInputSchema;
