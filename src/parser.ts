import { CstParser } from "chevrotain";
import { AttrText, CloseTag, DQuote, DQuotedString, DQuoteEnd, Equal, ExprContent, LCurly, 
         OpenTag, Pipe, RAngle, RCurly, Slash, SQuote, SQuotedString, 
         SQuoteEnd, SvelteLexer, svelteTokens, TagContent, WhiteSpace } from "./lexer";



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

export let parser: SvelteParser;

export function parseSvelte(text: string) {
    const lexingResult = SvelteLexer.tokenize(text);
    // reuse the instance
    parser = parser ?? new SvelteParser();

    parser.input = lexingResult.tokens;
    let result = parser.tag_children();

    console.log("Errors", JSON.stringify(parser.errors, null, 2));
    return result;
}