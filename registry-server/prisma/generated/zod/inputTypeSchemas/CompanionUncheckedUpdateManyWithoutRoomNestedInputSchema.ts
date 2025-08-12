import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionCreateWithoutRoomInputSchema } from './CompanionCreateWithoutRoomInputSchema';
import { CompanionUncheckedCreateWithoutRoomInputSchema } from './CompanionUncheckedCreateWithoutRoomInputSchema';
import { CompanionCreateOrConnectWithoutRoomInputSchema } from './CompanionCreateOrConnectWithoutRoomInputSchema';
import { CompanionUpsertWithWhereUniqueWithoutRoomInputSchema } from './CompanionUpsertWithWhereUniqueWithoutRoomInputSchema';
import { CompanionCreateManyRoomInputEnvelopeSchema } from './CompanionCreateManyRoomInputEnvelopeSchema';
import { CompanionWhereUniqueInputSchema } from './CompanionWhereUniqueInputSchema';
import { CompanionUpdateWithWhereUniqueWithoutRoomInputSchema } from './CompanionUpdateWithWhereUniqueWithoutRoomInputSchema';
import { CompanionUpdateManyWithWhereWithoutRoomInputSchema } from './CompanionUpdateManyWithWhereWithoutRoomInputSchema';
import { CompanionScalarWhereInputSchema } from './CompanionScalarWhereInputSchema';

export const CompanionUncheckedUpdateManyWithoutRoomNestedInputSchema: z.ZodType<Prisma.CompanionUncheckedUpdateManyWithoutRoomNestedInput> = z.object({
  create: z.union([ z.lazy(() => CompanionCreateWithoutRoomInputSchema),z.lazy(() => CompanionCreateWithoutRoomInputSchema).array(),z.lazy(() => CompanionUncheckedCreateWithoutRoomInputSchema),z.lazy(() => CompanionUncheckedCreateWithoutRoomInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CompanionCreateOrConnectWithoutRoomInputSchema),z.lazy(() => CompanionCreateOrConnectWithoutRoomInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CompanionUpsertWithWhereUniqueWithoutRoomInputSchema),z.lazy(() => CompanionUpsertWithWhereUniqueWithoutRoomInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CompanionCreateManyRoomInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CompanionUpdateWithWhereUniqueWithoutRoomInputSchema),z.lazy(() => CompanionUpdateWithWhereUniqueWithoutRoomInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CompanionUpdateManyWithWhereWithoutRoomInputSchema),z.lazy(() => CompanionUpdateManyWithWhereWithoutRoomInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CompanionScalarWhereInputSchema),z.lazy(() => CompanionScalarWhereInputSchema).array() ]).optional(),
}).strict() as z.ZodType<Prisma.CompanionUncheckedUpdateManyWithoutRoomNestedInput>;

export default CompanionUncheckedUpdateManyWithoutRoomNestedInputSchema;
