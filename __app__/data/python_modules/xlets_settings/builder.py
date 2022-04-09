# -*- coding: utf-8 -*-
"""Settings page definitions builder.

I created this module for several reasons.

- I fed up of creating the definitions in their "raw" form using Python dictionaries.
- Autocompletions. When creating definitions in their "raw" form, I was constantly searching the \
source code for the correct property names. By using the Python classes in this module I have at \
my finger tips the autocompletions of their properties/arguments.
- Documentation. It's easier to create and maintain the documentation of a Python module than \
creating/maintaining a ResTructuredText file "by hand".

Attributes
----------
ASTERISK_END : str
    Call attention with an asterix placed at the end of a frase.
ASTERISK_START : str
    Call attention with an asterix placed at the start of a frase.
CINN_RESTART : str
    Label to inform that Cinnamon needs to be restarted.
CINN_RESTART_MIGHT : str
    Label to inform that Cinnamon might need to be restarted.
CIRCLE : str
    Character used as list definition.
LOGGING_LEVEL_TOOLTIP : str
    Tooltip for the logging level chooser combobox.

NOTES
- Using typing for the first time to get used to it and to see how it affects documentation \
generation. Holding off wide spread utilization because the AutoDocstring plugin that I use \
doesn't extract "annotated attributes".
- Importing ``annotations`` from ``__future__`` allows me to directly use ``tuple[int, int]`` instead \
of being forced to import ``Tuple`` from ``typing`` and use ``Tuple[int, int]``, which is deprecated.
- Using the :py:`dataclasses` module to create cleaner classes and to minimize redundant docstrings.

"""
from __future__ import annotations

from dataclasses import dataclass
from dataclasses import field
from html import escape

from .common import _

CINN_RESTART = f'(*) <i>{escape(_("Cinnamon needs to be restarted"))}</i>'
CINN_RESTART_MIGHT = f'(*) <i>{escape(_("Cinnamon might need to be restarted"))}</i>'
CIRCLE = "<b>⚫</b>"
ASTERISK_END = " (*)"
ASTERISK_START = "(*) "
LOGGING_LEVEL_TOOLTIP = "\n".join([
    _("It enables the ability to log the output of several functions used by the extension."),
    "",
    "%s: %s" % (_("Normal"), _("Only log messages caused by non critical errors.")),
    "%s: %s" % (_("Verbose"), _("Additionally log extra output messages and all HTTP responses.")),
    "%s: %s" % (_("Very verbose"), _(
        "Additionally log all method calls from all JavaScript classes/prototypes along with their execution time."))
])


@dataclass(order=True, frozen=True)
class Widget():
    """Widget definition.
    """
    widget_type: str = ""
    pref_key: str = ""
    widget_kwargs: dict = field(default_factory=dict)
    compatible: bool = True
    schema: str = None


@dataclass(order=True, frozen=True)
class Label():
    """Label definition.
    """
    widget_kwargs: dict = field(default_factory=dict)
    compatible: bool = True
    widget_type: str = "label"
    pref_key: str = ""


@dataclass(order=True, frozen=True)
class ButtonsGroup():
    """Button group definition.
    """
    widget_kwargs: dict = field(default_factory=dict)
    compatible: bool = True
    widget_type: str = "buttonsgroup"
    pref_key: str = ""


