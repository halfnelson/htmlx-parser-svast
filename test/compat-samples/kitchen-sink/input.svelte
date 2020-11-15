<script scriptattr="value">
    function scriptBlockContentIsNotParsed() {
        console.log("<h1>it can contain heaps of stuff</h1>")
    }
</script>
<style styleAttr="value">
    .style-blocks-are-handled-differently-too {
        content: 'they contain verbatim contnt'
    }
</style>

text

{expression}

<selfClosing 
    boolean-attr 
    {expressionAttr}
    regular-attr=unquoted
    regular-attr-1=''
    regular-attr-2='single " quoted'
    regular-attr-3="double ' quoted"
    regular-attr-4=unquoted{withExpression}andmoreUnquoted
    regular-attr-5='single quoted {withExpression}'
    regular-attr-6="double quoted {withExpression}"
    regular-attr-7=""
    regular-attr-8="{quotedExpression}"
    regular-attr-9='{quotedExpression}'
    regular-attr-10={unquotedExpressionValue}
    use:booleanDirective
    use:paramDirective={param}
    on:eventName
    on:eventName2|once|passive
    on:eventName3|once={() => handlerValue}
/>

<element>
    text content
    {expressionContent}
    <h1>Tag Content</h1>
    {@debug voidBlock}
    {#if expr}nestedBranch{/if}
</element>

<empty-element></empty-element>

<Component />

<svelte:component this={thing} />

{ a + complex().expression  }

{#if some+multi-expression}a{/if}
{#await prom}a{:then value}a{:catch error}a{/await}

{@debug voidBlockTest }

{#if expr}
nested Text
{nestedExpr}
{@debug nextedVoid}
<nestedTag />
{#if nestedBranch}
{/if}
{:else}
nested Text
{nestedExpr}
{@debug nextedVoid}
<nestedTag />
{#if nestedBranch}
{/if}
{/if}



