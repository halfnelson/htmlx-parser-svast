import { createToken, CustomPatternMatcherFunc, CustomPatternMatcherReturn, Lexer } from 'chevrotain'

export const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });




// Tag Children
export const TextContent = createToken({ name: "TextContent", pattern: /[^<\{]+/ });
export const CommentTag = createToken({ name: "CommentTag", pattern: /<\!\-\-[\s\S]*?\-\->/ })

export const OpenScriptTag = createToken({ name: "OpenScriptTag", pattern: /<s[Cc][Rr][Ii][Pp][Tt]/, push_mode: "script_tag_mode"})
export const ScriptRAngle = createToken({ name: "ScriptRAngle", pattern: />/, pop_mode: true, push_mode: "script_content_mode" });
export const ScriptContentAndEndTag = createToken({ name: "ScriptContentAndEndTag", pattern: /[\s\S]*<\/script>/i, pop_mode: true })

export const OpenStyleTag = createToken({ name: "OpenStyleTag", pattern: /<s[Tt][Yy][Ll][Ee]/, push_mode: "style_tag_mode"})
export const StyleRAngle = createToken({ name: "StyleRAngle", pattern: />/, pop_mode: true, push_mode: "style_content_mode" });
export const StyleContentAndEndTag = createToken({ name: "StyleContentAndEndTag", pattern: /[\s\S]*<\/style>/i, pop_mode: true })

export const OpenTextAreaTag = createToken({ name: "OpenTextAreaTag", pattern: /<textarea/, push_mode: "textarea_tag_mode"})
export const TextAreaRAngle = createToken({ name: "TextAreaRAngle", pattern: />/, pop_mode: true, push_mode: "textarea_content_mode" });
export const TextAreaContentAndEndTag = createToken({ name: "TextAreaContentAndEndTag", pattern: /[\s\S]*<\/textarea>/, pop_mode: true })

export const TextModeTagSelfClose = createToken({ name: "TextModeTagSelfClose", pattern: /\/>/, pop_mode: true});

export const OpenTag = createToken({ name: "OpenTag", pattern: /<[a-zA-Z0-9:\-]+/, push_mode: "tag_mode" });
export const CloseTag = createToken({ name: "CloseTag", pattern: /<\/[a-zA-Z0-9:\-]+/, push_mode: "tag_mode" });

// Tag Definitions
export const Colon = createToken({ name: "Colon", pattern: /:/ });
export const Equal = createToken({ name: "Equal", pattern: /=/ });
export const Pipe = createToken({ name: "Pipe", pattern: /\|/ });
export const AttrText = createToken({ name: "AttrText", pattern: /[^\s"'=<>`{\|\/]+/ });

export const DQuote = createToken({ name: "DQuote", pattern: /"/, push_mode: "dquote_str_mode" });
export const DQuotedString = createToken({ name: "DQuoteString", pattern: /(?:\\"|[^"\{])+/ });
export const DQuoteEnd = createToken({ name: "DQuoteEnd", pattern: /"/, pop_mode: true });

export const SQuote = createToken({ name: "SQuote", pattern: /'/, push_mode: "squote_str_mode" });
export const SQuotedString = createToken({ name: "SQuoteString", pattern: /(?:\\'|[^'\{])+/ });
export const SQuoteEnd = createToken({ name: "SQuoteEnd", pattern: /'/, pop_mode: true });

export const Slash = createToken({ name: "Slash", pattern: /\// });
export const RAngle = createToken({ name: "RAngle", pattern: />/, pop_mode: true });

// Expression
export const LCurly = createToken({ name: "LCurly", pattern: /\{/, push_mode: "expr_mode" });

const expressionStartChars = []
for(let j=0; j < 128; j++) {
    const char = String.fromCharCode(j);
    switch (char) {
        //we don't start with these
        case '@':
        case ':':
        case '/':
        case '#':
        //we dont start with whitespace
        case "\r":
        case "\n":
        case "\t":
        case " ":
           continue;
    }
    expressionStartChars.push(char)
}

// we use a custom pattern due to nesting etc https://sap.github.io/chevrotain/docs/guide/custom_token_patterns.html#usage
export const ExprContent = createToken({ name: "ExprContent", pattern: {exec: matchExpression as any}, start_chars_hint:  expressionStartChars, line_breaks: true});

export const VoidBlock = createToken({ name: "VoidBlock", pattern: /\@[^\s\}]+/ });
export const BranchBlockOpen = createToken({ name: "BranchBlockOpen", pattern: /\x23[^\s\}]+/  });
export const BranchBlockContinue = createToken({ name: "BranchBlockContinue", pattern: /\:[^\s\}]+/ });
export const BranchBlockEnd = createToken({ name: "BranchBlockEnd", pattern: /\/[^\s\}]+/ });
export const RCurly = createToken({ name: "RCurly", pattern: /\}/, pop_mode: true });

// All Tokens (needed for parser)
export const svelteTokens = [RAngle, Colon, DQuote, DQuotedString, DQuoteEnd,
    SQuote, SQuotedString, SQuoteEnd,
    Slash, OpenTag, CloseTag, AttrText,
    LCurly, ExprContent, TextContent, RCurly, WhiteSpace,
    VoidBlock, BranchBlockOpen, BranchBlockContinue, BranchBlockEnd,
    OpenScriptTag, ScriptRAngle, ScriptContentAndEndTag,
    OpenStyleTag, StyleRAngle, StyleContentAndEndTag,
    OpenTextAreaTag, TextAreaRAngle, TextAreaContentAndEndTag,
    TextModeTagSelfClose,  CommentTag
]

const attributeTokens = [
    Equal,
    Pipe,
    LCurly,
    DQuote,
    SQuote,
    WhiteSpace,
    AttrText
]

export const HtmlxLexer = new Lexer({
    defaultMode: "content_mode",
    modes: {
        content_mode: [
            TextContent,
            LCurly,
            CommentTag,
            OpenStyleTag,
            OpenScriptTag,
            OpenTextAreaTag,
            OpenTag,
            CloseTag
        ],
        tag_mode: [
            Slash,
            Colon,
            RAngle,
            ...attributeTokens,
        ],
        script_tag_mode: [
            ...attributeTokens,
            TextModeTagSelfClose,
            ScriptRAngle
        ],
        script_content_mode: [
            ScriptContentAndEndTag
        ],
        style_tag_mode: [
            ...attributeTokens,
            TextModeTagSelfClose,
            StyleRAngle
        ],
        style_content_mode: [
            StyleContentAndEndTag
        ],
        textarea_tag_mode: [
            ...attributeTokens,
            TextModeTagSelfClose,
            TextAreaRAngle
        ],
        textarea_content_mode: [
            TextAreaContentAndEndTag
        ],
        expr_mode: [
            WhiteSpace,
            VoidBlock,
            BranchBlockOpen,
            BranchBlockContinue,
            BranchBlockEnd,
            ExprContent,
            RCurly,
        ],
        squote_str_mode: [
            LCurly,
            SQuotedString,
            SQuoteEnd
        ],
        dquote_str_mode: [
            LCurly,
            DQuotedString,
            DQuoteEnd,
        ],
    }
});




// We want to ignore balanced braces, and instances of braces withing strings

export function matchExpression(text, startOffset) {
    const quoteStack = []
    let braceDepth = 0
    let endOffset = startOffset
    const textLength = text.length;
    let char = text[endOffset]

    //we don't want to match if it starts with @ : / # as these are matched by other rules
    switch (char) {
        case '@':
        case ':':
        case '/':
        case '#':
            return null;
    }


    while (braceDepth >= 0 && endOffset < textLength) {
        char = text[endOffset]
        switch (char) {
            case '{': 
                braceDepth++;
                break;
            case '}':
                braceDepth--;
                break;
            case '"':
                do {
                    endOffset += (char == '\\' ? 2 : 1)
                    char = text[endOffset]
                } while (char != '"' && endOffset < textLength)
                break;
            case "'":
                do {
                    endOffset += (char == '\\' ? 2 : 1)
                    char = text[endOffset]
                } while (char != "'" && endOffset < textLength)
                break;
            case "`":
                do {
                    endOffset += (char == '\`' ? 2 : 1)
                    char = text[endOffset]
                } while (char != "`" && endOffset < textLength)
                break;
        }
        endOffset++
        
    }
  
    // No match, must return null to conform with the RegExp.prototype.exec signature
    if (endOffset-1 === startOffset) {
      return null
    } else {
      const matchedString = text.substring(startOffset, endOffset-1)
      // according to the RegExp.prototype.exec API the first item in the returned array must be the whole matched string.
      return [matchedString]
    }
}