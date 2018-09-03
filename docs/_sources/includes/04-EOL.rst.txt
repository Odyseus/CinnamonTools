
*************************************
:abbr:`EOL (end-of-life)` ideas/plans
*************************************

- Linux Mint 18.x/Ubuntu 16.04.x :abbr:`EOL (end-of-life)` is 2021.
- Remove all retro-compatible code from all xlets. They all are marked with the string *Mark for deletion on EOL*.
- Avoid at all cost to make xlets **multiversion**. I already went through that path. It wasn't pretty all the nonsense that I had to endure.
- Convert all JavaScript code into ECMAScript 2015 syntax. By 2021, I might get used to that annoyance. LOL

    + **Step 1 (Done):** Eradicate the use of the **Lang** Cjs module in favor of arrow/standard functions.
    + **Step 2 (Done):** Convert all functions (that can be converted) to arrow functions.

- Remove all ``try{}catch{}`` blocks on xlets ``_init`` methods. Newer versions of Cinnamon already uses these code blocks to wrap xlets initialization. Keep an eye on it in case that they decide to change this yet again.
