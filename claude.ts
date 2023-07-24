//@deno-types="./claude-ai.d.ts"
import claude from "npm:claude-ai@1.2.0";
import type { Conversation } from "npm:claude-ai@1.2.0";
export const Claude = claude;
export function sendMessage(conversation: Conversation, message: string) {
  return new Promise<string>((resolve, reject) => {
    console.log("SEND")
    conversation.sendMessage(message, {
      progress:(e)=>{
        console.log(e);
      },
      done: (e) => {
        resolve(e.completion);
      },
    });
  });
}
