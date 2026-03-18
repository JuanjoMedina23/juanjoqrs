import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/core/auth/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";

export interface Transaction {
  id: string;
  amount: number;
  type: "payment" | "topup" | "received";
  date: string;
  payer_id: string;
  receiver_id: string;
}

const MAX_TOPUP = 1000;

type CheckoutContextType = {
  balance: number;
  history: Transaction[];
  loading: boolean;
  topUp: (amount: number) => Promise<{ success: boolean; error?: string }>;
  pay: (code: string) => Promise<{ success: boolean; error?: string }>;
  clearAll: () => void;
  MAX_TOPUP: number;
  refetch: () => Promise<void>;
};

const CheckoutContext = createContext<CheckoutContextType | null>(null);

async function sendTopUpNotification(amount: number, newBalance: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "💰 Recarga exitosa",
      body: `Se han agregado $${amount.toFixed(2)} a su cuenta. Saldo actual: $${newBalance.toFixed(2)}`,
      sound: true,
    },
    trigger: null,
  });
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      // Obtener saldo
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (walletError && walletError.code === "PGRST116") {
        // Wallet no existe, crear uno
        await supabase.from("wallets").insert({ user_id: user.id, balance: 0 });
        setBalance(0);
      } else if (walletData) {
        setBalance(parseFloat(walletData.balance));
      }

      // Obtener historial
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .or(`payer_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (txData) {
        const mapped: Transaction[] = txData.map((tx: any) => {
          let type: "payment" | "topup" | "received" = "payment";
          if (tx.status === "topup") type = "topup";
          else if (tx.receiver_id === user.id && tx.payer_id !== user.id) type = "received";
          else type = "payment";

          return {
            id: tx.id,
            amount: parseFloat(tx.amount),
            type,
            date: tx.created_at,
            payer_id: tx.payer_id,
            receiver_id: tx.receiver_id,
          };
        });
        setHistory(mapped);
      }
    } catch (e) {
      console.error("Error cargando wallet:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Suscripción en tiempo real al wallet
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("wallet-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "wallets",
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchData(); })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "transactions",
        filter: `receiver_id=eq.${user.id}`,
      }, () => { fetchData(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const topUp = useCallback(async (amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No hay sesión activa." };
    if (amount <= 0) return { success: false, error: "El monto debe ser mayor a 0." };
    if (amount > MAX_TOPUP) return { success: false, error: `El máximo de recarga es $${MAX_TOPUP}.` };

    const { error } = await supabase.rpc("top_up_wallet", {
      p_user_id: user.id,
      p_amount: amount,
    });

    if (error) return { success: false, error: error.message };

    await fetchData();
    await sendTopUpNotification(amount, balance + amount);
    return { success: true };
  }, [user, balance, fetchData]);

  const pay = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No hay sesión activa." };

    // El QR puede ser solo monto o JSON con monto + receiverId
    let amount: number;
    let receiverId: string | null = null;

    try {
      const parsed = JSON.parse(code);
      amount = parseFloat(parsed.amount);
      receiverId = parsed.userId ?? null;
    } catch {
      amount = parseFloat(code);
    }

    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "QR inválido: no contiene un monto válido." };
    }
    if (amount > balance) {
      return { success: false, error: "Saldo insuficiente." };
    }
    if (receiverId === user.id) {
      return { success: false, error: "No puedes pagarte a ti mismo." };
    }

    if (receiverId) {
      // Pago entre usuarios via función de Supabase
      const { error } = await supabase.rpc("transfer_balance", {
        p_payer_id: user.id,
        p_receiver_id: receiverId,
        p_amount: amount,
      });
      if (error) return { success: false, error: error.message };
    } else {
      // Pago sin destinatario específico (solo registro local)
      const { error } = await supabase.rpc("top_up_wallet", {
        p_user_id: user.id,
        p_amount: -amount,
      });
      if (error) {
        // Fallback: actualizar directamente
        const { error: updateError } = await supabase
          .from("wallets")
          .update({ balance: balance - amount, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (updateError) return { success: false, error: updateError.message };

        await supabase.from("transactions").insert({
          payer_id: user.id,
          receiver_id: user.id,
          amount,
          status: "completed",
        });
      }
    }

    await fetchData();
    return { success: true };
  }, [user, balance, fetchData]);

  const clearAll = useCallback(() => {
    setBalance(0);
    setHistory([]);
  }, []);

  return (
    <CheckoutContext.Provider value={{ balance, history, loading, topUp, pay, clearAll, MAX_TOPUP, refetch: fetchData }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error("useCheckout debe usarse dentro de CheckoutProvider");
  return context;
}