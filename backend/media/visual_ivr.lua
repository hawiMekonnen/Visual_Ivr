-- Bulletproof Visual IVR Trigger Script
session:answer()
session:sleep(500)

local caller = session:getVariable("caller_id_number") or "1001"
local domain = session:getVariable("domain_name") or "192.168.1.9"
local uuid = session:getVariable("uuid") or "manual_call"
local ivr_url = "https://192.168.1.6:5173/?session_id=" .. uuid

local api = freeswitch.API()
local chat_msg = "Click to open Visual IVR: " .. ivr_url

-- 1. Send SIP Instant Message to the caller's softphone via internal profile
pcall(function()
    api:executeString("chat sip|internal|" .. caller .. "@" .. domain .. "|2000@" .. domain .. "|" .. chat_msg)
end)

-- 2. Trigger webhook to Python backend (port 8000) using Linux shell curl + FreeSWITCH API
local json_body = '{"caller_phone":"' .. caller .. '","call_uuid":"' .. uuid .. '"}'

-- Method A: Direct Linux OS Curl (works on all Debian/Ubuntu systems without mod_curl)
local cmd = "curl -s -m 5 -X POST http://192.168.1.6:8000/api/sessions/trigger-call-ivr -H 'Content-Type: application/json' -d '" .. json_body .. "' >> /tmp/visual_ivr.log 2>&1 &"
os.execute(cmd)

-- Method B: FreeSWITCH internal curl API (if mod_curl is loaded)
pcall(function()
    api:executeString("curl http://192.168.1.6:8000/api/sessions/trigger-call-ivr content-type application/json post " .. json_body)
end)

-- 3. Sleep briefly then hang up
session:sleep(2000)
session:hangup()