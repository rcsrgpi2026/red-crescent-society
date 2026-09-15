export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { EventEmitter } = await import("events");
    EventEmitter.defaultMaxListeners = 50;
  }
}
