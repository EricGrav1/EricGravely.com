import crypto from "crypto";
import Stripe from "stripe";
import type { LeadMagnet, Order } from "@shared/schema";
import { slugify } from "@shared/slug";
import { storage } from "./storage";
import { sendPurchaseDeliveryEmail } from "./email";

const API_VERSION: Stripe.LatestApiVersion = "2026-07-29.dahlia";
const DOWNLOAD_WINDOW_DAYS = 30;

let stripeClient: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function checkoutConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!stripeClient) stripeClient = new Stripe(secret, { apiVersion: API_VERSION });
  return stripeClient;
}

export async function createCheckoutSession(product: LeadMagnet, order: Order, siteBaseUrl: string): Promise<Stripe.Checkout.Session> {
  if (product.productType !== "paid_download") throw new Error("Product is not available for checkout");
  if (!product.priceCents || product.priceCents < 1) throw new Error("Product price is not configured");

  const priceId = product.stripePriceId || process.env.STRIPE_SALES_MANAGER_TOOL_PRICE_ID;
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency: (product.currency || "usd").toLowerCase(),
          unit_amount: product.priceCents,
          product_data: { name: product.title, description: product.description.slice(0, 500) },
        },
        quantity: 1,
      };

  return getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [lineItem],
    customer_creation: "always",
    billing_address_collection: "auto",
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
    client_reference_id: String(order.id),
    metadata: { orderId: String(order.id), productId: String(product.id) },
    payment_intent_data: { metadata: { orderId: String(order.id), productId: String(product.id) } },
    success_url: `${siteBaseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteBaseUrl}/products/${slugify(product.title)}?checkout=cancelled`,
  });
}

function purchaseDownloadUrl(siteBaseUrl: string, token: string): string {
  return `${siteBaseUrl}/api/purchases/download?token=${encodeURIComponent(token)}`;
}

export async function fulfillCheckoutSession(sessionId: string, siteBaseUrl: string): Promise<Order> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    throw new Error(`Checkout session ${sessionId} is not paid`);
  }

  const orderId = Number(session.metadata?.orderId || session.client_reference_id);
  if (!orderId || Number.isNaN(orderId)) throw new Error("Checkout session is missing its order reference");

  const existingOrder = await storage.getOrderById(orderId);
  if (!existingOrder || existingOrder.stripeCheckoutSessionId !== session.id) {
    throw new Error("Checkout order could not be verified");
  }
  if (session.amount_total !== existingOrder.amountTotal || (session.currency || "").toLowerCase() !== existingOrder.currency.toLowerCase()) {
    throw new Error("Checkout amount does not match the order");
  }

  if (existingOrder.paymentStatus === "paid" && existingOrder.fulfillmentStatus === "delivered") {
    return existingOrder;
  }

  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error("Stripe checkout did not return a customer email");
  const token = existingOrder.downloadToken || crypto.randomBytes(32).toString("hex");
  const expiresAt = existingOrder.downloadExpiresAt || new Date(Date.now() + DOWNLOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const paidOrder = await storage.markOrderPaid(orderId, {
    customerEmail: email,
    customerName: session.customer_details?.name,
    paymentIntentId,
    downloadToken: token,
    downloadExpiresAt: expiresAt,
  });
  if (!paidOrder) throw new Error("Order could not be updated after payment");

  const product = await storage.getLeadMagnet(paidOrder.productId);
  if (!product) throw new Error("Purchased product no longer exists");

  const delivery = await sendPurchaseDeliveryEmail({
    email: paidOrder.customerEmail,
    customerName: paidOrder.customerName || "",
    productName: product.title,
    downloadUrl: purchaseDownloadUrl(siteBaseUrl, paidOrder.downloadToken || token),
    siteBaseUrl,
  });
  await storage.markOrderFulfillment(paidOrder.id, delivery.success ? "delivered" : "failed");
  if (!delivery.success) throw new Error(delivery.error || "Purchase email could not be sent");

  return (await storage.getOrderById(paidOrder.id)) || paidOrder;
}

export async function resetOrderDelivery(orderId: number, siteBaseUrl: string): Promise<Order> {
  const order = await storage.getOrderById(orderId);
  if (!order || order.paymentStatus !== "paid") throw new Error("Paid order not found");
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DOWNLOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const reset = await storage.resetOrderDownload(order.id, token, expiresAt);
  if (!reset) throw new Error("Order delivery could not be reset");
  const product = await storage.getLeadMagnet(reset.productId);
  if (!product) throw new Error("Purchased product no longer exists");
  const delivery = await sendPurchaseDeliveryEmail({
    email: reset.customerEmail,
    customerName: reset.customerName || "",
    productName: product.title,
    downloadUrl: purchaseDownloadUrl(siteBaseUrl, token),
    siteBaseUrl,
  });
  await storage.markOrderFulfillment(reset.id, delivery.success ? "delivered" : "failed");
  if (!delivery.success) throw new Error(delivery.error || "Purchase email could not be sent");
  return (await storage.getOrderById(reset.id)) || reset;
}
