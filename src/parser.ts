import { CstParser } from "chevrotain";
import { AttrText, BranchBlockContinue, BranchBlockEnd, BranchBlockOpen, CloseTag, DQuote, DQuotedString, DQuoteEnd, Equal, ExprContent, LCurly, 
         OpenTag, Pipe, RAngle, RCurly, Slash, SQuote, SQuotedString, 
         SQuoteEnd, HtmlxLexer, svelteTokens, TagContent, VoidBlock, WhiteSpace } from "./lexer";

// ----------------- parser -----------------
export class HtmlxParser extends CstParser {
    constructor() {
        super(svelteTokens, {
            recoveryEnabled: true
        })
        // very important to call this after all the rules have been setup.
        // otherwise the parser may not work correctly as it will lack information
        // derived from the self analysis.
        this.performSelfAnalysis();
    }

    tag_content = this.RULE("tag_content", () =>
        this.MANY({
            // Guard against going down this path for branch_block continuations or endings
            GATE: () => this.LA(1).tokenType != LCurly || (this.LA(2).tokenType != BranchBlockContinue && this.LA(2).tokenType != BranchBlockEnd),
            DEF: () => this.SUBRULE(this.tag_child)
        })
    );

    tag_child = this.RULE("tag_child", () => 
        this.OR([
            { ALT: () => this.SUBRULE(this.tag) },
            { ALT: () => this.SUBRULE(this.text) },
            { ALT: () => this.SUBRULE(this.void_block) },
            { ALT: () => this.SUBRULE(this.branch_block) },
            { ALT: () => this.SUBRULE(this.expression) }
        ])
    )

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
                    this.SUBRULE(this.tag_content)
                    this.SUBRULE(this.closetag)
                }
            }
        ])
    })

    void_block = this.RULE("void_block", () => {
        this.CONSUME(LCurly)
        this.CONSUME(VoidBlock)
        this.CONSUME(ExprContent)
        this.CONSUME(RCurly)
    })

    branch_block = this.RULE("branch_block", () => {
        this.SUBRULE(this.start_branch)
        this.MANY(() => this.SUBRULE(this.branch))
        this.CONSUME(LCurly)
        this.CONSUME(BranchBlockEnd)
        this.CONSUME(RCurly)
    })

    start_branch = this.RULE("start_branch", () => {
        this.CONSUME(LCurly)
        this.CONSUME(BranchBlockOpen)
        this.OPTION(() => this.CONSUME(ExprContent))
        this.CONSUME(RCurly)
        this.OPTION2(() => this.SUBRULE(this.tag_content))
    })

    branch = this.RULE("branch", () => {
        this.CONSUME(LCurly)
        this.CONSUME(BranchBlockContinue)
        this.OPTION(() => this.CONSUME(ExprContent))
        this.CONSUME(RCurly)
        this.OPTION2(() => this.SUBRULE(this.tag_content))
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
        this.OPTION(() => {
             this.CONSUME(Equal)
            this.SUBRULE(this.quoted_attribute_value)
        })
    });

    modifier_list = this.RULE("modifier_list", () => {
        this.MANY(() => {
            this.CONSUME(Pipe)
            this.CONSUME(AttrText)
        })
    })

    quoted_attribute_value = this.RULE("quoted_attribute_value", () => {
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


export var parser: HtmlxParser = new HtmlxParser();

export function parseHtmlxToCst(text: string) {
    const lexingResult = HtmlxLexer.tokenize(text);
    // reuse the instance
    parser.input = lexingResult.tokens;
    let result = parser.tag_content();

    return {
        lex_errors: lexingResult.errors,
        parse_errors: parser.errors,
        cst: result
    }
}