@dataclass(order=True, frozen=True)
class Section():
    """Section definition.
    """
    title: str = ""
    subtitle: str = ""
    info: dict = field(default_factory=dict)
    notes: list = field(default_factory=list)
    dependency: str = ""
    compatible: bool = True
    widgets: list[Widget] = field(default_factory=list)

    def add_buttons_group(self, widget_kwargs: dict = {}, compatible: bool = True) -> None:
        """Add buttons group to section.

        Parameters
        ----------
        widget_kwargs : dict, optional
            Widget keyword arguments.
        compatible : bool, optional
            The boolean result of an expresion to decide if a widget/page/section should be created.
        """
        widget = widget_kwargs if isinstance(widget_kwargs, ButtonsGroup) else ButtonsGroup(widget_kwargs=widget_kwargs,
                                                                                            compatible=compatible)
        self.widgets.append(widget)

    def add_label(self, widget_kwargs: dict = {}, compatible: bool = True) -> None:
        """Add label to section.

        Parameters
        ----------
        widget_kwargs : dict, optional
            Widget keyword arguments.
        compatible : bool, optional
            The boolean result of an expresion to decide if a widget/page/section should be created.
        """
        widget = widget_kwargs if isinstance(widget_kwargs, Label) else Label(widget_kwargs=widget_kwargs,
                                                                              compatible=compatible)
        self.widgets.append(widget)

    def add_widget(self, widget_type: tuple[str, Widget], pref_key: str = "",
                   widget_kwargs: dict = {}, compatible: bool = True, schema: str = None) -> None:
        """Add widget to section.

        Parameters
        ----------
        widget_type : tuple[str, Widget]
            Widget type.
        pref_key : str, optional
            Preference key.
        widget_kwargs : dict, optional
            Widget keyword arguments.
        compatible : bool, optional
            The boolean result of an expresion to decide if a widget/page/section should be created.
        schema : str, optional
            A gsettings schema.
        """
        widget = widget_type if isinstance(widget_type, Widget) else Widget(widget_type,
                                                                            pref_key=pref_key,
                                                                            widget_kwargs=widget_kwargs,
                                                                            compatible=compatible,
                                                                            schema=schema)
        self.widgets.append(widget)


@dataclass(order=True, frozen=True)
class Page():
    """Page definition.
    """
    title: str = ""
    compatible: bool = True
    sections: list[Section] = field(default_factory=list)

    def add_section(self, title: tuple[str, Section], **kwargs) -> Section:
        """Add section to page.

        Parameters
        ----------
        title : tuple[str, Section]
            Section title.
        **kwargs
            Section keyword arguments.

        Returns
        -------
        Section
            Section definition.
        """
        section = title if isinstance(title, Section) else Section(title, **kwargs)
        self.sections.append(section)

        return section


@dataclass(order=True, frozen=True)
class WindowDefinition():
    """Window definition.
    """

    pages: list[Page] = field(default_factory=list)

    def add_page(self, title: tuple[str, Page], compatible: bool = True) -> Page:
        """Add page definition to window definition.

        Parameters
        ----------
        title : tuple[str, Page]
            A title for the page that will be displayed in the sidebar.
        compatible : bool, optional
            The boolean result of an expresion to decide if a widget/page/section should be created.

        Returns
        -------
        Page
            Page definition.
        """
        page = title if isinstance(title, Page) else Page(title, compatible=compatible)
        self.pages.append(page)

        return page

    def should_create_page_switcher(self) -> bool:
        """Should the page switcher be created?

        Returns
        -------
        bool
            If the sidebar should be created.
        """
        return len(self.pages) > 1


def get_debugging_section(xlet_type: str, xlet_uuid: str) -> Section:
    """Get debugging section.

    Parameters
    ----------
    xlet_type : str
        Xlet type.
    xlet_uuid : str
        Xlet UUID.

    Returns
    -------
    Section
        The debugging section.
    """
    section = Section(_("Debugging"), notes=[CINN_RESTART])
    section.add_widget("gcombobox", "logging-level", {
        "description": "%s (*)" % _("Logging level"),
        "tooltip": LOGGING_LEVEL_TOOLTIP,
        "options": {
            0: _("Normal"),
            1: _("Verbose"),
            2: _("Very verbose")
        }
    }, schema=f"org.cinnamon.{xlet_type}s.{xlet_uuid}")
    section.add_widget("gswitch", "debugger-enabled", {
        "description": "%s (*)" % _("Enable debugger"),
        "tooltip": _("It enables the ability to catch all exceptions that under normal use would not be caught.")
    }, schema=f"org.cinnamon.{xlet_type}s.{xlet_uuid}")

    return section


if __name__ == "__main__":
    pass
