export type SendMessageOptions = {
  model?: "claude-2" | "claude-1.3" | "claude-instant-100k";
  done?: (param: { completion: string }) => void;
  progress?: (param: { completion: string }) => void;
};
export declare interface Conversation {
  sendMessage(message: string, options?: SendMessageOptions): Promise<{
    completion: string;
  }>;
  getInfo(): Promise<{ name: string }>;
  delete(): Promise<void>;
}
export default class {
  constructor(opt: {
    sessionKey: string;
  });
  public init(): Promise<void>;
  public startConversation(id: string): Promise<Conversation>;
  public getConversations(): Promise<Conversation[]>;
}
