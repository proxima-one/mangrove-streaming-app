import { Success } from "../../parseBlocks/parser";
import { LogParserContext } from "../../parseBlocks/mangroveLogsParser";
import { PartialKandelEvent } from "../kandelEvents";

export const events = (
  events: PartialKandelEvent[]
): Omit<Success<PartialKandelEvent[], LogParserContext>, "ctx"> => {
  return {
    success: true,
    value: events,
  };
};
