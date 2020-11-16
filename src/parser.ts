import { CstParser } from "chevrotain";
import {
	AttrText, BranchBlockContinue, BranchBlockEnd, BranchBlockOpen, CloseTag, DQuote, DQuotedString, DQuoteEnd, Equal, ExprContent, LCurly,
	OpenTag, Pipe, RAngle, RCurly, Slash, SQuote, SQuotedString,
	SQuoteEnd, HtmlxLexer, svelteTokens, TextContent, VoidBlock, WhiteSpace, ScriptRAngle, ScriptContentAndEndTag, OpenScriptTag, OpenStyleTag, StyleRAngle, StyleContentAndEndTag, CommentTag, OpenTextAreaTag, TextAreaRAngle, TextAreaContentAndEndTag, TextModeTagSelfClose
} from "./lexer";


// https://www.w3.org/TR/html51/syntax.html#optional-tags
const autoStopTags = {
	'li': ['li'],
	'dt': ['dt','dd'],
	'dd': ['dd','dt'],
	'p': ['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure','footer',
		  'form','h1','h2','h3','h4','h5','h6','header', 'hr','main', 'menu','nav','ol','p','pre','section','table','ul'],
	'rt': ['rt', 'rp'],
	'rp': ['rt', 'rp'],
	'optgroup': [ 'optgroup'],
	'option': ['option', 'optgroup'],
	'thead': ['tbody', 'tfoot'],
	'tbody': ['tbody', 'tfoot'],
	'tfoot': ['tbody'],
	'tr': ['tr'],
	'td': ['td','th'],
	'th': ['td','th']
}

