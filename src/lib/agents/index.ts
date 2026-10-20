import type { AgentKey } from "@/generated/prisma/enums";
import { chiefOfStaff } from "./chief-of-staff";
import { cto } from "./cto";
import { customerDiscovery } from "./customer-discovery";
import { marketResearcher } from "./market-researcher";
import type { AgentDef } from "./types";

export const AGENTS: Record<AgentKey, AgentDef> = {
  CHIEF_OF_STAFF: chiefOfStaff,
  MARKET_RESEARCHER: marketResearcher,
  CUSTOMER_DISCOVERY: customerDiscovery,
  CTO: cto,
};

export const AGENT_LIST = Object.values(AGENTS);
