import * as z from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  ism: z.string(),
  agentlik: z.string(),
  suratUrl: z.string(),
  tel: z.string(),
  tg: z.string(),
});

export const RasmSchema = z.object({
  /** Variantsiz asos yo'l: "/images/bx-001/01" — imageSrcSet() bilan ishlatiladi. */
  base: z.string(),
  /** 1200×630 crop; faqat birinchi rasmda to'ldiriladi. */
  ogUrl: z.string().nullable(),
  width: z.number().int(),
  height: z.number().int(),
  tartib: z.number().int(),
});

export const ObjectTuriSchema = z.enum(['NOVOSTROYKA', 'IKKILAMCHI', 'HOVLI']);

export const ObjectListItemSchema = z.object({
  id: z.string(),
  sarlavha: z.string(),
  /** BigInt number'ga sig'masligi mumkin — har doim string. */
  narxSom: z.string(),
  narxUsd: z.number().int(),
  xona: z.number().int(),
  maydonM2: z.number(),
  tuman: z.string(),
  rasm: RasmSchema.nullable(),
});

export const ObjectDetailSchema = ObjectListItemSchema.omit({ rasm: true }).extend({
  /** Hovlida qavat bo'lmaydi. */
  qavat: z.string().nullable(),
  manzil: z.string(),
  moljal: z.string(),
  tavsif: z.string(),
  turi: ObjectTuriSchema,
  views: z.number().int(),
  sana: z.string(),
  rasmlar: z.array(RasmSchema),
  agent: AgentSchema,
});

export const ViewsSchema = z.object({ views: z.number().int() });

export type Agent = z.infer<typeof AgentSchema>;
export type Rasm = z.infer<typeof RasmSchema>;
export type ObjectTuri = z.infer<typeof ObjectTuriSchema>;
export type ObjectListItem = z.infer<typeof ObjectListItemSchema>;
export type ObjectDetail = z.infer<typeof ObjectDetailSchema>;
export type Views = z.infer<typeof ViewsSchema>;
