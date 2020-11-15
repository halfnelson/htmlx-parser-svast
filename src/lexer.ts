import { createToken, Lexer } from 'chevrotain'

export const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });

// Tag Children
export const TextContent = createToken({ name: "TextContent", pattern: /[^<\{]+/ });
export const CommentTag = createToken({ name: "CommentTag", pattern: /<\!\-\-[\s\S]*?\-\->/ })

export const OpenScriptTag = createToken({ name: "OpenScriptTag", pattern: /<script/, push_mode: "script_tag_mode"})
export const ScriptRAngle = createToken({ name: "ScriptRAngle", pattern: />/, pop_mode: true, push_mode: "script_content_mode" });
export const ScriptContentAndEndTag = createToken({ name: "ScriptContentAndEndTag", pattern: /[\s\S]*<\/script>/, pop_mode: true })

export const OpenStyleTag = createToken({ name: "OpenStyleTag", pattern: /<style/, push_mode: "style_tag_mode"})
export const StyleRAngle = createToken({ name: "StyleRAngle", pattern: />/, pop_mode: true, push_mode: "style_content_mode" });
export const StyleContentAndEndTag = createToken({ name: "StyleContentAndEndTag", pattern: /[\s\S]*<\/style>/, pop_mode: true })

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
export const ExprContent = createToken({ name: "ExprContent", pattern: /[^\}\@\:\/\x23](\{[\s\S]*?\}|[^\}])*/ });
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
    CommentTag
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
        style_tag_mode: [
            ...attributeTokens,
            StyleRAngle
        ],
        style_content_mode: [
            StyleContentAndEndTag
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