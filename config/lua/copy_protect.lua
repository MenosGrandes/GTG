-- copy_protect.lua
-- Automatic copy protection via node processing.
-- Randomly wraps text nodes with garbled ActualText for copy/paste protection.

-- Garble function: shuffles characters and adds random noise
function make_garbled(input)
    local chars = {}
    for i = 1, #input do chars[i] = input:sub(i, i) end
    for i = #chars, 2, -1 do
        local j = math.random(i)
        chars[i], chars[j] = chars[j], chars[i]
    end
    for i = 1, math.random(1, 10) do
        chars[#chars + 1] = string.char(math.random(97, 122))
    end
    return table.concat(chars)
end

-- Generate random words to insert
local random_words = {
    "lorem", "ipsum", "dolor", "amet", "consectetur", "adipiscing", "elit",
    "sed", "eiusmod", "tempor", "incididunt", "labore", "magna", "aliqua",
    "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi",
    "aliquip", "commodo", "consequat", "duis", "aute", "irure", "reprehenderit",
    "voluptate", "velit", "esse", "cillum", "fugiat", "nulla", "pariatur"
}

local function get_random_word()
    return random_words[math.random(1, #random_words)]
end

local function make_garbled_with_words(input)
    local result = {}
    
    -- Add 1-3 random words before
    for i = 1, math.random(1, 3) do
        table.insert(result, get_random_word())
        table.insert(result, " ")
    end
    
    -- Add the garbled original
    table.insert(result, make_garbled(input))
    
    -- Add 1-3 random words after
    for i = 1, math.random(1, 3) do
        table.insert(result, " ")
        table.insert(result, get_random_word())
    end
    
    return table.concat(result)
end

-- Node-based copy protection
-- Processes glyph nodes and wraps them with PDF ActualText
local GLYPH = node.id("glyph")
local WHATSIT = node.id("whatsit")
local HLIST = node.id("hlist")
local VLIST = node.id("vlist")

-- Track if we're in a protected context (like math mode, headings, etc.)
local protection_enabled = true

-- Function to get protection probability from LaTeX
local function get_protection_probability()
    -- Try to read from LaTeX macro
    local status, prob_str = pcall(function() return token.get_macro("protectionProbability") end)
    if status and prob_str then
        local prob = tonumber(prob_str)
        if prob then
            return prob
        end
    end
    -- Fallback to default
    return 1.0  -- Changed default to 1.0 for maximum protection
end

local function protect_nodes(head)
    if not protection_enabled then
        return head
    end
    
    local protection_probability = get_protection_probability()
    
    local current = head
    local word_nodes = {}
    local word_text = {}
    
    while current do
        if current.id == GLYPH then
            -- Collect glyphs that form words (only letters)
            local char = current.char
            -- Include regular Latin (a-z, A-Z), extended Latin (À-ɏ), and Polish characters
            -- Polish: ą(261), ć(263), ę(281), ł(322), ń(324), ó(243), ś(347), ź(378), ż(380)
            --         Ą(260), Ć(262), Ę(280), Ł(321), Ń(323), Ó(211), Ś(346), Ź(377), Ż(379)
            local is_letter = (char >= 65 and char <= 90) or    -- A-Z
                             (char >= 97 and char <= 122) or    -- a-z
                             (char >= 192 and char <= 591) or   -- Extended Latin
                             (char >= 260 and char <= 380)      -- Polish range
            
            if is_letter then
                table.insert(word_nodes, current)
                table.insert(word_text, unicode.utf8.char(char))
                current = current.next
            else
                -- Non-letter character ends the word
                if #word_nodes > 0 then
                    local word = table.concat(word_text)
                    -- Protect based on probability; at 1.0 protect all words, otherwise require length > 3
                    local should_protect = false
                    if protection_probability >= 1.0 then
                        should_protect = (#word > 0)  -- Protect all words when probability is 1.0
                    else
                        should_protect = (math.random() < protection_probability and #word > 3)
                    end
                    
                    if should_protect then
                        local garbled = make_garbled_with_words(word)
                        
                        local start_literal = node.new("whatsit", "pdf_literal")
                        node.setfield(start_literal, "data", "/Span <</ActualText (" .. garbled .. ")>> BDC")
                        
                        local end_literal = node.new("whatsit", "pdf_literal")
                        node.setfield(end_literal, "data", "EMC")
                        
                        local first = word_nodes[1]
                        head = node.insert_before(head, first, start_literal)
                        
                        local last = word_nodes[#word_nodes]
                        head, _ = node.insert_after(head, last, end_literal)
                    end
                    
                    word_nodes = {}
                    word_text = {}
                end
                current = current.next
            end
        else
            -- End of word - process collected glyphs
            if #word_nodes > 0 then
                local word = table.concat(word_text)
                local should_protect = false
                if protection_probability >= 1.0 then
                    should_protect = (#word > 0)
                else
                    should_protect = (math.random() < protection_probability and #word > 3)
                end
                
                if should_protect then
                    local garbled = make_garbled_with_words(word)
                    
                    local start_literal = node.new("whatsit", "pdf_literal")
                    node.setfield(start_literal, "data", "/Span <</ActualText (" .. garbled .. ")>> BDC")
                    
                    local end_literal = node.new("whatsit", "pdf_literal")
                    node.setfield(end_literal, "data", "EMC")
                    
                    local first = word_nodes[1]
                    head = node.insert_before(head, first, start_literal)
                    
                    local last = word_nodes[#word_nodes]
                    head, _ = node.insert_after(head, last, end_literal)
                end
                
                word_nodes = {}
                word_text = {}
            end
            
            -- Recursively process nested lists
            if current and (current.id == HLIST or current.id == VLIST) then
                local list_head = node.getfield(current, "head")
                if list_head then
                    node.setfield(current, "head", protect_nodes(list_head))
                end
            end
            
            if current then
                current = current.next
            end
        end
    end
    
    -- Handle word at end of list
    if #word_nodes > 0 then
        local word = table.concat(word_text)
        local should_protect = false
        if protection_probability >= 1.0 then
            should_protect = (#word > 0)
        else
            should_protect = (math.random() < protection_probability and #word > 3)
        end
        
        if should_protect then
            local garbled = make_garbled_with_words(word)
            
            local start_literal = node.new("whatsit", "pdf_literal")
            node.setfield(start_literal, "data", "/Span <</ActualText (" .. garbled .. ")>> BDC")
            
            local end_literal = node.new("whatsit", "pdf_literal")
            node.setfield(end_literal, "data", "EMC")
            
            local first = word_nodes[1]
            head = node.insert_before(head, first, start_literal)
            
            local last = word_nodes[#word_nodes]
            head, _ = node.insert_after(head, last, end_literal)
        end
    end
    
    return head
end

-- Register callback for automatic protection
luatexbase.add_to_callback("pre_output_filter", protect_nodes, "copy_protection")

-- Log the protection probability at startup
texio.write_nl("Copy protection initialized with probability: " .. get_protection_probability())
