import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionWhereUniqueInputSchema } from './CompanionWhereUniqueInputSchema';
import { CompanionUpdateWithoutRoomInputSchema } from './CompanionUpdateWithoutRoomInputSchema';
import { CompanionUncheckedUpdateWithoutRoomInputSchema } from './CompanionUncheckedUpdateWithoutRoomInputSchema';
import { CompanionCreateWithoutRoomInputSchema } from './CompanionCreateWithoutRoomInputSchema';
import { CompanionUncheckedCreateWithoutRoomInputSchema } from './CompanionUncheckedCreateWithoutRoomInputSchema';

export const CompanionUpsertWithWhereUniqueWithoutRoomInputSchema: z.ZodType<Prisma.CompanionUpsertWithWhereUniqueWithoutRoomInput> = z.object({
  where: z.lazy(() => CompanionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CompanionUpdateWithoutRoomInputSchema),z.lazy(() => CompanionUncheckedUpdateWithoutRoomInputSchema) ]),
  create: z.union([ z.lazy(() => CompanionCreateWithoutRoomInputSchema),z.lazy(() => CompanionUncheckedCreateWithoutRoomInputSchema) ]),
}).strict() as z.ZodType<Prisma.CompanionUpsertWithWhereUniqueWithoutRoomInput>;

export default CompanionUpsertWithWhereUniqueWithoutRoomInputSchema;
