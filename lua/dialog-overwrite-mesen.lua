-- This script is for the Mesen emulator
-- It will overwrite the dialog in the game with the dialog from a local node server
-- It does nothing by itself!

-- We disable the global variable warning because Mesen's libraries WILL exist
---@diagnostic disable: undefined-global

-- IMPORTANT
-- we need to install the socket and json libraries!!
local http = require("socket.http")
local json = require("json")

-- this this may need adjustment if your emulator has a different offset
local dialog_start_address = 0xDCF6

-- stores the current actor so we can see if a prompt for it exists
-- we can also use it for other things!
CurrentActorID = 0x00

-- Where the actual dialog writing happens
-- This function shouldn't be called if the actor ID doesn't exist in prompts.ts
local function writeDialog(actorid)
    -- get the dialog from the server
    b, c, h = http.request (
        "http://localhost:4000/dialog?actorid=" .. string.format("%X", actorid)
    )

    local data = json.decode(b);

    emu.log(type(#data.bytes))

    if (data.status == "error") then
        emu.displayMessage('error',data.message)
        return
    end

    -- here is where the magic happens
    for i=1, #data.bytes do 
      emu.write(dialog_start_address + i-1, data.bytes[i], emu.memType.nesPrgRom)
    end
end

-- Uncomment this to Speed up the text display
-- emu.write(0x1EE9E, 0x02, emu.memType.nesPrgRom)

-- memory callback for when the actor id is written
-- we store it in a global variable so we can use it later
emu.addMemoryCallback(function (address, value)
    -- emu.log("Memory Read: " .. value)
    CurrentActorID = value
end, emu.callbackType.write, 0x007F)

-- Memory callback for dialog open
-- We check for a write to 0x0027, which is the dialog open flag (I think?)
emu.addMemoryCallback(function (address, value)
    emu.log("Memory Write: " .. value)
    -- write chat routine hijack here
    if (value ~= 0xFF) then

        -- LSB
        emu.write(0x1EEA8, 0xBD, emu.memType.nesPrgRom)
        emu.write(0x1EEA9, 0x82, emu.memType.nesPrgRom)
        emu.write(0x1EEAA, 0x8B, emu.memType.nesPrgRom)
        -- HSB
        emu.write(0x1EEAD, 0xBD, emu.memType.nesPrgRom)
        emu.write(0x1EEAE, 0x83, emu.memType.nesPrgRom)
        emu.write(0x1EEAF, 0x8B, emu.memType.nesPrgRom)
        return
    else
        b, c = http.request (
            "http://localhost:4000/actors?actorid=" .. string.format("%X", CurrentActorID)
        )

        if (c ~= 200) then
            emu.log('Warning: Actor not found')
            return
        end

        -- LSB
        emu.write(0x1EEA8, 0xA9, emu.memType.nesPrgRom)
        emu.write(0x1EEA9, 0xF6, emu.memType.nesPrgRom)
        emu.write(0x1EEAA, 0xEA, emu.memType.nesPrgRom)
        -- HSB
        emu.write(0x1EEAD, 0xA9, emu.memType.nesPrgRom)
        emu.write(0x1EEAE, 0x9C, emu.memType.nesPrgRom)
        emu.write(0x1EEAF, 0xEA, emu.memType.nesPrgRom)

        emu.log("CurrentActorID: " .. string.format("%X", CurrentActorID))
        writeDialog(CurrentActorID)
    end

end, emu.callbackType.write, 0x0027)
    
--end
