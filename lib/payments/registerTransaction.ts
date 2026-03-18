import { supabase } from "@/lib/core/auth/supabaseClient";

export type QRPayload = {
  receiverId: string;
  amount: string;
};

export type Transaction = {
  id: string;
  amount: number;
  payer_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
};

/**
 * Parsea el valor crudo del QR escaneado.
 * Lanza un error si el formato es inválido.
 */
export function parseQRPayload(raw: string): QRPayload {
  try {
    const payload = JSON.parse(raw) as QRPayload;
    if (!payload.receiverId || !payload.amount) throw new Error("Faltan campos");
    return payload;
  } catch {
    throw new Error("QR inválido o no es un código de pago");
  }
}

/**
 * Registra la transacción en Supabase.
 * Conecta al pagador (payerId) con el cobrador (receiverId).
 * 
 * @param qrRawValue - String crudo leído del QR
 * @param payerId    - ID del usuario que está pagando (autenticado)
 * @returns La transacción creada
 */
export async function registerTransaction(
  qrRawValue: string,
  payerId: string
): Promise<Transaction> {
  const { receiverId, amount } = parseQRPayload(qrRawValue);
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("El monto del QR no es válido");
  }

  if (receiverId === payerId) {
    throw new Error("No puedes pagarte a ti mismo");
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      amount: numericAmount,
      payer_id: payerId,
      receiver_id: receiverId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Transaction;
}