import type { Agent, Object as ObjectRow, Rasm } from '@prisma/client';
import type { ObjectDetail, ObjectListItem, Rasm as RasmDto } from '@rieltor/shared';

export type ObjectQatori = ObjectRow & { agent: Agent; rasmlar: Pick<Rasm, keyof RasmDto>[] };

/** DB'da @db.Date, JS'da UTC yarim tuni — ISO ning birinchi 10 belgisi kifoya. */
function sanaMatni(sana: Date): string {
  return sana.toISOString().slice(0, 10);
}

function rasmDto(r: Pick<Rasm, keyof RasmDto>): RasmDto {
  return { base: r.base, ogUrl: r.ogUrl, width: r.width, height: r.height, tartib: r.tartib };
}

export function detailgaAylantir(qator: ObjectQatori): ObjectDetail {
  return {
    id: qator.id,
    sarlavha: qator.sarlavha,
    // BigInt JSON'ga serializatsiya qilinmaydi va number'ga sig'masligi mumkin.
    narxSom: qator.narxSom.toString(),
    narxUsd: qator.narxUsd,
    xona: qator.xona,
    maydonM2: qator.maydonM2,
    qavat: qator.qavat,
    tuman: qator.tuman,
    manzil: qator.manzil,
    moljal: qator.moljal,
    tavsif: qator.tavsif,
    turi: qator.turi,
    views: qator.views,
    sana: sanaMatni(qator.sana),
    rasmlar: [...qator.rasmlar].sort((a, b) => a.tartib - b.tartib).map(rasmDto),
    agent: {
      id: qator.agent.id,
      ism: qator.agent.ism,
      agentlik: qator.agent.agentlik,
      suratUrl: qator.agent.suratUrl,
      tel: qator.agent.tel,
      tg: qator.agent.tg,
    },
  };
}

export function royxatgaAylantir(qator: ObjectQatori): ObjectListItem {
  const birinchi = [...qator.rasmlar].sort((a, b) => a.tartib - b.tartib)[0];
  return {
    id: qator.id,
    sarlavha: qator.sarlavha,
    narxSom: qator.narxSom.toString(),
    narxUsd: qator.narxUsd,
    xona: qator.xona,
    maydonM2: qator.maydonM2,
    tuman: qator.tuman,
    rasm: birinchi ? rasmDto(birinchi) : null,
  };
}
