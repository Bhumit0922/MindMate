import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";

interface Props {
  meetingName: string;
}

export const CallUI = ({ meetingName }: Props) => {
  const call = useCall();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

  const { mutate: startCallMutation } = useMutation(
    trpc.meetings.startCall.mutationOptions(),
  );

  const { mutate: endCallMutation } = useMutation(
    trpc.meetings.endCall.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
        queryClient.invalidateQueries(trpc.premium.getFreeUsage.queryOptions());
      },
    }),
  );

  const handleJoin = async () => {
    if (!call) return;

    // ✅ Guard: join only if idle
    if (call.state.callingState !== "idle") return;

    try {
      await call.join({ create: true });
      setShow("call");
      startCallMutation({ id: call.id });
    } catch (err) {
      console.error("Join failed", err);
    }
  };

  const handleLeave = async () => {
    if (!call) return;

    try {
      await call.camera.disable();
      await call.microphone.disable();
      await call.leave();
      await call.endCall();
    } catch (err) {
      console.error("End call failed", err);
    }
    endCallMutation({ id: call.id });
    setShow("ended");
  };

  return (
    <StreamTheme className="h-full ">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && (
        <CallActive
          onLeave={handleLeave}
          meetingName={meetingName}
          meetingId={call?.id || ""}
        />
      )}
      {show === "ended" && <CallEnded />}
    </StreamTheme>
  );
};
