import { CallControls, SpeakerLayout } from "@stream-io/video-react-sdk";
import Image from "next/image";
import Link from "next/link";
import { AITutorTile } from "./ai-tutor-tile";

interface Props {
  onLeave: () => void;
  meetingName: string;
  meetingId: string;
}

export const CallActive = ({ onLeave, meetingName, meetingId }: Props) => {
  return (
    <div className="flex flex-col justify-between p-4 h-full text-white gap-4">
      <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4 shrink-0">
        <Link
          href="/"
          className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit"
        >
          <Image src="/logo.svg" width={22} height={22} alt="logo" />
        </Link>
        <h4 className="text-base font-medium">
          {meetingName}
        </h4>
      </div>

      {/* Main Grid: User Camera Feed on Left/Center, AI Tutor Tile on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden">
        <div className="lg:col-span-2 flex items-center justify-center bg-[#101213] rounded-2xl overflow-hidden relative">
          <SpeakerLayout />
        </div>
        <div className="lg:col-span-1 h-full min-h-[360px]">
          <AITutorTile meetingId={meetingId} meetingName={meetingName} />
        </div>
      </div>

      <div className="bg-[#101213] rounded-full px-4 shrink-0">
        <CallControls onLeave={onLeave}/>
      </div>
    </div>
  );
};
