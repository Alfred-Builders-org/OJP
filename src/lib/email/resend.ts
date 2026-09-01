import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * La cle d'expedition, sous l'un ou l'autre de ses noms.
 *
 * `RESEND_API_KEY` est le nom historique, celui que documente le depot.
 * `RESEND_KEY` est celui pose sur l'environnement de production. Lire les deux
 * evite qu'un courriel reste bloque sur un ecart de nommage — le genre de panne
 * qui ne se voit qu'a l'absence de message.
 */
export function cleResend(): string | undefined {
  return process.env.RESEND_API_KEY || process.env.RESEND_KEY;
}

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(cleResend());
  }
  return _resend;
}
