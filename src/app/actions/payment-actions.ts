
'use server';

/**
 * Server Action to create a Cashfree Order.
 * In production, ensure CASHFREE_APP_ID and CASHFREE_SECRET_KEY are in .env.local
 */
export async function createCashfreeOrder(userId: string, userEmail: string, userPhone: string) {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  // For simulation if keys are missing
  if (!appId || !secretKey) {
    console.warn("Cashfree keys missing. Returning simulated order for demo.");
    return {
      simulated: true,
      payment_session_id: "simulated_session_id_" + Date.now(),
      order_id: "order_" + Date.now(),
    };
  }

  try {
    const response = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify({
        order_amount: 99.00,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_email: userEmail,
          customer_phone: userPhone || "9999999999",
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?order_id={order_id}`,
        },
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating Cashfree order:", error);
    throw new Error("Failed to initialize payment.");
  }
}

/**
 * Server Action to verify Cashfree Order status.
 */
export async function verifyCashfreeOrder(orderId: string) {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    // If simulated, return success for demo
    if (orderId.startsWith("order_")) return { order_status: "PAID" };
    return { order_status: "FAILED" };
  }

  try {
    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      method: "GET",
      headers: {
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying Cashfree order:", error);
    throw new Error("Failed to verify payment.");
  }
}
