import { google } from "googleapis";
import type { IntegrationSettings } from "@/lib/settings";
import { isSheetsConfigured } from "@/lib/settings";

const SHEET_TAB = "Posts";
const HEADER_ROW = ["Date", "Time", "Account Name", "Platform", "Post Content", "Link", "Status"];

export interface SheetLogResult {
  logged: boolean;
  simulated: boolean;
  errorMessage?: string;
}

function getAuth(settings: IntegrationSettings) {
  return new google.auth.JWT({
    email: settings.googleClientEmail!,
    key: settings.googlePrivateKey!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function ensureHeader(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TAB}!A1:G1`,
    });
    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_TAB}!A1:G1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADER_ROW] },
      });
    }
  } catch {
    // Tab might not exist yet; try creating it, then set header.
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_TAB } } }],
        },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_TAB}!A1:G1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADER_ROW] },
      });
    } catch (innerErr) {
      console.error("Failed to prepare Google Sheet tab:", innerErr);
    }
  }
}

export async function logPostToSheet(
  settings: IntegrationSettings,
  row: {
    date: string;
    time: string;
    accountName: string;
    platform: string;
    content: string;
    link: string;
    status: string;
  }
): Promise<SheetLogResult> {
  if (!isSheetsConfigured(settings)) {
    console.log("[sheets:simulated]", row);
    return { logged: false, simulated: true };
  }

  try {
    const auth = getAuth(settings);
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = settings.googleSheetId!;

    await ensureHeader(sheets, spreadsheetId);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_TAB}!A:G`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[row.date, row.time, row.accountName, row.platform, row.content, row.link, row.status]],
      },
    });

    return { logged: true, simulated: false };
  } catch (err) {
    console.error("Failed to log post to Google Sheets:", err);
    return {
      logged: false,
      simulated: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
