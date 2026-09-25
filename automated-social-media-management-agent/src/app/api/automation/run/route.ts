import { runAutomationCycle } from "@/lib/automation";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runAutomationCycle({ force: true });
  return Response.json(result);
}
