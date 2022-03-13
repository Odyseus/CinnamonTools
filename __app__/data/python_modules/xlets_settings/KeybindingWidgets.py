#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Keybinding widgets.

Attributes
----------
FORBIDDEN_KEYVALS : list
    Forbidden key values.
"""
import gettext
import gi

gi.require_version("Gdk", "3.0")
gi.require_version("Gtk", "3.0")

from gi.repository import GObject
from gi.repository import Gdk
from gi.repository import Gtk

from .common import display_message_dialog
from .common import get_keybinding_display_name

# NOTE: All translatable strings used in this module are available in Cinnamon.
# Keep it that way.
gettext.install("cinnamon", "/usr/share/locale")
_ = gettext.gettext

FORBIDDEN_KEYVALS = [
    Gdk.KEY_Home,
    Gdk.KEY_Left,
    Gdk.KEY_Up,
    Gdk.KEY_Right,
    Gdk.KEY_Down,
    Gdk.KEY_Page_Up,
    Gdk.KEY_Page_Down,
    Gdk.KEY_End,
    Gdk.KEY_Tab,
    Gdk.KEY_Return,
    Gdk.KEY_space,
    Gdk.KEY_Mode_switch,
    Gdk.KEY_KP_0,  # numerics currently are recogized only as _End, _Down, etc.. with or without numlock
    Gdk.KEY_KP_1,  # Gdk checks numlock and parses out the correct key, but this could change, so list
    # these numerics anyhow. (This may differ depending on kb layouts, locales, etc.. but
    Gdk.KEY_KP_2,
    Gdk.KEY_KP_3,  # I didn't thoroughly check.)
    Gdk.KEY_KP_4,
    Gdk.KEY_KP_5,
    Gdk.KEY_KP_6,
    Gdk.KEY_KP_7,
    Gdk.KEY_KP_8,
    Gdk.KEY_KP_9,
    Gdk.KEY_KP_End,
    Gdk.KEY_KP_Down,
    Gdk.KEY_KP_Next,
    Gdk.KEY_KP_Left,
    Gdk.KEY_KP_Begin,
    Gdk.KEY_KP_Right,
    Gdk.KEY_KP_Home,
    Gdk.KEY_KP_Up,
    Gdk.KEY_KP_Prior,
    Gdk.KEY_KP_Insert,
    Gdk.KEY_KP_Delete,
    Gdk.KEY_KP_Add,
    Gdk.KEY_KP_Subtract,
    Gdk.KEY_KP_Multiply,
    Gdk.KEY_KP_Divide,
    Gdk.KEY_KP_Enter,
    Gdk.KEY_Num_Lock
]


class ButtonKeybinding(Gtk.TreeView):
    """Button keybinding.

    Attributes
    ----------
    accel_string : str
        The widget value.
    entry_store : Gtk.ListStore
        The ``Gtk.ListStore`` for ``self``.
    keybinding_cell : CellRendererKeybinding
        The widget that will display the stored keybinding.
    """
    __gsignals__ = {
        "accel-edited": (GObject.SignalFlags.RUN_LAST, None, (str, str)),
        "accel-cleared": (GObject.SignalFlags.RUN_LAST, None, ())
    }

    __gproperties__ = {
        "accel-string": (str,
                         "accelerator string",
                         "Parseable accelerator string",
                         None,
                         GObject.ParamFlags.READWRITE)
    }

    def __init__(self):
        """Initialization.
        """
        super().__init__()

        self.set_headers_visible(False)
        self.set_enable_search(False)
        self.set_hover_selection(True)
        self.set_tooltip_text(CellRendererKeybinding.TOOLTIP_TEXT)

        self.entry_store = None
        self.accel_string = ""
        self.keybinding_cell = CellRendererKeybinding(a_widget=self)
        self.keybinding_cell.set_alignment(.5, .5)
        self.keybinding_cell.connect("accel-edited", self.on_cell_edited)
        self.keybinding_cell.connect("accel-cleared", self.on_cell_cleared)

        col = Gtk.TreeViewColumn("binding", self.keybinding_cell, accel_string=0)
        col.set_alignment(.5)

        self.append_column(col)

        self.keybinding_cell.set_property("editable", True)

        self.load_model()

        self.connect("focus-out-event", self.on_focus_lost)

    def on_cell_edited(self, cell, path, accel_string, accel_label):
        """On cell edited.

        Parameters
        ----------
        cell : CellRendererKeybinding
            The object which received the signal.
        path : Gtk.TreePath
            String representation of :py:class:`Gtk.TreePath` describing the event location.
        accel_string : str
            The widget value.
        accel_label : str
            The widget display value.
        """
        self.accel_string = accel_string
        self.emit("accel-edited", accel_string, accel_label)
        self.load_model()

    def on_cell_cleared(self, cell, path):
        """On cell cleared.

        Parameters
        ----------
        cell : CellRendererKeybinding
            The object which received the signal.
        path : Gtk.TreePath
            String representation of :py:class:`Gtk.TreePath` describing the event location.
        """
        self.accel_string = ""
        self.emit("accel-cleared")
        self.load_model()

    def on_focus_lost(self, widget, event):
        """On focus lost-

        Parameters
        ----------
        widget : ButtonKeybinding
            The object which received the signal.
        event : Gdk.EventFocus
            The ``Gdk.EventFocus`` which triggered this signal.
        """
        self.get_selection().unselect_all()

    def load_model(self):
        """Load model.
        """
        if self.entry_store:
            self.entry_store.clear()

        self.entry_store = Gtk.ListStore(str)  # Accel string
        self.entry_store.append((self.accel_string,))

        self.set_model(self.entry_store)

    def do_get_property(self, prop):
        """Get property override.

        Parameters
        ----------
        prop : str
            The property to handle.

        Returns
        -------
        str
            The accel. string.

        Raises
        ------
        AttributeError
            Wrong attribute.
        """
        if prop.name == "accel-string":
            return self.accel_string
        else:
            raise AttributeError(f"Unknown property {prop.name}")

    def do_set_property(self, prop, value):
        """Set property override.

        Parameters
        ----------
        prop : str
            The property to handle.
        value : str
            The property value.

        Raises
        ------
        AttributeError
            Wrong attribute.
        """
        if prop.name == "accel-string":
            if value != self.accel_string:
                self.accel_string = value
                self.keybinding_cell.set_value(value)
        else:
            raise AttributeError(f"Unknown property {prop.name}")

    def get_accel_string(self):
        """Get accel. string.

        Returns
        -------
        str
            The accel. string.
        """
        return self.accel_string

    def set_accel_string(self, accel_string):
        """Set accel. string.

        Parameters
        ----------
        accel_string : str
            The accel. string.
        """
        self.accel_string = accel_string
        self.load_model()


GObject.type_register(ButtonKeybinding)


class CellRendererKeybinding(Gtk.CellRendererText):
    """Cell renderer keybinding.

    Attributes
    ----------
    a_widget : ButtonKeybinding
        This widget container.
    accel_editable : Gtk.CellEditable
        The ``Gtk.CellEditable`` for the widget.
    accel_string : str
        The accel. string.
    focus_id : int
        Storage for the ``focus-out-event`` signal connection.
    keyboard : Gdk.InputSource
        The device from which to grab events.
    path : Gtk.TreePath
        String representation of :py:class:`Gtk.TreePath` describing the event location.
    press_event : Gdk.Event
        Press event storage.
    press_event_id : int
        Storage for the ``key-press-event`` signal connection.
    release_event_id : int
        Storage for the ``key-release-event`` signal connection.
    teaching : bool
        *Flag* used to know when this widget is in *keyboard capture mode*.
    TOOLTIP_TEXT : str
        Tooltip text for the button that will contain this widget.
    """
    __gsignals__ = {
        "accel-edited": (GObject.SignalFlags.RUN_LAST, None, (str, str, str)),
        "accel-cleared": (GObject.SignalFlags.RUN_LAST, None, (str,))
    }

    __gproperties__ = {
        "accel-string": (str,
                         "accelerator string",
                         "Parseable accelerator string",
                         None,
                         GObject.ParamFlags.READWRITE)
    }

    TOOLTIP_TEXT = "%s\n%s\n%s" % (_("Click to set a new accelerator key."),
                                   _("Press Escape or click again to cancel the operation."),
                                   _("Press Backspace to clear the existing keybinding."))

    def __init__(self, a_widget, accel_string=None):
        """Initialization.

        Parameters
        ----------
        a_widget : ButtonKeybinding
            This widget container.
        accel_string : None, optional
            The accel. string.
        """
        super().__init__()
        self.connect("editing-started", self.editing_started)
        self.release_event_id = 0
        self.press_event_id = 0
        self.focus_id = 0

        self.a_widget = a_widget
        self.accel_string = accel_string

        self.path = None
        self.press_event = None
        self.teaching = False

        self.update_label()

    def do_get_property(self, prop):
        """Get property override.

        Parameters
        ----------
        prop : str
            The property to handle.

        Returns
        -------
        str
            The accel. string.

        Raises
        ------
        AttributeError
            Wrong attribute.
        """
        if prop.name == "accel-string":
            return self.accel_string
        else:
            raise AttributeError(f"Unknown property {prop.name}")

    def do_set_property(self, prop, value):
        """Set property override.

        Parameters
        ----------
        prop : str
            The property to handle.
        value : str
            The property value.

        Raises
        ------
        AttributeError
            Wrong attribute.
        """
        if prop.name == "accel-string":
            if value != self.accel_string:
                self.accel_string = value
                self.update_label()
        else:
            raise AttributeError(f"Unknown property {prop.name}")

    def update_label(self):
        """Update widget label.
        """
        text = _("unassigned")

        if self.accel_string:
            text = get_keybinding_display_name(self.accel_string)

        self.set_property("text", text)

    def set_value(self, accel_string=None):
        """Set widget value.

        Parameters
        ----------
        accel_string : None, optional
            The accel. string.
        """
        self.set_property("accel-string", accel_string)

    def editing_started(self, renderer, editable, path):
        """Cell editing started.

        Parameters
        ----------
        renderer : CellRendererKeybinding
            The object which received the signal.
        editable : Gtk.CellEditable
            The ``Gtk.CellEditable``.
        path : str
            The path identifying the edited cell.
        """
        if not self.teaching:
            self.path = path
            device = Gtk.get_current_event_device()
            if device.get_source() == Gdk.InputSource.KEYBOARD:
                self.keyboard = device
            else:
                self.keyboard = device.get_associated_device()

            self.keyboard.grab(self.a_widget.get_window(), Gdk.GrabOwnership.WINDOW, False,
                               Gdk.EventMask.KEY_PRESS_MASK | Gdk.EventMask.KEY_RELEASE_MASK,
                               None, Gdk.CURRENT_TIME)

            editable.set_text(_("Pick an accelerator"))
            # NOTE: Set to expand horizontally because in certain versions of GTK
            # the unbelievable idiotic editable Gtk.Entry inside the Gtk.CellRendererText
            # can't decide where the frak to place itself! ¬¬
            # So, expand it so the freaking text can be seen!!!!!!!
            editable.set_hexpand(True)
            self.accel_editable = editable

            # Mark for deletion on EOL. Gtk4
            # Use Gtk.EventControllerKey instead of key-press-event and key-release-event.
            self.release_event_id = self.accel_editable.connect(
                "key-release-event", self.on_key_release)
            self.press_event_id = self.accel_editable.connect("key-press-event", self.on_key_press)
            # Mark for deletion on EOL. Gtk4
            # Use Gtk.EventControllerFocus instead of focus-out-event.
            self.focus_id = self.accel_editable.connect("focus-out-event", self.on_focus_out)
            self.teaching = True
        else:
            self.ungrab()
            self.update_label()
            self.teaching = False

    def on_focus_out(self, *args):
        """On focus out callback.

        Parameters
        ----------
        *args
            Arguments.
        """
        self.teaching = False
        self.ungrab()

    def on_key_press(self, widget, event):
        """On key press callback.

        Parameters
        ----------
        widget : Gtk.CellEditable
            The ``Gtk.CellEditable`` for the widget.
        event : Gdk.EventKey
            The ``Gdk.EventKey`` which triggered this signal.

        Returns
        -------
        bool
            Whether to propagate the event or not.
        """
        if self.teaching:
            self.press_event = event.copy()
            return Gdk.EVENT_STOP

        return Gdk.EVENT_PROPAGATE

    def on_key_release(self, widget, event):
        """On key release callback.

        Parameters
        ----------
        widget : Gtk.CellEditable
            The ``Gtk.CellEditable`` for the widget.
        event : Gdk.EventKey
            The ``Gdk.EventKey`` which triggered this signal.

        Returns
        -------
        bool
            Whether to propagate the event or not.
        """
        if self.press_event is not None:
            self.ungrab()

        self.teaching = False
        event = self.press_event or event

        display = widget.get_display()

        keyval = 0
        group = event.group
        accel_mods = event.state

        # HACK: we don't want to use SysRq as a keybinding (but we do
        # want Alt+Print), so we avoid translation from Alt+Print to SysRq

        if event.keyval == Gdk.KEY_Sys_Req and \
           ((accel_mods & Gdk.ModifierType.MOD1_MASK) != 0):
            keyval = Gdk.KEY_Print
            consumed_modifiers = 0
        else:
            keymap = Gdk.Keymap.get_for_display(display)
            shift_group_mask = 0

            shift_group_mask = keymap.get_modifier_mask(Gdk.ModifierIntent.SHIFT_GROUP)

            retval, keyval, effective_group, level, consumed_modifiers = \
                keymap.translate_keyboard_state(event.hardware_keycode, accel_mods, group)

            if consumed_modifiers:
                consumed_modifiers &= ~shift_group_mask

        accel_key = Gdk.keyval_to_lower(keyval)
        if accel_key == Gdk.KEY_ISO_Left_Tab:
            accel_key = Gdk.KEY_Tab

        accel_mods &= Gtk.accelerator_get_default_mod_mask()

        if accel_mods == 0:
            if accel_key == Gdk.KEY_Escape:
                self.update_label()
                self.teaching = False
                self.path = None
                self.press_event = None
                return Gdk.EVENT_STOP
            elif accel_key == Gdk.KEY_BackSpace:
                self.teaching = False
                self.press_event = None
                self.set_value(None)
                self.emit("accel-cleared", self.path)
                self.path = None
                return Gdk.EVENT_STOP
            elif accel_key == Gdk.KEY_Return or accel_key == Gdk.KEY_KP_Enter or accel_key == Gdk.KEY_space:
                return Gdk.EVENT_STOP

        accel_string = Gtk.accelerator_name_with_keycode(
            None, accel_key, event.hardware_keycode, Gdk.ModifierType(accel_mods))
        accel_label = Gtk.accelerator_get_label_with_keycode(
            None, accel_key, event.hardware_keycode, Gdk.ModifierType(accel_mods))

        # print("accel_mods: %d, keyval: %d, Storing %s as %s" % (accel_mods, keyval, accel_label, accel_string))

        if (accel_mods == 0 or accel_mods == Gdk.ModifierType.SHIFT_MASK) and event.hardware_keycode != 0:
            if ((keyval >= Gdk.KEY_a and keyval <= Gdk.KEY_z) or
                (keyval >= Gdk.KEY_A and keyval <= Gdk.KEY_Z) or
                (keyval >= Gdk.KEY_0 and keyval <= Gdk.KEY_9) or
                (keyval >= Gdk.KEY_kana_fullstop and keyval <= Gdk.KEY_semivoicedsound) or
                (keyval >= Gdk.KEY_Arabic_comma and keyval <= Gdk.KEY_Arabic_sukun) or
                (keyval >= Gdk.KEY_Serbian_dje and keyval <= Gdk.KEY_Cyrillic_HARDSIGN) or
                (keyval >= Gdk.KEY_Greek_ALPHAaccent and keyval <= Gdk.KEY_Greek_omega) or
                (keyval >= Gdk.KEY_hebrew_doublelowline and keyval <= Gdk.KEY_hebrew_taf) or
                (keyval >= Gdk.KEY_Thai_kokai and keyval <= Gdk.KEY_Thai_lekkao) or
                (keyval >= Gdk.KEY_Hangul and keyval <= Gdk.KEY_Hangul_Special) or
                (keyval >= Gdk.KEY_Hangul_Kiyeog and keyval <= Gdk.KEY_Hangul_J_YeorinHieuh) or
                    keyval in FORBIDDEN_KEYVALS):
                msg = _(
                    "\nThis key combination, \'<b>%s</b>\' cannot be used because it would become impossible to type using this key.\n\n")
                msg += _("Please try again with a modifier key such as Control, Alt or Super (Windows key) at the same time.\n")
                display_message_dialog(self.a_widget, "", msg, "error")

                return Gdk.EVENT_STOP

        self.press_event = None
        self.set_value(accel_string)
        self.emit("accel-edited", self.path, accel_string, accel_label)
        self.path = None

        return Gdk.EVENT_STOP

    def ungrab(self):
        """Clean up events.
        """
        self.keyboard.ungrab(Gdk.CURRENT_TIME)
        if self.release_event_id > 0:
            self.accel_editable.disconnect(self.release_event_id)
            self.release_event_id = 0
        if self.press_event_id > 0:
            self.accel_editable.disconnect(self.press_event_id)
            self.press_event_id = 0
        if self.focus_id > 0:
            self.accel_editable.disconnect(self.focus_id)
            self.focus_id = 0
        try:
            self.accel_editable.editing_done()
            self.accel_editable.remove_widget()
        except Exception:
            pass


GObject.type_register(CellRendererKeybinding)


if __name__ == "__main__":
    pass
