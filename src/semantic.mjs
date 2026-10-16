// Semantic token rules (TypeScript, Pylance, rust-analyzer, clangd, Java…).
//
// These mirror the TextMate roles exactly, so code does not change color when
// a language server attaches. Only categories a grammar cannot know about get
// a dedicated rule: callables stored in variables, default-library symbols,
// readonly constants in Rust, keyword arguments in Python.

export function semanticTokenColors(p) {
  const c = p.syntax;
  return {
    namespace: c.namespace,

    type: c.type,
    class: c.type,
    interface: c.type,
    struct: c.type,
    typeParameter: c.type,
    'type.defaultLibrary': c.typeSoft,
    'class.defaultLibrary': c.typeSoft,
    'interface.defaultLibrary': c.typeSoft,

    enum: c.constant,
    enumMember: c.constant,
    'variable.constant': c.constant,

    function: c.function,
    method: c.method,
    'function.defaultLibrary': c.method,
    macro: c.function,
    decorator: c.function,

    variable: c.text,
    parameter: c.text,
    property: c.text,
    'parameter.keywordArgument': c.attribute,

    selfParameter: c.keyword,
    clsParameter: c.keyword,
    selfKeyword: c.keyword,

    label: c.punctuation,
  };
}
