import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Channel as StreamChannel } from "stream-chat";
import {
  useCreateChatClient,
  Chat,
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";

import "stream-chat-react/dist/css/v2/index.css";

interface CallUIProps {
  meetingId: string;
  meetingName: string;
  userId: string;
  username: string;
  userImage: string | undefined;
}

export const ChatUi = ({
  meetingId,
  meetingName,
  userId,
  username,
  userImage,
}: CallUIProps) => {
  const trpc = useTRPC();
  const { mutateAsync: generateChatToken } = useMutation(
    trpc.meetings.generateChatToken.mutationOptions(),
  );

  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    tokenOrProvider: generateChatToken,
    userData: {
      id: userId,
      name: username,
      image: userImage,
    },
  });
  useEffect(() => {
    if (!client) return;

    const channel = client.channel("messaging", meetingId, {
      //   name: meetingName,
      members: [userId],
    });
    setChannel(channel);
  }, [client, meetingId, meetingName, userId]);

  if (!client) {
    return (
      <LoadingState
        title="Loading Chat"
        description="This may take a few seconds"
      />
    );
  }
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <div className="flex-1 overflow-y-auto max-h-[cacl(100vh-23rem)] border-b">
              <MessageList />
            </div>
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
