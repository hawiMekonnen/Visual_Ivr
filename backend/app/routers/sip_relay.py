"""
SIP WebSocket Relay — bridges the browser''s WSS connection to FreeSWITCH''s plain WS.

The browser connects to  wss://192.168.1.5:5173/api/sip-relay  (Vite -> FastAPI)
FastAPI relays every frame to       ws://192.168.1.9:5066
and every frame back to the browser, fully bidirectional.
"""
import asyncio
import os
import structlog
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

log = structlog.get_logger(__name__)

router = APIRouter()

FREESWITCH_WS = os.getenv("FREESWITCH_WS_URL", "ws://192.168.1.9:5066")


@router.websocket("/api/sip-relay")
async def sip_relay(client_ws: WebSocket):
    """
    Relay SIP WebSocket frames bidirectionally between the browser and FreeSWITCH.
    """
    subprotocols = client_ws.headers.get("sec-websocket-protocol", "")
    offered = [s.strip() for s in subprotocols.split(",") if s.strip()]
    chosen = "sip" if "sip" in offered else None

    await client_ws.accept(subprotocol=chosen)
    log.info("sip_relay_client_connected", subprotocol=chosen)

    try:
        async with websockets.connect(
            FREESWITCH_WS,
            subprotocols=([chosen] if chosen else None),
            open_timeout=5.0,
            ping_interval=20,
            ping_timeout=10,
        ) as fs_ws:
            log.info("sip_relay_freeswitch_connected", target=FREESWITCH_WS)

            async def browser_to_fs():
                try:
                    while True:
                        data = await client_ws.receive_text()
                        await fs_ws.send(data)
                except (WebSocketDisconnect, Exception) as e:
                    log.info("sip_relay_browser_disconnected", reason=str(e))
                finally:
                    await fs_ws.close()

            async def fs_to_browser():
                try:
                    async for message in fs_ws:
                        await client_ws.send_text(message)
                except Exception as e:
                    log.info("sip_relay_freeswitch_disconnected", reason=str(e))
                finally:
                    try:
                        await client_ws.close()
                    except Exception:
                        pass

            await asyncio.gather(browser_to_fs(), fs_to_browser())

    except WebSocketDisconnect:
        log.info("sip_relay_client_closed_before_fs_connect")
    except Exception as e:
        log.error("sip_relay_error", error=str(e))
        try:
            await client_ws.close()
        except Exception:
            pass
