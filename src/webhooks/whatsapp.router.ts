import { Router } from "express";
import express from "express";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { validateWhatsAppSignature } from "./whatsapp.validator.js";
import { incomingQueue } from "../queues/whatsapp-incoming.queue.js";

export const whatsappRouter = Router();

// ─── Meta Cloud API webhook ───

whatsappRouter.get("/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.WA_VERIFY_TOKEN) {
    logger.info("WhatsApp (Meta) webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

whatsappRouter.post("/meta", validateWhatsAppSignature, async (req, res) => {
  try {
    const entries = req.body?.entry;
    if (!entries || !Array.isArray(entries)) { res.sendStatus(200); return; }

    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        if (change?.field !== "messages") continue;
        const value = change.value;
        if (!value?.messages) continue;

        for (const message of value.messages) {
          await incomingQueue.add("incoming-meta", {
            provider: "meta",
            message,
            metadata: value.metadata,
            contacts: value.contacts,
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Error processing Meta webhook");
    res.sendStatus(200);
  }
});

// ─── Twilio webhook (form-encoded POST) ───

whatsappRouter.post(
  "/twilio",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    try {
      const body = req.body;

      // Twilio sends: From=whatsapp:+91..., Body=..., MessageSid=...
      const from: string = (body.From ?? "").replace("whatsapp:+", "").replace("whatsapp:", "");
      const text: string = body.Body ?? "";
      const messageId: string = body.MessageSid ?? `twilio_${Date.now()}`;
      const latitude: string | undefined = body.Latitude;
      const longitude: string | undefined = body.Longitude;

      if (!from) { res.sendStatus(200); return; }

      let rawMessage: any;

      if (latitude && longitude) {
        // Location message
        rawMessage = {
          from,
          id: messageId,
          timestamp: String(Math.floor(Date.now() / 1000)),
          type: "location",
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            name: body.Label ?? undefined,
            address: body.Address ?? undefined,
          },
        };
      } else {
        // Text message
        rawMessage = {
          from,
          id: messageId,
          timestamp: String(Math.floor(Date.now() / 1000)),
          type: "text",
          text: { body: text },
        };
      }

      await incomingQueue.add("incoming-twilio", {
        provider: "twilio",
        message: rawMessage,
        metadata: { phone_number_id: env.TWILIO_WHATSAPP_FROM ?? "" },
      });

      // Twilio expects empty 200 response (or TwiML)
      res.set("Content-Type", "text/xml");
      res.send("<Response></Response>");
    } catch (err) {
      logger.error({ err }, "Error processing Twilio webhook");
      res.set("Content-Type", "text/xml");
      res.send("<Response></Response>");
    }
  }
);

// ─── Root webhook — route to the active provider ───

whatsappRouter.get("/", (req, res) => {
  // Meta verification challenge on root path too
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.WA_VERIFY_TOKEN) {
    logger.info("WhatsApp webhook verified");
    res.status(200).send(challenge);
    return;
  }

  res.json({ provider: env.WA_PROVIDER, status: "ok" });
});

whatsappRouter.post("/", express.urlencoded({ extended: false }), async (req, res) => {
  if (env.WA_PROVIDER === "twilio") {
    // Forward to Twilio handler logic
    const body = req.body;
    const from: string = (body.From ?? "").replace("whatsapp:+", "").replace("whatsapp:", "");
    const text: string = body.Body ?? "";
    const messageId: string = body.MessageSid ?? `twilio_${Date.now()}`;
    const latitude: string | undefined = body.Latitude;
    const longitude: string | undefined = body.Longitude;

    if (!from) { res.set("Content-Type", "text/xml"); res.send("<Response></Response>"); return; }

    let rawMessage: any;
    if (latitude && longitude) {
      rawMessage = {
        from,
        id: messageId,
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: "location",
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          name: body.Label ?? undefined,
          address: body.Address ?? undefined,
        },
      };
    } else {
      rawMessage = {
        from,
        id: messageId,
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: "text",
        text: { body: text },
      };
    }

    await incomingQueue.add("incoming-twilio", {
      provider: "twilio",
      message: rawMessage,
      metadata: { phone_number_id: env.TWILIO_WHATSAPP_FROM ?? "" },
    });

    res.set("Content-Type", "text/xml");
    res.send("<Response></Response>");
  } else {
    // Meta JSON format
    try {
      const entries = req.body?.entry;
      if (!entries || !Array.isArray(entries)) { res.sendStatus(200); return; }

      for (const entry of entries) {
        for (const change of entry?.changes ?? []) {
          if (change?.field !== "messages") continue;
          const value = change.value;
          if (!value?.messages) continue;
          for (const message of value.messages) {
            await incomingQueue.add("incoming-meta", {
              provider: "meta",
              message,
              metadata: value.metadata,
            });
          }
        }
      }
      res.sendStatus(200);
    } catch (err) {
      logger.error({ err }, "Error processing webhook");
      res.sendStatus(200);
    }
  }
});
