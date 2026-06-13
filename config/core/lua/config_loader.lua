local json = utilities.json

local ConfigLoader = {}
ConfigLoader.__index = ConfigLoader

function ConfigLoader.new(configPath)
    local self = setmetatable({}, ConfigLoader)
    configPath = configPath or os.getenv("GTG_CONFIG_FILE") or ".gtgrc"
    
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

function ConfigLoader:getExercisesTexDir()
    local lang = self.config.language or "javascript"
    local texLang = self.config.texLanguage or "en"
    local langDir = lang
    if lang == "javascript" then langDir = "js" end
    return self.config.directories.exercises.tex .. "/" .. langDir .. "/" .. texLang
end

function ConfigLoader:getBuildDir()
    return self.config.directories.build
end

function ConfigLoader:getJsShuffledFilePath()
    return self:getBuildDir() .. "/" .. self.config.files.shuffledFiles.js
end

function ConfigLoader:getFunctionMappingPath(seed)
    local filename = self.config.files.functionMapping:gsub("{seed}", tostring(seed))
    return self:getBuildDir() .. "/" .. filename
end

return ConfigLoader