//https://www.w3.org/TR/html51/syntax.html#void-elements
const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr']




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

	root = this.RULE("root", () =>
		this.SUBRULE(this.tag_content)
	)

	tag_content = this.RULE("tag_content", (stopTags: string[]) =>
		this.MANY({
			// Guard against going down this path for branch_block continuations or endings
			GATE: () => {
				//branch block continue, or branch block end stops the current content
				if (this.LA(2).tokenType == BranchBlockContinue || this.LA(2).tokenType == BranchBlockEnd) return false;
				//stop tags stop the current tag content (example <option> followed by other <option>)
				if (stopTags && this.LA(1).tokenType == OpenTag && stopTags.indexOf(this.LA(1).image.substring(1).toLowerCase()) >= 0) return false;
				return true;
			},
			DEF: () => this.SUBRULE(this.tag_child)
		})
	);

	tag_child = this.RULE("tag_child", () =>
		this.OR([
			{ ALT: () => this.SUBRULE(this.tag) },
			{ ALT: () => this.SUBRULE(this.script_tag) },
			{ ALT: () => this.SUBRULE(this.style_tag) },
			{ ALT: () => this.SUBRULE(this.textarea_tag)},
			{ ALT: () => this.SUBRULE(this.comment_tag) },
			{ ALT: () => this.SUBRULE(this.void_block) },
			{ ALT: () => this.SUBRULE(this.branch_block) },
			{ ALT: () => this.SUBRULE(this.expression) },
			{ ALT: () => this.SUBRULE(this.text) },
		])
	)

	tag = this.RULE("tag", () => {
		let tagToken = this.CONSUME(OpenTag);
		const tagName = tagToken.image.substring(1).toLowerCase();
		let closeTags: string[] | undefined = autoStopTags[tagName]

		let isVoid = voidTags.indexOf(tagName) >= 0;

		this.SUBRULE(this.attribute_list)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.OR([
			{
				ALT: () => {
					this.CONSUME(Slash)
					this.CONSUME(RAngle, { LABEL: "SelfClose"})
				}
			},
			{
				GATE: () => isVoid,
				ALT: () => {
					this.CONSUME2(RAngle, { LABEL: "SelfClose"})
				}
			},
			{
				GATE: () => !closeTags && !isVoid,  
				ALT: () => {
					this.CONSUME3(RAngle)
					this.SUBRULE(this.tag_content,{ ARGS: [closeTags] })
					this.SUBRULE(this.closetag)
				}
			},
			{
				GATE: () => !!closeTags && !isVoid,  
				ALT: () => {
					this.CONSUME4(RAngle)
					this.SUBRULE2(this.tag_content,{ ARGS: [closeTags] })
					this.OPTION2({
						GATE: () => this.LA(1).tokenType == CloseTag && this.LA(1).image.toLowerCase() == `</${tagName}`, //this might be the end of our parent tag
						DEF: () => this.SUBRULE2(this.closetag)
					})
				}
			}

		])
	})

	script_tag = this.RULE("script_tag", () => {
		this.CONSUME(OpenScriptTag)
		this.SUBRULE(this.attribute_list)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.OR([
			{ ALT: () => {
				this.CONSUME(ScriptRAngle)
				this.CONSUME(ScriptContentAndEndTag)
			}},
			{ ALT: () => 
				this.CONSUME(TextModeTagSelfClose)
			}
		])
	})

	style_tag = this.RULE("style_tag", () => {
		this.CONSUME(OpenStyleTag)
		this.SUBRULE(this.attribute_list)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.OR([
			{ ALT: () => {
				this.CONSUME(StyleRAngle)
				this.CONSUME(StyleContentAndEndTag)
			}},
			{ ALT: () => 
				this.CONSUME(TextModeTagSelfClose)
			}
		])
	})

	textarea_tag = this.RULE("textarea_tag", () => {
		this.CONSUME(OpenTextAreaTag)
		this.SUBRULE(this.attribute_list)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.OR([
			{ ALT: () => {
				this.CONSUME(TextAreaRAngle)
				this.CONSUME(TextAreaContentAndEndTag)
			}},
			{ ALT: () => 
				this.CONSUME(TextModeTagSelfClose)
			}
		])
	})

	comment_tag = this.RULE("comment_tag", () => {
		this.CONSUME(CommentTag)
	})

	void_block = this.RULE("void_block", () => {
		this.CONSUME(LCurly)
		this.CONSUME(VoidBlock)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.OPTION2(() => this.CONSUME(ExprContent))
		this.CONSUME2(RCurly)
	})

	branch_block = this.RULE("branch_block", () => {
		this.SUBRULE(this.start_branch)
		this.MANY(() => this.SUBRULE(this.branch))
		this.CONSUME(LCurly)
		this.CONSUME(BranchBlockEnd)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.CONSUME(RCurly)
	})

	expression = this.RULE("expression", () => {
		this.CONSUME(LCurly)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.CONSUME(ExprContent)
		this.CONSUME(RCurly)
	})

	text = this.RULE("text", () => {
		this.CONSUME(TextContent)
	})

	start_branch = this.RULE("start_branch", () => {
		this.CONSUME(LCurly)
		this.CONSUME(BranchBlockOpen)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.OPTION2(() => this.CONSUME(ExprContent))
		this.CONSUME(RCurly)
		this.OPTION3(() => this.SUBRULE(this.tag_content))
	})

	branch = this.RULE("branch", () => {
		this.CONSUME(LCurly)
		this.CONSUME(BranchBlockContinue)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.OPTION2(() => this.CONSUME(ExprContent))
		this.CONSUME(RCurly)
		this.OPTION3(() => this.SUBRULE(this.tag_content))
	})

	closetag = this.RULE("closetag", () => {
		this.CONSUME(CloseTag)
		this.OPTION(() => this.CONSUME(WhiteSpace))
		this.CONSUME(RAngle)
	});

	attribute_list = this.RULE("attribute_list", () => {
		this.MANY({
			GATE: () => this.LA(2).image != '/' && this.LA(2).image != '>' && this.LA(2).tokenType != TextModeTagSelfClose,  // Guard against going down this path for `lastAttribute=5/>`
			DEF: () => {
				this.OPTION(() => this.CONSUME(WhiteSpace))
				this.SUBRULE(this.attribute_or_expression)
			}
		})
	});

	attribute_or_expression = this.RULE("attribute_or_expression", () =>
		this.OR([
			{ ALT: () => this.SUBRULE(this.attribute) },
			{ ALT: () => this.SUBRULE(this.expression) }
		])
	)

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
		this.MANY(() => this.SUBRULE(this.noquote_string_or_expression))
	})

	noquote_string_or_expression = this.RULE("noquote_string_or_expression", () =>
		this.OR([
			{ ALT: () => this.CONSUME(AttrText) },
			{ ALT: () => this.SUBRULE(this.expression) }
		])
	)

	double_quoted_value = this.RULE("double_quoted_value", () => {
		this.CONSUME(DQuote)
		this.MANY(() => this.SUBRULE(this.dquote_string_or_expression))
		this.CONSUME(DQuoteEnd)
	})

	dquote_string_or_expression = this.RULE("dquote_string_or_expression", () =>
		this.OR([
			{ ALT: () => this.CONSUME(DQuotedString) },
			{ ALT: () => this.SUBRULE(this.expression) }
		])
	)

	single_quoted_value = this.RULE("single_quoted_value", () => {
		this.CONSUME(SQuote)
		this.MANY(() => this.SUBRULE(this.squote_string_or_expression))
		this.CONSUME(SQuoteEnd)
	})

	squote_string_or_expression = this.RULE("squote_string_or_expression", () =>
		this.OR([
			{ ALT: () => this.CONSUME(SQuotedString) },
			{ ALT: () => this.SUBRULE(this.expression) }
		])
	)
}

const existingTrimRight = (String.prototype.trimEnd || String.prototype.trimRight);
const trimRight = existingTrimRight ? (s: String) => existingTrimRight.apply(s) : (s: String) => ('*'+s).trim().substring(1);







export var parser: HtmlxParser = new HtmlxParser();

export function parseHtmlxToCst(text: string) {
	const lexingResult = HtmlxLexer.tokenize(trimRight(text));
	// parser instances should be reused
	parser.input = lexingResult.tokens;
	let result = parser.root();

	return {
		lex_errors: lexingResult.errors,
		parse_errors: parser.errors,
		cst: result
	}
}