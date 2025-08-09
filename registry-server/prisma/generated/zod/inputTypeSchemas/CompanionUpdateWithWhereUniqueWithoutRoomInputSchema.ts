import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionWhereUniqueInputSchema } from './CompanionWhereUniqueInputSchema';
import { CompanionUpdateWithoutRoomInputSchema } from './CompanionUpdateWithoutRoomInputSchema';
import { CompanionUncheckedUpdateWithoutRoomInputSchema } from './CompanionUncheckedUpdateWithoutRoomInputSchema';

export const CompanionUpdateWithWhereUniqueWithoutRoomInputSchema: z.ZodType<Prisma.CompanionUpdateWithWhereUniqueWithoutRoomInput> = z.object({
  where: z.lazy(() => CompanionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CompanionUpdateWithoutRoomInputSchema),z.lazy(() => CompanionUncheckedUpdateWithoutRoomInputSchema) ]),
}).strict() as z.ZodType<Prisma.CompanionUpdateWithWhereUniqueWithoutRoomInput>;

export default CompanionUpdateWithWhereUniqueWithoutRoomInputSchema;
