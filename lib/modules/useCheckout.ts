import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/core/auth/supabaseClient";
import { registerTransaction, parseQRPayload } from "@/lib/payments/registerTransaction";

// ── Tipos públicos ──────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  amount: number;
  type: "payment" | "topup" | "charge"; // charge = cobro recibido
  date: string;       // ISO string (mapped desde created_at)
  code: string;       // QR raw value o "RECARGA"
  counterpartyEmail?: string;  // email o nombre del otro usuario
  counterpartyName?: string;
}

// ── Constantes ──────────────────────────────────────────────────────────────
const TOPUP_AMOUNT = 100;

// ── Hook ────────────────────────────────────────────────────────────────────
export function useCheckout() {
  const { user } = useAuthContext();

  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Cargar balance e historial desde Supabase ─────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        id,
        amount,
        payer_id,
        receiver_id,
        status,
        created_at,
        payer_profile:profiles!transactions_payer_id_fkey(email, full_name),
        receiver_profile:profiles!transactions_receiver_id_fkey(email, full_name)
      `)
      .or(`payer_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando transacciones:", error.message);
      return;
    }

    // Mapear filas de Supabase al tipo Transaction que ya usa la UI
    const mapped: Transaction[] = (data ?? []).map((tx: any) => {
      const isPayer = tx.payer_id === user.id;
      const profile = isPayer ? tx.receiver_profile : tx.payer_profile;
      const counterpartyName = profile?.full_name?.split(" ")[0] ?? undefined;
      const counterpartyEmail = profile?.email ?? undefined;

      return {
        id: tx.id,
        amount: tx.amount,
        type: isPayer ? "payment" : "charge",
        date: tx.created_at,
        code: isPayer ? "QR_PAGO" : "QR_COBRO",
        counterpartyEmail,
        counterpartyName,
      };
    });

    setHistory(mapped);

    // Balance = suma de cobros - suma de pagos
    const computed = (data ?? []).reduce((acc: number, tx: any) => {
      if (tx.receiver_id === user.id) return acc + tx.amount;
      if (tx.payer_id === user.id) return acc - tx.amount;
      return acc;
    }, 0);

    setBalance(parseFloat(computed.toFixed(2)));
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, [fetchData]);

  // ── Pagar con QR ──────────────────────────────────────────────────────────
  // Ahora el `code` es el JSON crudo del QR: { receiverId, amount }
  const pay = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: "No hay sesión activa." };

      // Validar el payload del QR antes de intentar el pago
      let payload;
      try {
        payload = parseQRPayload(code);
      } catch {
        return { success: false, error: "QR inválido o no es un código de pago." };
      }

      const amount = parseFloat(payload.amount);

      if (isNaN(amount) || amount <= 0) {
        return { success: false, error: "El monto del QR no es válido." };
      }

      if (amount > balance) {
        return { success: false, error: "Saldo insuficiente." };
      }

      try {
        await registerTransaction(code, user.id);
        // Refrescar datos desde Supabase para reflejar el nuevo estado real
        await fetchData();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message ?? "Error al procesar el pago." };
      }
    },
    [user, balance, fetchData]
  );

  // ── Recarga simulada ──────────────────────────────────────────────────────
  // Nota: Si en el futuro quieres guardar recargas en Supabase,
  // crea una tabla "topups" o agrega un tipo "topup" en transactions.
  // Por ahora actualiza solo el estado local para no romper la UI existente.
  const topUp = useCallback(async () => {
    const tx: Transaction = {
      id: Date.now().toString(),
      amount: TOPUP_AMOUNT,
      type: "topup",
      date: new Date().toISOString(),
      code: "RECARGA",
    };
    setBalance((prev) => parseFloat((prev + TOPUP_AMOUNT).toFixed(2)));
    setHistory((prev) => [tx, ...prev]);
  }, []);

  // ── Limpiar (debug) ───────────────────────────────────────────────────────
  const clearAll = useCallback(async () => {
    // Solo limpia el estado local; los registros en Supabase se mantienen.
    setBalance(0);
    setHistory([]);
  }, []);

  // ── Refresh manual ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    balance,
    history,
    loading,
    topUp,
    pay,
    clearAll,
    refresh,
    TOPUP_AMOUNT,
  };
}