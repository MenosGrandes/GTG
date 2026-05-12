-- ─────────────────────────────────────────────────────────────────────────────
-- LOAD CONFIGURATION
-- ─────────────────────────────────────────────────────────────────────────────
local ConfigLoader = require("config.lua.config_loader")
local config = ConfigLoader.new()

function file_exists(file)
    local f = io.open(file, "rb")
    if f then
        f:close()
    end
    return f ~= nil
end

-- get all lines from a file, returns an empty 
-- list/table if the file does not exist
function lines_from(file)
    if not file_exists(file) then
        return {}
    end
    local lines = {}
    for line in io.lines(file) do
        lines[#lines + 1] = line
    end
    return lines
end
function escape_latex(text)
    -- Replace the most common control characters with escaped versions
    local result = text:gsub("&", "\\&")
    result = result:gsub("%", "\\%")
    result = result:gsub("$", "\\$")
    result = result:gsub("#", "\\#")
    result = result:gsub("=", "\\=")
    -- Add more characters if necessary (e.g., ~, {, }, <, >)
    return result
end
-- ─────────────────────────────────────────────────────────────────────────────
-- strona JS zapisuje sobie wynik do pliku .txt w build.
-- Przeczytaj z tego pliku poprostu i wybierz te same pliki z koncowka tex
-- ─────────────────────────────────────────────────────────────────────────────
function input_exercise_files(seed, count)
    local dir_name = config:getExercisesTexDir()
    local count_num = tonumber(count) or 0

    if count_num <= 0 then
        tex.sprint("\\textbf{\\textcolor{red}{ERROR: Count must be a positive number.}}")
        return
    end

    local attr = lfs.attributes(dir_name)
    if not attr or attr.mode ~= "directory" then
        tex.sprint("\\textbf{\\textcolor{red}{ERROR: Directory '" .. dir_name .. "' does not exist.}}")
        return
    end
    local build_js_files = lines_from(config:getJsShuffledFilePath())
    print("")

    local files = {}
    for i, js_file in ipairs(build_js_files) do
        for file in lfs.dir(dir_name) do
            if file ~= "." and file ~= ".." then
                if file:match("%.tex$") then
                    local base_name = file:gsub("%.tex$", "", 1)
                    if js_file == base_name then
                        table.insert(files, file)
                    end
                end
            end
        end
    end

    print("")

    for i, file in ipairs(files) do
        local filepath = dir_name .. "/" .. files[i]
        tex.sprint("\\input{" .. filepath .. "}")
    end

end
