// TextMate token rules.
//
// The grammar is deliberately small: a handful of roles repeated across every
// language. Generic scopes come first; language-specific corrections follow
// and only exist where a grammar would otherwise produce an off-system color.

const rule = (name, scope, foreground, fontStyle) => ({
  name,
  scope,
  settings: {
    ...(foreground ? { foreground } : {}),
    ...(fontStyle !== undefined ? { fontStyle } : {}),
  },
});

/** Prefix each scope with the given parent scopes (e.g. CSS dialects). */
const within = (parents, scopes) => parents.flatMap((p) => scopes.map((s) => `${p} ${s}`));

const STYLESHEETS = ['source.css', 'source.scss', 'source.less', 'source.postcss', 'source.sass', 'source.stylus'];
const SCRIPT_SUFFIXES = ['ts', 'tsx', 'js', 'jsx'];
const scriptScopes = (names) => names.flatMap((n) => SCRIPT_SUFFIXES.map((x) => `${n}.${x}`));

export function tokenColors(p) {
  const c = p.syntax;
  const t = p.text;
  const st = p.state;

  return [
    // ── Foundation ──────────────────────────────────────────────────────
    rule('Comments', ['comment', 'punctuation.definition.comment'], c.comment, 'italic'),
    rule(
      'Documentation comments and docstrings',
      [
        'comment.block.documentation',
        'comment.block.documentation punctuation.definition.comment',
        'comment.block.javadoc',
        'comment.line.documentation',
        'comment.line.double-slash.documentation',
        'comment.line.triple-slash',
        'string.quoted.docstring',
        'string.quoted.docstring punctuation.definition.string',
      ],
      c.docComment,
      'italic',
    ),
    rule(
      'Documentation tags',
      [
        'storage.type.class.jsdoc',
        'punctuation.definition.block.tag.jsdoc',
        'keyword.other.documentation',
        'comment keyword.codetag.notation',
        'comment.block.documentation keyword',
        'comment.block.documentation storage.type',
      ],
      c.docTag,
      'italic',
    ),
    rule(
      'Documentation types',
      [
        'entity.name.type.instance.jsdoc',
        'comment.block.documentation entity.name.type',
        'punctuation.definition.bracket.curly.begin.jsdoc',
        'punctuation.definition.bracket.curly.end.jsdoc',
      ],
      c.docType,
      'italic',
    ),
    rule('Documentation parameters', ['variable.other.jsdoc', 'comment.block.documentation variable'], c.docComment, 'italic'),

    rule('Variables', ['variable', 'variable.other', 'variable.parameter', 'entity.name.variable'], c.text),
    rule('Punctuation', ['punctuation', 'meta.brace', 'punctuation.separator', 'punctuation.terminator'], c.punctuation),

    // ── Keywords ────────────────────────────────────────────────────────
    rule('Keywords and storage', ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control'], c.keyword),
    rule(
      'Word operators read as keywords',
      [
        'keyword.operator.new',
        'keyword.operator.expression',
        'keyword.operator.word',
        'keyword.operator.wordlike',
        'keyword.operator.logical.python',
        'keyword.operator.sizeof',
        'keyword.operator.alignof',
        'keyword.operator.typeid',
        'keyword.operator.cast',
        'keyword.operator.delete',
        'keyword.operator.instanceof',
        'keyword.control.as',
        'storage.type.function.arrow',
      ],
      c.keyword,
    ),
    rule(
      'Module boundary — import, export, from, include, use',
      [
        'keyword.control.import',
        'keyword.control.export',
        'keyword.control.from',
        'keyword.import',
        'keyword.package',
        'keyword.other.import',
        'keyword.other.package',
        'keyword.other.use',
        'keyword.other.using',
        'keyword.other.directive.using',
        'meta.use.rust keyword.other',
        'keyword.other.namespace.php',
        'keyword.control.directive.include',
        'keyword.control.directive.import',
        'keyword.control.directive.include punctuation.definition.directive',
        'keyword.control.directive.import punctuation.definition.directive',
        'keyword.control.at-rule.import',
        'keyword.control.at-rule.use',
        'keyword.control.at-rule.forward',
        'keyword.control.at-rule.import punctuation.definition.keyword',
        'keyword.control.at-rule.use punctuation.definition.keyword',
        'keyword.control.at-rule.forward punctuation.definition.keyword',
      ],
      c.namespace,
    ),

    // ── Operators ───────────────────────────────────────────────────────
    rule('Operators', ['keyword.operator', 'punctuation.accessor.optional', 'keyword.operator.optional', 'keyword.operator.spread', 'keyword.operator.rest'], c.operator),
    rule(
      'Accessors and separators stay quiet',
      [
        'punctuation.accessor',
        'keyword.operator.accessor',
        'keyword.operator.namespace',
        'keyword.operator.key-value.rust',
        'keyword.operator.class.php',
        'punctuation.separator.namespace',
        'punctuation.separator.scope-resolution',
        'punctuation.separator.method',
        'keyword.operator.type.annotation',
      ],
      c.punctuation,
    ),

    // ── Functions ───────────────────────────────────────────────────────
    rule(
      'Functions',
      ['entity.name.function', 'support.function', 'variable.function', 'meta.function-call.generic', 'support.function.magic', 'entity.name.function.preprocessor', 'entity.name.function.macro'],
      c.function,
    ),
    rule(
      'Methods',
      ['entity.name.function.member', 'meta.definition.method entity.name.function'],
      c.method,
    ),
    rule(
      'Built-in functions',
      ['support.function.builtin', 'support.function.console', 'support.function.json', 'support.function.math', 'support.function.dom', 'support.function.promise', 'support.function.date'],
      c.method,
    ),
    rule(
      'Decorators and annotations',
      [
        'meta.decorator entity.name.function',
        'meta.decorator variable.other.readwrite',
        'meta.decorator variable.other',
        'punctuation.decorator',
        'entity.name.function.decorator',
        'punctuation.definition.decorator',
        'storage.type.annotation',
        'punctuation.definition.annotation',
        'variable.annotation',
      ],
      c.function,
    ),

    // ── Types ───────────────────────────────────────────────────────────
    rule(
      'Types, classes, interfaces',
      [
        'entity.name.type',
        'entity.name.class',
        'entity.name.type.class',
        'entity.name.type.interface',
        'entity.name.type.alias',
        'entity.name.type.struct',
        'entity.name.type.trait',
        'entity.other.inherited-class',
        'support.class',
        'support.type',
        'support.type.exception',
        'storage.type.generic',
      ],
      c.type,
    ),
    rule(
      'Primitive and built-in types',
      [
        'support.type.primitive',
        'support.type.builtin',
        'support.type.python',
        'storage.type.primitive',
        'storage.type.built-in',
        'storage.type.builtin',
        'keyword.type',
        'storage.type.numeric.go',
        'storage.type.string.go',
        'storage.type.boolean.go',
        'storage.type.byte.go',
        'storage.type.rune.go',
        'storage.type.error.go',
        'storage.type.uintptr.go',
        'entity.name.type.numeric.rust',
        'entity.name.type.primitive.rust',
        'storage.type.core.rust',
        'storage.type.sql',
      ],
      c.typeSoft,
    ),
    rule('Enums', ['entity.name.type.enum', 'entity.name.enum'], c.constant),
    rule(
      'Namespaces and modules',
      [
        'entity.name.namespace',
        'entity.name.type.namespace',
        'entity.name.type.module',
        'entity.name.module',
        'entity.name.package',
        'entity.name.scope-resolution',
        'support.other.namespace',
        'storage.modifier.import',
        'storage.modifier.package',
      ],
      c.namespace,
    ),

    // ── Language variables ──────────────────────────────────────────────
    rule(
      'this, self, super',
      [
        'variable.language',
        'variable.language.this',
        'variable.language.self',
        'variable.language.super',
        'variable.parameter.function.language.special.self',
        'variable.parameter.function.language.special.cls',
        'variable.language.special.self',
        'variable.language.special.cls',
        'keyword.other.this',
        'keyword.other.base',
      ],
      c.keyword,
    ),
    rule('Properties and object keys', ['variable.other.property', 'variable.other.object.property', 'support.variable.property', 'meta.object-literal.key', 'variable.other.member'], c.text),
    rule('Named arguments', ['variable.parameter.function-call.python', 'entity.name.variable.parameter.named'], c.attribute),

    // ── Literals ────────────────────────────────────────────────────────
    rule('Numbers and units', ['constant.numeric', 'keyword.other.unit', 'constant.numeric keyword.other.unit'], c.number),
    rule('Language constants', ['constant.language', 'constant.language.boolean', 'support.constant.language'], c.number),
    rule(
      'null, undefined, nil, None',
      ['constant.language.null', 'constant.language.undefined', 'constant.language.nil', 'constant.language.nullptr', 'constant.language.none', 'constant.language.null.sql'],
      c.nullish,
    ),
    rule(
      'Named constants and enum members',
      ['constant.other', 'constant.other.caps', 'entity.name.constant', 'support.constant', 'variable.other.enummember', 'constant.other.enum', 'variable.other.constant.ruby'],
      c.constant,
    ),
    rule('Strings', ['string', 'punctuation.definition.string', 'string.template', 'string.quoted', 'constant.character', 'string.unquoted.plain.out.yaml', 'string.unquoted.plain.in.yaml', 'property.value.dotenv'], c.string),
    rule(
      'Escapes, placeholders and entities',
      ['constant.character.escape', 'constant.character.entity', 'constant.character.entity punctuation.definition.entity', 'string constant.other.placeholder', 'constant.character.format.placeholder', 'constant.other.placeholder'],
      c.number,
    ),
    rule('Regular expressions', ['string.regexp', 'constant.regexp', 'string.regexp constant.other', 'string.regexp constant.character'], c.number),
    rule(
      'Regular expression structure',
      ['string.regexp keyword.operator', 'string.regexp keyword.control', 'string.regexp punctuation.definition.group', 'string.regexp punctuation.definition.character-class', 'string.regexp constant.other.character-class.set'],
      c.operator,
    ),
    rule(
      'Interpolation delimiters',
      [
        'punctuation.definition.template-expression',
        'punctuation.section.interpolation',
        'punctuation.definition.interpolation',
        'punctuation.section.embedded.begin.php',
        'punctuation.section.embedded.end.php',
        'constant.character.format.placeholder.other.python',
        'storage.type.string.python',
      ],
      c.keyword,
    ),
    rule(
      'Interpolated code reads as code',
      ['meta.template.expression', 'meta.embedded', 'meta.embedded.line', 'meta.interpolation', 'meta.fstring.python', 'string meta.interpolation', 'source.php.embedded'],
      c.text,
    ),

    // ── Markup: HTML, JSX, XML ──────────────────────────────────────────
    rule('Tags', ['entity.name.tag', 'meta.tag.sgml', 'entity.name.tag.custom'], c.tag),
    rule('Tag punctuation', ['punctuation.definition.tag', 'punctuation.section.embedded', 'meta.tag.sgml.doctype', 'punctuation.definition.doctype'], c.tagPunctuation),
    rule('Doctype', ['meta.tag.metadata.doctype entity.name.tag', 'meta.tag.metadata.doctype entity.other.attribute-name'], c.tagPunctuation),
    rule('Components', ['support.class.component', 'entity.name.tag.component', 'entity.name.tag.other.svelte'], c.component),
    rule('Attributes', ['entity.other.attribute-name', 'meta.attribute entity.other.attribute-name'], c.attribute),
    rule('JSX text', ['meta.jsx.children', 'meta.jsx.children.tsx', 'meta.jsx.children.js'], c.text),

    // ── Stylesheets ─────────────────────────────────────────────────────
    rule(
      'Selectors',
      [
        ...within(STYLESHEETS, [
          'entity.other.attribute-name',
          'entity.other.attribute-name.class',
          'entity.other.attribute-name.id',
          'entity.other.attribute-name.pseudo-class',
          'entity.other.attribute-name.pseudo-element',
          'entity.other.attribute-name.parent-selector',
          'entity.other.attribute-name.placeholder',
          'entity.other.keyframe-offset',
          'punctuation.definition.entity',
          'entity.name.tag.wildcard',
        ]),
        'entity.other.attribute-name.class.css',
        'entity.other.attribute-name.id.css',
      ],
      c.tag,
    ),
    rule('Properties', [...within(STYLESHEETS, ['support.type.property-name', 'support.type.vendored.property-name', 'meta.property-name']), 'support.type.property-name.css', 'support.type.vendored.property-name.css'], c.cssProperty),
    rule('Values', within(STYLESHEETS, ['support.constant', 'support.constant.property-value', 'support.constant.font-name', 'support.constant.color', 'support.constant.media']), c.string),
    rule('Layer and keyframe names', within(STYLESHEETS, ['variable.parameter.layer-name', 'variable.parameter.keyframe-list']), c.text),
    rule('Stylesheet word operators', within(STYLESHEETS, ['variable.parameter.misc']), c.keyword),
    rule('Custom properties and preprocessor variables', [...within(STYLESHEETS, ['variable', 'variable.argument', 'variable.other', 'variable.parameter']), 'variable.css', 'variable.scss', 'variable.less'], c.constant),
    rule('Colors and units', [...within(STYLESHEETS, ['constant.other.color', 'punctuation.definition.constant', 'keyword.other.unit', 'constant.numeric']), 'constant.other.color.rgb-value'], c.number),
    rule('At-rule punctuation', ['punctuation.definition.keyword', 'keyword.control.at-rule punctuation.definition.keyword'], c.keyword),

    // ── Data: JSON, YAML, TOML, INI, dotenv ─────────────────────────────
    rule('Keys', ['support.type.property-name', 'punctuation.support.type.property-name', 'entity.name.tag.yaml', 'keyword.other.definition.ini', 'variable.key', 'variable.other.key', 'support.type.property-name.toml', 'entity.name.tag.toml'], c.key),
    rule('Anchors and aliases', ['entity.name.type.anchor', 'variable.other.anchor', 'variable.other.alias', 'punctuation.definition.anchor', 'punctuation.definition.alias'], c.typeSoft),
    rule('Document markers', ['entity.other.document.begin', 'entity.other.document.end', 'punctuation.definition.block.sequence.item'], c.punctuation),
    rule('Section headings', ['entity.name.section.group-title', 'entity.name.section.group-title punctuation.definition.entity'], c.type),

    // ── Markdown ────────────────────────────────────────────────────────
    rule('Headings', ['markup.heading', 'markup.heading entity.name', 'markup.heading.setext', 'heading.1.markdown entity.name', 'heading.2.markdown entity.name'], c.heading, 'bold'),
    rule(
      'Subheadings',
      ['heading.3.markdown entity.name', 'heading.4.markdown entity.name', 'heading.5.markdown entity.name', 'heading.6.markdown entity.name'],
      c.subheading,
      'bold',
    ),
    rule('Heading markers', ['punctuation.definition.heading.markdown', 'markup.heading punctuation.definition.heading'], c.tagPunctuation, ''),
    rule('Bold', ['markup.bold'], undefined, 'bold'),
    rule('Italic', ['markup.italic'], undefined, 'italic'),
    rule('Bold italic', ['markup.bold markup.italic', 'markup.italic markup.bold'], undefined, 'bold italic'),
    rule('Strikethrough', ['markup.strikethrough'], undefined, 'strikethrough'),
    rule('Emphasis markers', ['punctuation.definition.bold', 'punctuation.definition.italic', 'punctuation.definition.strikethrough'], c.punctuation),
    rule('Link text', ['string.other.link', 'string.other.link.title', 'string.other.link.description', 'constant.other.reference.link'], c.link),
    rule('Link destinations', ['markup.underline.link', 'markup.underline.link.image'], c.punctuation, 'underline'),
    rule('Link punctuation', ['punctuation.definition.link.markdown', 'punctuation.definition.link.title.begin.markdown', 'punctuation.definition.link.title.end.markdown', 'punctuation.definition.metadata.markdown', 'punctuation.definition.constant.markdown'], c.punctuation),
    rule('Inline code', ['markup.inline.raw', 'markup.inline.raw.string', 'markup.raw.monospace'], c.string),
    rule('Code fences', ['punctuation.definition.raw.markdown', 'punctuation.definition.markdown', 'markup.fenced_code.block.markdown punctuation.definition.markdown'], c.punctuation),
    rule('Code fence language', ['fenced_code.block.language', 'fenced_code.block.language.attributes'], c.keyword, 'italic'),
    rule('Fenced code without a language', ['markup.fenced_code.block', 'markup.raw.block'], c.text),
    rule('Blockquotes', ['markup.quote', 'markup.quote.markdown'], c.docComment, 'italic'),
    rule('Blockquote and list markers', ['punctuation.definition.quote.begin.markdown', 'punctuation.definition.list.begin.markdown', 'beginning.punctuation.definition.list.markdown', 'beginning.punctuation.definition.quote.markdown'], c.heading),
    rule('Tables and rules', ['punctuation.separator.table.markdown', 'punctuation.definition.table.markdown', 'meta.separator.markdown'], c.punctuation),
    rule('Markup plain text', ['markup.paragraph', 'markup.table', 'markup.list'], c.text),

    // ── Diffs and VCS ───────────────────────────────────────────────────
    rule('Inserted', ['markup.inserted', 'markup.inserted punctuation.definition.inserted'], st.added),
    rule('Deleted', ['markup.deleted', 'markup.deleted punctuation.definition.deleted'], st.deleted),
    rule('Changed', ['markup.changed', 'markup.changed punctuation.definition.changed'], c.type),
    rule('Diff headers', ['meta.diff.header', 'meta.diff.header.from-file', 'meta.diff.header.to-file', 'meta.diff.index', 'punctuation.definition.from-file', 'punctuation.definition.to-file'], c.namespace),
    rule('Diff ranges', ['meta.diff.range', 'punctuation.definition.range.diff'], c.keyword),

    // ── Language corrections ────────────────────────────────────────────
    // TypeScript / JavaScript: built-ins that semantic highlighting treats as
    // plain identifiers. Matching here keeps colors stable when the language
    // server finishes loading.
    rule(
      'JS built-ins that behave like identifiers',
      scriptScopes(['support.class.console', 'support.variable.dom', 'support.variable.object.process', 'support.variable.object.node', 'support.constant.math', 'support.constant.json', 'support.constant.property.math', 'support.variable']),
      c.text,
    ),
    // Constructable built-ins (Date, Object, Promise…) become class.defaultLibrary.
    rule('JS built-in classes', scriptScopes(['support.class.builtin', 'support.class.promise', 'support.class.error']), c.typeSoft),
    rule('Constructor calls', ['new.expr entity.name.function', 'new.expr entity.name.type', 'meta.function-call.constructor'], c.type),
    rule('JSX attribute assignment', scriptScopes(['meta.tag keyword.operator.assignment']), c.tagPunctuation),

    rule('Import-all star', ['constant.language.import-export-all'], c.operator),

    // Python
    rule('Python exceptions and builtin classes', ['support.type.exception.python'], c.type),

    // Java: type references are scoped storage.type.java
    rule('Java types', ['storage.type.java', 'storage.type.object.array.java'], c.type),
    rule('Java var', ['storage.type.local.java'], c.keyword),
    rule('Javadoc delimiters', ['comment.block.javadoc punctuation.definition.comment'], c.docComment, 'italic'),

    // C#: XML documentation tags stay inside the comment's voice
    rule('XML doc tags', ['comment.block.documentation entity.name.tag', 'comment.block.documentation entity.other.attribute-name'], c.docTag, 'italic'),
    rule('XML doc punctuation', ['comment.block.documentation punctuation.definition.tag'], c.docComment, 'italic'),

    // Shell
    rule('Shell commands', ['entity.name.command', 'entity.name.function.call.shell', 'support.function.builtin.shell'], c.function),
    rule('Shell arguments', ['string.unquoted.argument.shell', 'string.unquoted.shell'], c.text),
    rule('Shell variables', ['variable.other.normal.shell', 'variable.other.special.shell', 'variable.other.positional.shell', 'variable.parameter.positional.shell', 'variable.other.bracket.shell', 'punctuation.definition.variable.shell', 'variable.language.special.shell'], c.constant),
    rule('Shell options', ['constant.other.option', 'string.unquoted.argument constant.other.option'], c.number),

    // PHP
    rule('PHP variables keep their $', ['punctuation.definition.variable.php'], c.text),

    // SQL
    rule('SQL schemas and aliases', ['constant.other.database-name.sql'], c.namespace),
    rule('SQL tables and columns', ['constant.other.table-name.sql'], c.text),

    // Rust
    rule('Rust attributes', ['meta.attribute.rust', 'punctuation.definition.attribute.rust'], c.tagPunctuation),
    rule('Rust lifetimes', ['entity.name.type.lifetime', 'punctuation.definition.lifetime', 'storage.modifier.lifetime'], c.typeSoft),
    rule('Rust Option and Result variants', ['entity.name.type.option.rust', 'entity.name.type.result.rust'], c.constant),

    // Go
    rule('Go packages', ['entity.name.package.go', 'entity.name.type.package.go'], c.namespace),
    rule('Go import paths', ['entity.name.import.go'], c.string),
    rule('Go type keyword', ['keyword.type.go'], c.keyword),

    // ── Invalid ─────────────────────────────────────────────────────────
    rule('Invalid', ['invalid', 'invalid.illegal'], p.state.error),
    rule('Deprecated', ['invalid.deprecated'], t.secondary, 'strikethrough'),
  ];
}
