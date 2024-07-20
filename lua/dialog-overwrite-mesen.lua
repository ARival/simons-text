---@diagnostic disable: undefined-global
local http = require("socket.http")
local json = require("json")


-- local funkystring = "MAYBE I’LL BAKE*SOMETHING SWEET.*A TREAT FOR ME!*BUT IF I HEAR*A NOISE, I’LL HIDE!/"

function stringToBytes(input)
    local byteTable = {
        ["*"] = 0xFE, ["/"] = 0xFF, [" "] = 0x00, ["A"] = 0x01, ["B"] = 0x02, ["C"] = 0x03,
        ["D"] = 0x04, ["E"] = 0x05, ["F"] = 0x06, ["G"] = 0x07, ["H"] = 0x08, ["I"] = 0x09,
        ["J"] = 0x0A, ["K"] = 0x0B, ["L"] = 0x0C, ["M"] = 0x0D, ["N"] = 0x0E, ["O"] = 0x0F,
        ["P"] = 0x10, ["Q"] = 0x11, ["R"] = 0x12, ["S"] = 0x13, ["T"] = 0x14, ["U"] = 0x15,
        ["V"] = 0x16, ["W"] = 0x17, ["X"] = 0x18, ["Y"] = 0x19, ["Z"] = 0x1A, ["."] = 0x1B,
        ["'"] = 0x1C, [","] = 0x1E, ["0"] = 0x36, ["1"] = 0x37, ["2"] = 0x38, ["3"] = 0x39,
        ["4"] = 0x3A, ["5"] = 0x3B, ["6"] = 0x3C, ["7"] = 0x3D, ["8"] = 0x3E, ["9"] = 0x3F,
        ["!"] = 0x40
    }

    local result = {}
    for i = 1, #input do
        local char = input:sub(i, i)
        local byte = byteTable[char]
        if byte then
            table.insert(result, byte)
        end
    end
    return result
end


local dialog_start_address = 0xDCF6

CurrentActorID = 0x00


local function writeDialog(actorid)
    -- local bytes = stringToBytes(actorid)
    b, c, h = http.request (
        "http://localhost:4000/dialog?actorid=" .. string.format("%X", actorid)
    )

    local data = json.decode(b);

    emu.log(type(#data.bytes))

    if (data.status == "error") then
        emu.displayMessage('error',data.message)
        return
    end

    for i=1, #data.bytes do 
    --   emu.log("byte = " .. data.bytes[i])
      emu.write(dialog_start_address + i-1, data.bytes[i], emu.memType.nesPrgRom)
    end
end

local memoryCallbackId = nil
--function startup()
    -- Speed up the text display
    emu.write(0x1EE9E, 0x01, emu.memType.nesPrgRom)
	-- emu.displayMessage("inside", "hi there!")
    -- for i=1, #deeznuts_array do 
    --   emu.write(dialog_start_address + i-1, deeznuts_array[i], emu.memType.nesPrgRom)
    -- end

    -- memory callback for setting current actor id
    emu.addMemoryCallback(function (address, value)
        -- emu.log("Memory Read: " .. value)
        CurrentActorID = value
    end, emu.callbackType.write, 0x007F)

    -- memory callback for dialog open
    memoryCallbackId = emu.addMemoryCallback(function (address, value)
        emu.log("Memory Write: " .. value)
        if (value ~= 0xFF) then
            return
        end
        -- if (value == currentActorID) then
        --     return
        -- end
        -- emu.displayMessage("Memory Write", string.format("Address: %04X, Value: %02X", address, value))
        emu.log("CurrentActorID: " .. CurrentActorID)
        writeDialog(CurrentActorID)
    end, emu.callbackType.write, 0x0027)

    -- write chat routine hijack here
    -- LSB
    emu.write(0x1EEA8, 0xA9, emu.memType.nesPrgRom)
    emu.write(0x1EEA9, 0xF6, emu.memType.nesPrgRom)
    emu.write(0x1EEAA, 0xEA, emu.memType.nesPrgRom)
    -- HSB
    emu.write(0x1EEAD, 0xA9, emu.memType.nesPrgRom)
    emu.write(0x1EEAE, 0x9C, emu.memType.nesPrgRom)
    emu.write(0x1EEAF, 0xEA, emu.memType.nesPrgRom)
    
--end

-- Ensure startup is called when the script is loaded
--emu.addEventCallback(startup, emu.eventType.startFrame)

-- Add a Mesen removeMemoryCallback call to trigger when the script exits
emu.addEventCallback(function()
    if memoryCallbackId then
        emu.removeMemoryCallback(memoryCallbackId)
    end
end, emu.eventType.scriptEnded)