/* AUTO-GENERATED - do not edit */

import { z } from "zod";

export const APIKey = z.object({ id: z.string() });
export type APIKey = z.infer<typeof APIKey>;
export const SocketJoinPayload = z.object({ room: z.string() });
export type SocketJoinPayload = z.infer<typeof SocketJoinPayload>;
export const Status = z.object({ status: z.string() });
export type Status = z.infer<typeof Status>;
export const TickPayload = z.object({ timestamp: z.string() });
export type TickPayload = z.infer<typeof TickPayload>;
