"use client";

import { useEffect, useRef } from "react";

export default function VideoRoom({ roomId }: { roomId: string }) {
    const zpref = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const appID = Number(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET || "";

    useEffect(() => {
        if (!appID || Number.isNaN(appID) || !serverSecret || !roomId || !containerRef.current) {
            console.error("Missing ZegoCloud credentials or roomId:", { appID, hasSecret: !!serverSecret, roomId });
            return;
        }

        let isMounted = true;

        const start = async () => {
            const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

            if (!isMounted || !containerRef.current) return;

            const userId = crypto.randomUUID();
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                appID,
                serverSecret,
                roomId,
                userId,
                "stranger"
            );

            const zp = ZegoUIKitPrebuilt.create(kitToken);
            if (!zp) {
                console.error("Failed to create ZegoUIKitPrebuilt instance. Check your AppID and ServerSecret.");
                return;
            }

            zpref.current = zp;
            zp.joinRoom({
                container: containerRef.current,
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                showPreJoinView: false,
                showTextChat: true,
                showRoomTimer: true,
                showRoomDetailsButton: false,
                maxUsers: 2,
            });
        };

        start();

        return () => {
            isMounted = false;
            if (zpref.current) {
                try {
                    zpref.current.destroy();
                } catch (error) {
                    console.error("Error cleaning up Zego instance:", error);
                } finally {
                    zpref.current = null;
                }
            }
        };
    }, [roomId, appID, serverSecret]);

    return <div ref={containerRef} className="w-full h-[80vh]" />;
}