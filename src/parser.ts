import { createToken, CstParser, Lexer } from 'chevrotain'
// ----------------- Lexer -----------------
const LAngle = createToken({ name: "LAngle", pattern: /</, push_mode: "tag_mode" });
const RAngle = createToken({ name: "RAngle", pattern: />/, pop_mode: true });

const Colon = createToken({ name: "Colon", pattern: /:/ });
const Equal = createToken({ name: "Equal", pattern: /=/ });
const Pipe = createToken({ name: "Pipe", pattern: /\|/ });

const DQuote = createToken({ name: "DQuote", pattern: /"/, push_mode: "dquote_str_mode" });
const DQuotedString = createToken({ name: "DQuoteString", pattern: /(?:\\"|[^"\{])+/ });
const DQuoteEnd = createToken({ name: "DQuoteEnd", pattern: /"/, pop_mode: true });

const SQuote = createToken({ name: "SQuote", pattern: /'/, push_mode: "squote_str_mode" });
const SQuotedString = createToken({ name: "SQuoteString", pattern: /(?:\\'|[^'\{])+/ });
const SQuoteEnd = createToken({ name: "SQuoteEnd", pattern: /'/, pop_mode: true });

const Slash = createToken({ name: "Slash", pattern: /\// });

const OpenTag = createToken({ name: "OpenTag", pattern: /<[a-zA-Z0-9:]+/, push_mode: "tag_mode" });
const CloseTag = createToken({ name: "CloseTag", pattern: /<\/[a-zA-Z0-9:]+/, push_mode: "tag_mode" });
const AttrText = createToken({ name: "AttrText", pattern: /[^\s"'=<>`{\|\/]+/ });

const LCurly = createToken({ name: "LCurly", pattern: /\{/, push_mode: "expr_mode" });
const ExprContent = createToken({ name: "ExprContent", pattern: /(\{.*?\}|[^}])+/ });
const RCurly = createToken({ name: "RCurly", pattern: /\}/, pop_mode: true });

const TagContent = createToken({ name: "TagContent", pattern: /[^<{]+/ });

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/
});


const svelteTokens = [LAngle, RAngle, Colon, DQuote, DQuotedString, DQuoteEnd,
    SQuote, SQuotedString, SQuoteEnd,
    Slash, OpenTag, CloseTag, AttrText,
    LCurly, ExprContent, TagContent, RCurly, WhiteSpace
]

export const SvelteLexer = new Lexer({
    defaultMode: "content_mode",
    modes: {
        content_mode: [
            TagContent,
            LCurly,
            OpenTag,
            CloseTag
        ],
        tag_mode: [
            Slash,
            Colon,
            RAngle,
            Equal,
            Pipe,
            LCurly,
            DQuote,
            SQuote,
            WhiteSpace,
            AttrText
        ],
        expr_mode: [
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

// ----------------- parser -----------------
export class SvelteParser extends CstParser {
    constructor() {
        super(svelteTokens, {
            recoveryEnabled: true
        })
        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        this.performSelfAnalysis();
    }

    tag_children = this.RULE("tag_children", () =>
        this.MANY(() => this.OR([
            { ALT: () => this.SUBRULE(this.tag) },
            { ALT: () => this.SUBRULE(this.text) },
            { ALT: () => this.SUBRULE(this.expression) }
        ]))
    );

    tag = this.RULE("tag", () => {
        this.CONSUME(OpenTag)
        this.SUBRULE(this.attribute_list)
        this.OPTION(() => this.CONSUME(WhiteSpace))
        this.OR([
            {
                ALT: () => {
                    this.CONSUME(Slash)
                    this.CONSUME(RAngle)
                }
            },
            {
                ALT: () => {
                    this.CONSUME2(RAngle)
                    this.SUBRULE(this.tag_children)
                    this.SUBRULE(this.closetag)
                }
            }
        ])
    })

    text = this.RULE("text", () => {
        this.CONSUME(TagContent)
    })

    closetag = this.RULE("closetag", () => {
        this.CONSUME(CloseTag)
        this.OPTION(() => this.CONSUME(WhiteSpace))
        this.CONSUME(RAngle)
    });

    attribute_list = this.RULE("attribute_list", () => {
        this.MANY({
            GATE: () => this.LA(2).image != '/',  // Guard against going down this path for `lastAttribute=5/>`
            DEF: () => {
                this.CONSUME(WhiteSpace)
                this.OR([
                    { ALT: () => this.SUBRULE(this.attribute) },
                    { ALT: () => this.SUBRULE(this.expression) }
                ])
            }
        })
    });

    attribute = this.RULE("attribute", () => {
        this.CONSUME(AttrText)
        this.SUBRULE(this.modifier_list)
        this.OPTION(() => this.SUBRULE(this.quoted_attribute_value))
    });

    modifier_list = this.RULE("modifier_list", () => {
        this.MANY(() => {
            this.CONSUME(Pipe)
            this.CONSUME(AttrText)
        })
    })

    quoted_attribute_value = this.RULE("quoted_attribute_value", () => {
        this.CONSUME(Equal)
        this.OR([
            { ALT: () => this.SUBRULE(this.double_quoted_value) },
            { ALT: () => this.SUBRULE(this.single_quoted_value) },
            { ALT: () => this.SUBRULE(this.unquoted_value) }
        ])
    });

    unquoted_value = this.RULE("unquoted_value", () => {
        this.MANY(() => this.OR([
            { ALT: () => this.CONSUME(AttrText) },
            { ALT: () => this.SUBRULE(this.expression) }
        ]))
    })

    double_quoted_value = this.RULE("double_quoted_value", () => {
        this.CONSUME(DQuote)
        this.MANY(() => this.OR([
            { ALT: () => this.CONSUME(DQuotedString) },
            { ALT: () => this.SUBRULE(this.expression) }
        ]))
        this.CONSUME(DQuoteEnd)
    })

    single_quoted_value = this.RULE("single_quoted_value", () => {
        this.CONSUME(SQuote)
        this.MANY(() => this.OR([
            { ALT: () => this.CONSUME(SQuotedString) },
            { ALT: () => this.SUBRULE(this.expression) }
        ]))
        this.CONSUME(SQuoteEnd)
    })

    expression = this.RULE("expression", () => {
        this.CONSUME(LCurly)
        this.CONSUME(ExprContent)
        this.CONSUME(RCurly)
    })
}

