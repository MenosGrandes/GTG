-- Configuration loader for Lua
-- Reads from project.config.json and provides path resolution

-- Use LuaTeX's built-in JSON library
local json = utilities.json

local ConfigLoader = {}
ConfigLoader.__index = ConfigLoader

function ConfigLoader.new(configPath)
    local self = setmetatable({}, ConfigLoader)
    configPath = configPath or "project.config.json"
    
    local file = io.open(configPath, "r")
    if not file then
        error("Could not open config file: " .. configPath)
    end
    
    local content = file:read("*all")
    file:close()
    
    self.config = json.tolua(content)
    if not self.config then
        error("Could not parse config file: " .. configPath)
    end
    
    return self
end

-- Directory getters
function ConfigLoader:getExercisesTexDir()
    return self.config.directories.exercises.tex
end

function ConfigLoader:getExercisesTestsDir()
    return self.config.directories.exercises.tests
end

function ConfigLoader:getConfigTexDir()
    return self.config.directories.config.tex
end

function ConfigLoader:getConfigLuaDir()
    return self.config.directories.config.lua
end

function ConfigLoader:getBuildDir()
    return self.config.directories.build
end

-- File path getters
function ConfigLoader:getTexShuffledFilePath()
    return self:getBuildDir() .. "/" .. self.config.files.shuffledFiles.tex
end

function ConfigLoader:getJsShuffledFilePath()
    return self:getBuildDir() .. "/" .. self.config.files.shuffledFiles.js
end

function ConfigLoader:getFunctionMappingPath(seed)
    local filename = self.config.files.functionMapping:gsub("{seed}", tostring(seed))
    return self:getBuildDir() .. "/" .. filename
end

-- Get raw config
function ConfigLoader:getConfig()
    return self.config
end

return ConfigLoader
