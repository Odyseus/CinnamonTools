#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sphinx

from docutils import nodes
from docutils.parsers.rst import Directive
from sphinx.util.nodes import set_source_info


class CustomLiteralInclude(Directive):
    """Simplified literalinclude directive.

    Just like ``.. literalinclude:: /path/to/file``, but without having to be bothered with line
    numbers and the like.
    """

    has_content = False
    required_arguments = 1
    optional_arguments = 0
    final_argument_whitespace = True

    def run(self):
        document = self.state.document
        env = document.settings.env

        try:
            text = env.config.docopt_doc_literalinclude_docstrings[self.arguments[0]]
            retnode = nodes.literal_block(text, text)
            set_source_info(self, retnode)
            retnode['classes'] += self.options.get('class', [])
            self.add_name(retnode)

            return [retnode]
        except Exception as exc:
            return [document.reporter.warning(str(exc), line=self.lineno)]


def setup(app):
    app.add_config_value("docopt_doc_literalinclude_docstrings", {}, "html")
    app.add_directive("docopt-doc-literalinclude", CustomLiteralInclude)

    return {"version": sphinx.__display_version__, "parallel_read_safe": True}
