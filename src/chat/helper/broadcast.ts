interface BroadcastPayload {
  event: string;
  message: string;
}

export function broadcast(event: string, message: string): BroadcastPayload {
  return { event, message };
}
