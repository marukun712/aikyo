import { z } from 'zod';

export const CompanionScalarFieldEnumSchema = z.enum(['id','name','personality','story','sample','icon','roomId','createdAt','updatedAt']);

export default CompanionScalarFieldEnumSchema;
