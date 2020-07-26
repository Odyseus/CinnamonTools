#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Custom initialization and overrides for the mistune module.

..note:

    **Markdown parser additions/overrides**:

    - Added support for ``kbd`` tag. ``[[Ctrl]]`` will render as ``<kbd>Ctrl</kbd>``.
    - Added **table** and **table-bordered** classes to the ``<table>`` HTML tag.
    - Added **blockquote** class to the ``<blockquote>`` HTML tag.
"""
import re

from .mistune import InlineLexer
from .mistune import Markdown
from .mistune import Renderer


class MistuneCustomRenderer(Renderer):
    """Mistune custom renderer.
    """

    def kbd_tag(self, text):
        """<kbd> HTML tag.

        Parameters
        ----------
        text : str
            <kbd> HTML tag content.

        Returns
        -------
        str
            HTML text.
        """
        return "<kbd>%s</kbd>" % text

    def block_quote(self, text):
        """Rendering <blockquote> with the given text.

        Override ``mistune.Renderer.block_quote`` to add the **blockquote** Bootstrap class.

        Parameters
        ----------
        text : str
            <blockquote> HTML tag content.

        Returns
        -------
        str
            HTML text.
        """
        return '<blockquote class="blockquote">%s\n</blockquote>\n' % text.rstrip('\n')

    def table(self, header, body):
        """Rendering table element. Wrap header and body in it.

        Override ``mistune.Renderer.table`` to add the **table** and **table-bordered**
        Bootstrap classes.

        Parameters
        ----------
        header : str
            <thead> HTML tag content.
        body : str
            <tbody> HTML tag content.

        Returns
        -------
        str
            HTML text.
        """
        return (
            '<table class="table table-bordered">\n<thead>%s</thead>\n'
            '<tbody>\n%s</tbody>\n</table>\n'
        ) % (header, body)


class MistuneCustomInlineLexer(InlineLexer):
    """Mistune custom inline lexer.
    """

    def enable_kbd_tag(self):
        """Enable <kbd> HTML tag rules.
        """
        self.rules.kbd_tag = re.compile(r'^\[\[(?=\S)([\s\S]*?\S)\]\]')  # [[Keyboard key]]

        self.default_rules.insert(3, "kbd_tag")

    def output_kbd_tag(self, m):
        """Generate <kbd> HTML tag output.

        Parameters
        ----------
        m : object
            Match object.

        Returns
        -------
        str
            Parsed HTML string.
        """
        text = self.output(m.group(1))
        return self.renderer.kbd_tag(text)


_mistune_renderer = MistuneCustomRenderer()
_mistune_inline_lexer = MistuneCustomInlineLexer(_mistune_renderer)

# Enable new feature/s.
_mistune_inline_lexer.enable_kbd_tag()


def md(text, escape=True, **kwargs):
    """Render markdown formatted text to html.

    Parameters
    ----------
    text : str
        Markdown string to parse into HTML.
    escape : bool, optional
        If set to False, all HTML tags will not be escaped.
    **kwargs
        Extra keyword arguments.

    Returns
    -------
    str
        HTML string.
    """
    return Markdown(renderer=_mistune_renderer,
                    inline=_mistune_inline_lexer,
                    escape=escape, **kwargs)(text)


if __name__ == "__main__":
    pass
