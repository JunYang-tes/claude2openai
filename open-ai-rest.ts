import { Claude } from "./claude.ts";

const client = new Claude({
  sessionKey: Deno.env.get("CLAUDE_KEY") ?? "",
});
await client.init();
const conversation = await client.startConversation(
  `I'll send you a JSON array of messages. Each message is a JSON object that looks like this: {"role":"system","content":"Hello"}. 
  The value of the role can be one of "assistant","system" or "user". The content represents what the system or user or assistant said. 
  The system instruction can give high level instructions for the conversation.
  The messages are processed in the order they appear in the list, and the assistant responds accordingly.
  In this conversation history, I will play the role of the user and you will be the assistant. 
  You should reply to my last question in this array without any explanation.`,
);

const handlers: Record<string, Deno.ServeHandler> = {};

handlers["/v1/chat/completions"] = async (req) => {
  const json = await req.json();
  console.log("req:", JSON.stringify(json));
  const stream = json.stream;
  const message = json.messages;
  if (!stream) {
    const data = {
      id: "id",
      object: "text_completion",
      mode: json.mode,
      choices: [{
        message: {
          content: JSON.stringify(
            await conversation.sendMessage(JSON.stringify(
              message,
            )),
          ),
        },
      }],
    };
    return new Response(JSON.stringify(data));
  } else {
    const encode = new TextEncoder();
    let cancelled = false;
    const body = new ReadableStream({
      start(controller) {
        conversation.sendMessage(JSON.stringify(message), {
          progress(e) {
            if (!cancelled) {
              try {
                controller.enqueue(
                  encode.encode(`data: ${
                    JSON.stringify({
                      id: "id",
                      object: "text_completion",
                      mode: json.mode,
                      "finish_reason": "stop",
                      choices: [{
                        message: {
                          isFullText: false,
                          content: JSON.stringify(e.completion),
                        },
                        delta: {
                          content: e.completion,
                        },
                      }],
                    })
                  }\n\n`),
                );
              } catch (e) {
                console.error(e);
              }
            }
          },
          done() {
            if (!cancelled) {
              controller.enqueue(encode.encode(`data: [DONE]\n\n`));
              controller.close();
            }
          },
        });
      },
      cancel() {
        cancelled = true;
      },
    });
    const resp = new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });
    return resp;
  }
};

Deno.serve({
  port: +(Deno.env.get("CLAUDE_PORT") ?? "") || 9528,
}, (req, info) => {
  const url = new URL(req.url);
  const path = url.pathname;
  if (handlers[path]) {
    const handler = handlers[path];
    return handler(req, info);
  } else {
    return new Response("Not found", { status: 404 });
  }
});
