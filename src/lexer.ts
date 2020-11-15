import { createToken, Lexer } from 'chevrotain'

// ----------------- Lexer -----------------
export const LAngle = createToken({ name: "LAngle", pattern: /</, push_mode: "tag_mode" });
export const RAngle = createToken({ name: "RAngle", pattern: />/, pop_mode: true });

export const Colon = createToken({ name: "Colon", pattern: /:/ });
export const Equal = createToken({ name: "Equal", pattern: /=/ });
export const Pipe = createToken({ name: "Pipe", pattern: /\|/ });

export const DQuote = createToken({ name: "DQuote", pattern: /"/, push_mode: "dquote_str_mode" });
export const DQuotedString = createToken({ name: "DQuoteString", pattern: /(?:\\"|[^"\{])+/ });
export const DQuoteEnd = createToken({ name: "DQuoteEnd", pattern: /"/, pop_mode: true });

export const SQuote = createToken({ name: "SQuote", pattern: /'/, push_mode: "squote_str_mode" });
export const SQuotedString = createToken({ name: "SQuoteString", pattern: /(?:\\'|[^'\{])+/ });
export const SQuoteEnd = createToken({ name: "SQuoteEnd", pattern: /'/, pop_mode: true });

export const Slash = createToken({ name: "Slash", pattern: /\// });


export const OpenScriptTag = createToken({ name: "OpenScriptTag", pattern: /<script/, push_mode: "script_tag_mode"})
export const ScriptContentAndEndTag = createToken({ name: "ScriptContentAndEndTag", pattern: /.+<\/script>/, pop_mode: true })
export const ScriptRAngle = createToken({ name: "ScriptRAngle", pattern: />/, pop_mode: true, push_mode: "script_content_mode" });

export const OpenStyleTag = createToken({ name: "OpenStyleTag", pattern: /<style/, push_mode: "style_tag_mode"})
export const StyleContent = createToken({ name: "StyleContent", pattern: /.*(?!<\/style\s*>)/s, pop_mode: true })
export const StyleRAngle = createToken({ name: "StyleRAngle", pattern: />/, pop_mode: true, push_mode: "style_content_mode" });

export const OpenCommentTag = createToken({ name: "OpenStyleTag", pattern: /<script/, push_mode: "comment_mode"})

export const OpenTag = createToken({ name: "OpenTag", pattern: /<[a-zA-Z0-9:\-]+/, push_mode: "tag_mode" });
export const CloseTag = createToken({ name: "CloseTag", pattern: /<\/[a-zA-Z0-9:\-]+/, push_mode: "tag_mode" });
export const AttrText = createToken({ name: "AttrText", pattern: /[^\s"'=<>`{\|\/]+/ });

export const LCurly = createToken({ name: "LCurly", pattern: /\{/, push_mode: "expr_mode" });
export const ExprContent = createToken({ name: "ExprContent", pattern: /[^\}\@\:\/\x23](\{.*?\}|[^\}])*/ });
export const VoidBlock = createToken({ name: "VoidBlock", pattern: /\@[^\s\}]+/ });
export const BranchBlockOpen = createToken({ name: "BranchBlockOpen", pattern: /\x23[^\s\}]+/  });
export const BranchBlockContinue = createToken({ name: "BranchBlockContinue", pattern: /\:[^\s\}]+/ });
export const BranchBlockEnd = createToken({ name: "BranchBlockEnd", pattern: /\/[^\s\}]+/ });
export const RCurly = createToken({ name: "RCurly", pattern: /\}/, pop_mode: true });

export const TagContent = createToken({ name: "TagContent", pattern: /[^<\{]+/ });

export const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/
});


export const svelteTokens = [LAngle, RAngle, Colon, DQuote, DQuotedString, DQuoteEnd,
    SQuote, SQuotedString, SQuoteEnd,
    Slash, OpenTag, CloseTag, AttrText,
    LCurly, ExprContent, TagContent, RCurly, WhiteSpace,
    VoidBlock, BranchBlockOpen, BranchBlockContinue, BranchBlockEnd,
    OpenScriptTag, ScriptRAngle, ScriptContentAndEndTag
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
           
            TagContent,
            LCurly,
            OpenScriptTag,
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
            ScriptRAngle
        ],
        script_content_mode: [
            ScriptContentAndEndTag
        ],
        expr_mode: [
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