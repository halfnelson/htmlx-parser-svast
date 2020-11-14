import { CstChildrenDictionary, CstElement, CstNode, IToken, ITokenConfig } from 'chevrotain';
import { BranchingBlock, Root, SvelteComponent, SvelteElement, SvelteExpression, VoidBlock, Text, SvelteMeta, Property, Directive, Branch, Literal } from 'svast'

import { HtmlxParser } from './parser';


const parserInstance = new HtmlxParser();

const BaseHtmlxLVisitor = parserInstance.getBaseCstVisitorConstructor()

function textNode(value: IToken): Text {
    return {
        type: "text",
        value: value.image
    }
}

function expressionNode(value: IToken): SvelteExpression {
    return {
        type: "svelteExpression",
        value: value.image
    }
}

type TagChild = SvelteComponent | SvelteElement | SvelteMeta | SvelteExpression | BranchingBlock | VoidBlock | Text 

type TagType = SvelteComponent | SvelteElement | SvelteMeta

class HtmlxVisitor extends BaseHtmlxLVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    // root := tag_content
    root(n: CstChildrenDictionary): Root {
        return { 
            type: "root",
            children: this.visit(n.tag_content[0] as CstNode)
        } 
    }

    // tag_content := tag_child*
    tag_content(n: CstChildrenDictionary): TagChild[] {
        return n.tag_child?.map(c => this.visit(c as CstNode)) ?? []
    }

    // tag_child := tag | text | void_block | branch_block | expression
    tag_child(n: CstChildrenDictionary): TagChild  {
        if (n.tag) return this.visit(n.tag[0] as CstNode);
        if (n.text) return this.visit(n.text[0] as CstNode);
        if (n.void_block) return this.visit(n.void_block[0] as CstNode);
        if (n.branch_block) return this.visit(n.branch_block[0] as CstNode);
        if (n.expression) return this.visit(n.expression[0] as CstNode);
        throw new Error("unexpected tag child type")
    }

    tag(n: CstChildrenDictionary): TagType {
        var el:Partial<TagType> = {}
        let name = (n.OpenTag[0] as IToken).image.substr(1);
        let colonIdx = name.indexOf(':')
        if (colonIdx >= 0) {
            el.type = "svelteMeta"
            el.tagName = name.substring(name.indexOf(':') + 1)
        } else {
            el.type = (name[0].toLowerCase() == name[0]) ? "svelteElement" : "svelteComponent"
            el.tagName = name
        }
        el.selfClosing = !!n.Slash;
        el.properties = this.visit(n.attribute_list[0] as CstNode)
        el.children = this.visit(n.tag_content[0] as CstNode)
        return el as TagType
    }

    void_block(n: CstChildrenDictionary): VoidBlock {
        return {    
            type: "svelteVoidBlock",
            name: (n.VoidBlock[0] as IToken).image,
            expression: expressionNode(n.ExprContent[0] as IToken)
        } as VoidBlock
    }

    branch_block(n: CstChildrenDictionary): BranchingBlock {
        let startBranch: Branch = this.visit(n.start_branch[0] as CstNode);
        let otherBranches: Branch[] = n.branch?.map(b => this.visit(b as CstNode)) ?? [];
        return {
            type: "svelteBranchingBlock",
            branches: [startBranch, ...otherBranches],
            name: startBranch.name
        }
    }

    start_branch(n: CstChildrenDictionary): Branch {
        return {
            type: "svelteBranch",
            name: (n.BranchBlockOpen[0] as IToken).image.substring(1),
            expression: n.ExprContent ? expressionNode(n.ExprContent[0] as IToken) : undefined,
            children: n.tag_content ? this.visit(n.tag_content[0] as CstNode) : []
        }
    }

    branch(n: CstChildrenDictionary): Branch {
        return {
            type: "svelteBranch",
            name: (n.BranchBlockContinue[0] as IToken).image.substring(1),
            expression: n.ExprContent ? expressionNode(n.ExprContent[0] as IToken) : undefined,
            children: n.tag_content ? this.visit(n.tag_content[0] as CstNode) : []
        }
    }

    text(n: CstChildrenDictionary): Text {
        return textNode(n.TagContent[0] as IToken)
    }

    attribute_list(n: CstChildrenDictionary): (Property | Directive)[] {
        return n.attribute_or_expression?.map(a => this.visit(a as CstNode)) ?? []
    }

    attribute_or_expression(n: CstChildrenDictionary): (Property | Directive) {
        if (n.attribute) return this.visit(n.attribute[0] as CstNode)
        if (n.expression) {
            const expr:SvelteExpression = this.visit(n.expression[0] as CstNode)
            return {
                type: "svelteProperty",
                value: [expr],
                shorthand: "expression",
                modifiers: [],
                name: expr.value.trim()
            } as Property
        }
    }

    attribute(n: CstChildrenDictionary): (Property | Directive) {
        const name = (n.AttrText[0] as IToken).image;
        const colonIndex = name.indexOf(':');
        if (colonIndex >= 0) {
            return {
                type: "svelteDirective",
                name: name.substring(0, colonIndex),
                specifier: name.substr(colonIndex+1),
                shorthand: "none",
                modifiers: this.visit(n.modifier_list[0] as CstNode),
                value: n.quoted_attribute_value ? this.visit(n.quoted_attribute_value[0] as CstNode) : []
            }
        } else {
            return {
                type: "svelteProperty",
                name: name,
                shorthand: n.quoted_attribute_value ? "none" : "boolean",
                modifiers: this.visit(n.modifier_list[0] as CstNode),
                value: n.quoted_attribute_value ? this.visit(n.quoted_attribute_value[0] as CstNode) : []
            } as Property
        }
    }

    modifier_list(n: CstChildrenDictionary): Literal[] {
        return n.AttrText?.map(a => ({
            type: "modifier",
            value: (a as IToken).image
        })) ?? []
    }

    quoted_attribute_value(n: CstChildrenDictionary):(Text|SvelteExpression)[] {
        if (n.double_quoted_value) return this.visit(n.double_quoted_value[0] as CstNode);
        if (n.single_quoted_value) return this.visit(n.single_quoted_value[0] as CstNode);
        if (n.unquoted_value) return this.visit(n.unquoted_value[0] as CstNode);
    }

    unquoted_value(n: CstChildrenDictionary):(Text|SvelteExpression)[] {
        return n.noquote_string_or_expression?.map(c => this.visit(c as CstNode))
    }

    double_quoted_value(n: CstChildrenDictionary):(Text|SvelteExpression)[] {
        return n.dquote_string_or_expression?.map(c => this.visit(c as CstNode))
    }

    single_quoted_value(n: CstChildrenDictionary):(Text|SvelteExpression)[] {
        return n.squote_string_or_expression?.map(c => this.visit(c as CstNode))
    }
    
    squote_string_or_expression(n: CstChildrenDictionary):Text|SvelteExpression {
        return n.expression ? this.visit(n.expression[0] as CstNode) : textNode(n.SQuoteString[0] as IToken)
    }

    dquote_string_or_expression(n: CstChildrenDictionary):Text|SvelteExpression {
        return n.expression ? this.visit(n.expression[0] as CstNode) : textNode(n.DQuoteString[0] as IToken)
    }

    noquote_string_or_expression(n: CstChildrenDictionary):Text|SvelteExpression {
        return n.expression ? this.visit(n.expression[0] as CstNode) : textNode(n.AttrText[0] as IToken)
    }

    expression(n: CstChildrenDictionary): SvelteExpression {
        return expressionNode(n.ExprContent[0] as IToken);
    }

    closetag(n: CstChildrenDictionary) {}
}




export function cstToSvast(root :CstNode): Root {
    const visitor = new HtmlxVisitor();
    return visitor.visit(root) as Root;
}