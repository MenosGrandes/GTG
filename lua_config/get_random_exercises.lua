-- ─────────────────────────────────────────────────────────────────────────────
-- SEEDED RANDOM NUMBER GENERATOR
-- LuaTeX's math.random is not seedable per-call in a reproducible way,
-- so we implement a simple Linear Congruential Generator (LCG).
-- The constants (a, c, m) match the ones used in the JavaScript implementation
-- in main.js, ensuring both pipelines (PDF and JS) produce the same shuffle
-- for the same seed value.
-- ─────────────────────────────────────────────────────────────────────────────
local function seeded_random(seed)
    local a = 1103515245
    local c = 12345
    local m = 2147483648 -- 2^31
    local state = seed

    -- Returns a closure: each call advances the LCG state and returns [0, 1)
    return function()
        state = (a * state + c) % m
        return state / m
    end
end

-- ─────────────────────────────────────────────────────────────────────────────
-- STRING → SEED CONVERSION
-- When the seed is passed as a string (e.g. "12"), we convert it to a number
-- by summing byte values weighted by position. The weighting ensures that
-- "ab" and "ba" produce different seeds.
-- ─────────────────────────────────────────────────────────────────────────────
local function string_to_seed(str)
    local clean_str = str:match("^(.*%.tex)$") and str:gsub("%.tex", "") or str
    local seed = 0
    for i = 1, #clean_str do
        seed = seed + clean_str:byte(i) * i
    end
    tex.print("\\PackageWarning{LuaInput}{'" .. seed .. "' seed.}")
    return seed
end

-- ─────────────────────────────────────────────────────────────────────────────
-- FISHER-YATES SHUFFLE
-- Shuffles an array in-place using the provided RNG function.
-- The algorithm iterates from the last element down to the second,
-- swapping each element with a randomly chosen earlier element.
-- This MUST match the JavaScript implementation in main.js so that
-- both the PDF and the JS test bundle select the same exercise files
-- for a given seed.
-- ─────────────────────────────────────────────────────────────────────────────
local function shuffle(array, rng)
    local n = #array
    for i = n, 2, -1 do
        local j = math.floor(rng() * i) + 1 -- j in [1, i]
        array[i], array[j] = array[j], array[i]
    end
    return array
end

-- ─────────────────────────────────────────────────────────────────────────────
-- MAIN ENTRY POINT: input_exercise_files(seed, count)
-- Called from main.tex via \inputexercises{\myseed}{\mycount}.
-- 1. Validates inputs
-- 2. Collects all .tex files from the exe/ directory
-- 3. Sorts them alphabetically (for determinism before shuffling)
-- 4. Shuffles using the seeded RNG
-- 5. Inputs the first `count` files via \input{}
-- Copy protection is applied separately by the pre_output_filter callback
-- registered in config/copy_protect.tex.
-- ─────────────────────────────────────────────────────────────────────────────
function input_exercise_files(seed, count)
    local dir_name = "tex_exercises"
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

    local files = {}
    for file in lfs.dir(dir_name) do
        if file ~= "." and file ~= ".." then
            if file:match("%.tex$") then
                table.insert(files, file)
            end
        end
    end

    if #files == 0 then
        tex.sprint("\\textbf{\\textcolor{red}{ERROR: No .tex files found in '" .. dir_name .. "'.}}")
        return
    end

    if count_num > #files then
        tex.sprint("\\textbf{\\textcolor{orange}{Warning: Requested " .. count_num .. " files, but only " .. #files ..
                       " available. Inputting all.}}\\par")
        count_num = #files
    end

    -- Sort first so the starting order is deterministic across runs
    table.sort(files, function(a, b)
        return a < b
    end)

    -- Validate that tex files match test files
    local test_dir = "tests"
    local test_attr = lfs.attributes(test_dir)
    if test_attr and test_attr.mode == "directory" then
        local test_files = {}
        for file in lfs.dir(test_dir) do
            if file ~= "." and file ~= ".." and file:match("%.js$") then
                local base_name = file:gsub("%.js$", "")
                test_files[base_name] = true
            end
        end

        -- Check for mismatches
        local missing_tex = {}
        local extra_tex = {}

        for _, file in ipairs(files) do
            local base_name = file:gsub("%.tex$", "")
            if not test_files[base_name] then
                table.insert(missing_tex, base_name)
            end
        end

        for base_name, _ in pairs(test_files) do
            local found = false
            for _, file in ipairs(files) do
                if file:gsub("%.tex$", "") == base_name then
                    found = true
                    break
                end
            end
            if not found then
                table.insert(extra_tex, base_name)
            end
        end

        if #missing_tex > 0 or #extra_tex > 0 then
            local error_msg = "\\textbf{\\textcolor{red}{FATAL ERROR: File mismatch between " .. dir_name ..
                                  "/ and tests/}}\\par"
            if #missing_tex > 0 then
                table.sort(missing_tex)
                error_msg = error_msg .. "\\textbf{\\textcolor{red}{Missing .js files for: " ..
                                table.concat(missing_tex, ", ", 1, math.min(5, #missing_tex))
                if #missing_tex > 5 then
                    error_msg = error_msg .. " and " .. (#missing_tex - 5) .. " more"
                end
                error_msg = error_msg .. "}}\\par"
            end
            if #extra_tex > 0 then
                table.sort(extra_tex)
                error_msg = error_msg .. "\\textbf{\\textcolor{red}{Extra .js files without .tex: " ..
                                table.concat(extra_tex, ", ", 1, math.min(5, #extra_tex))
                if #extra_tex > 5 then
                    error_msg = error_msg .. " and " .. (#extra_tex - 5) .. " more"
                end
                error_msg = error_msg .. "}}\\par"
            end
            tex.sprint(error_msg)
            tex.error("File mismatch detected between " .. dir_name .. "/ and tests/")
            return
        end
    end

    -- Convert seed to number if it's a string
    local seed_num = tonumber(seed) or seed
    local rng = seeded_random(seed_num)
    shuffle(files, rng)

    -- Write shuffled file list to output file for validation
    local output_file = io.open("build/tex_shuffled_files.txt", "w")
    if output_file then
        for i = 1, count_num do
            local base_name = files[i]:gsub("%.tex$", "")
            output_file:write(base_name .. "\n")
        end
        output_file:close()
    end

    -- Input each selected file
    for i = 1, count_num do
        local filepath = dir_name .. "/" .. files[i]
        tex.print("\\begin{samepage}")
        tex.sprint("\\input{" .. filepath .. "}")
        tex.print("\\end{samepage}")
    end
end
