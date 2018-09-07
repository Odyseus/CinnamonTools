
## Python modules used in different projects

### Third party modules

- **docopt:** Slightly modified version of the [docopt](https://github.com/docopt/docopt) Python module.
    - Print help "headers" in bold.
    - Re-declared some strings as raw strings (``r"..."``) to avoid some invalid escape sequence linter warnings.
- **menu:** Slightly modified version of the [Menu](https://pypi.python.org/pypi/Menu) Python module to easily create CLI menus.
    - Changed some default values to suit my needs.
    - Some aesthetic changes for better readability of the menu items on the screen.
    - This modified version doesn't clear the screen every time a menu is opened.
- **mistune:** This [Python module](https://github.com/lepture/mistune) is a markdown parser in pure Python with renderer feature..
    - Modified to add support for keyboard keys (`kbd` HTML tags). `[[Key]]` will render as `<kbd>Key</kbd>`.
- **multi_select:** Slightly modified version of the [picker](https://github.com/MSchuwalow/picker) Python module.
- **polib:** [polib](https://bitbucket.org/izi/polib) is a library to manipulate, create and modify `gettext` files (pot, po and mo files).
- **pyperclip:** [Pyperclip](https://github.com/asweigart/pyperclip) is a cross-platform Python module for copy and paste clipboard functions.
- **pyuca:** This [Python module](https://github.com/jtauber/pyuca) is used to allow the correct sorting of strings with Unicode characters.
- **tqdm:** [tqdm](https://pypi.python.org/pypi/tqdm) is a fast and extensible progress bar for Python and CLI.
