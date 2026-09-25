import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// -----------------------------------------------------------------------
// Global settings for the marketing automation agent (single row, id = 1)
// -----------------------------------------------------------------------
export const integrationSettings = pgTable("integration_settings", {
  id: integer("id").primaryKey().default(1),

  // Business / content generation
  brandName: text("brand_name").notNull().default("Your Digital Agency"),
  niche: text("niche")
    .notNull()
    .default(
      "digital marketing services (SEO, social media management, paid ads, branding, web design)"
    ),
  websiteLink: text("website_link").notNull().default("https://example.com"),
  // Public base URL of this deployed app, used to build absolute image URLs
  // that Meta's servers can fetch when publishing photos.
  publicBaseUrl: text("public_base_url"),
  brandVoice: text("brand_voice")
    .notNull()
    .default("confident, friendly, and results-driven"),
  callToAction: text("call_to_action")
    .notNull()
    .default("DM us or click the link to get a free consultation!"),

  // Automation
  isAutomationEnabled: boolean("is_automation_enabled").notNull().default(true),
  postIntervalHours: integer("post_interval_hours").notNull().default(24),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),

  // OpenAI (content + image generation)
  openaiApiKey: text("openai_api_key"),

  // Email notifications (SMTP)
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").default(587),
  smtpUser: text("smtp_user"),
  smtpPass: text("smtp_pass"),
  smtpFrom: text("smtp_from"),
  notifyEmail: text("notify_email"),

  // Google Sheets logging
  googleClientEmail: text("google_client_email"),
  googlePrivateKey: text("google_private_key"),
  googleSheetId: text("google_sheet_id"),

  // Meta (Instagram + Facebook) webhook for auto DM replies
  metaVerifyToken: text("meta_verify_token").default("marketing-agent-verify"),
  metaAppSecret: text("meta_app_secret"),
  autoReplyMessage: text("auto_reply_message")
    .notNull()
    .default(
      "Hey! Thanks for reaching out 👋 One of our team members will get back to you shortly. In the meantime, feel free to check out our services on our website!"
    ),
  isAutoReplyEnabled: boolean("is_auto_reply_enabled").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------
// Connected Instagram / Facebook accounts (Meta Graph API credentials)
// -----------------------------------------------------------------------
export const socialAccounts = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // 'instagram' | 'facebook'
  accountName: text("account_name").notNull(),
  pageId: text("page_id").notNull(), // FB Page ID or IG Business Account ID
  accessToken: text("access_token").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------
// Generated / published posts
// -----------------------------------------------------------------------
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // 'instagram' | 'facebook'
  accountName: text("account_name").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  link: text("link"),
  status: text("status").notNull().default("draft"), // draft | published | failed
  externalPostId: text("external_post_id"),
  errorMessage: text("error_message"),
  sheetSynced: boolean("sheet_synced").notNull().default(false),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------
// Incoming DMs + auto-reply log
// -----------------------------------------------------------------------
export const dmMessages = pgTable("dm_messages", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // 'instagram' | 'facebook'
  pageId: text("page_id"),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name"),
  messageText: text("message_text").notNull(),
  repliedText: text("replied_text"),
  autoReplied: boolean("auto_replied").notNull().default(false),
  errorMessage: text("error_message"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------
// Activity log / audit trail shown on the dashboard
// -----------------------------------------------------------------------
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'automation' | 'email' | 'sheet' | 'dm' | 'error'
  level: text("level").notNull().default("info"), // info | success | error
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
