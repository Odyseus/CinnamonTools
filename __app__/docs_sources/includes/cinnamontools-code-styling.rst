
Code styling/guidelines
=======================


CSS/SASS
--------

1. CSS files that where generated from SASS sources are exempt from any styling rules. Trying to configure the output of SASS generated files is like trying to teach to talk to a rock!!! ¬¬
2. Styling rules for CSS files:

     a) 4 spaces indentation.
     b) Open bracket same line as rule.
     c) Space before open bracket.
     d) Closing bracket on its own line at the start of last line of rule.
     e) One selector per line.
     f) Use hexadecimal colors unless alpha is needed.
     g) Space after ``:`` of each declaration.
     h) Each declaration on its own line.
     i) All declarations ending with semi-colon. NO EXCEPTIONS.
     j) Comma-separated property values should include a space after each comma.
     k) Spaces after commas within rgba(), hsla(), or rect() values. If I couldn't read a the freaking parenthesis, I would go and program some garbage in C-sharp!!!
     l) Prefix property values or color parameters with a leading zero (e.g., 0.5 instead of .5 and -0.5px instead of -.5px).
     m) Do not specify units for zero values, e.g., ``margin: 0;`` instead of ``margin: 0px;``.

2. Styling rules for SASS files:

     a) Same as CSS files.
     b) For the rest, don't even bother. Follow the rules forced by the *code formatter* in use...until it breaks due to an update that introduced *new features*. Then follow the rules forced by default by the following *code formatter* that works. It is absolutely pointless to rely on anything that it is based on web technologies and designed for and/or by web developers (in the span of just six weeks it will be broken again). ¬¬


JavaScript
----------

This is an abhorrent/always-evolving/never-finished language with an abhorrent release cycle whose only goal seems to be the destruction of software development (cursed the day that web developers started contaminating the software industry!!!). Guidelines will never have a chance to survive the countless stupid implementations by the countless JS engines.

1. Until the *geniuses* at Mozilla and/or Gnome decide to FINALLY agree in a common AND unique implementation of JS classes, KEEP using *prototypes*.
2. To avoid strict warnings triggered by SpiderMonkey:

    a) Define all symbols that are meant to be exported with **var**. Use **let** or **const** to define symbols that are going to be used only at a module context.
    b) All properties should be defined.

3. Code styling:

    a) Imports defined with PascalCase whether they are defined with **let**, **var** or **const**.
    b) Constants defined with uppercase and low dashes.
    c) Variables/Functions defined with camelCase.
    d) Spaces around operators ( = + - \* / ), and after commas.
    e) 4 spaces for indentation of code blocks.
    f) End simple statements with a semicolon.
    g) Rules for complex (compound) statements:

         0. Put opening bracket at the end of the first line.
         1. Use one space before the opening bracket.
         2. Put closing bracket on a new line, without leading spaces.
         3. Do not end complex statement with a semicolon.
         4. Always use brackets, no exceptions.

    h) General rules for object definitions:

        0. Place the opening bracket on the same line as the object name.
        1. Use colon plus one space between each property and its value.
        2. Use quotes around string values, not around numeric values.
        3. Do not add a comma after the last property-value pair.
        4. Place the closing bracket on a new line, without leading spaces.
        5. Always end an object definition with a semicolon.


Python
------

1. THERE IS ONLY PYTHON 3!!! NOTHING ELSE EXISTS!!!
2. The minimum Python 3 version supported is the one shipped with Ubuntu LTS versions until EOL.
3. The maximum Python 3 version supported is the one considered by Python developers as stable.
4. THERE IS ONLY PYTHON 3!!! NOTHING ELSE EXISTS!!!
5. REPEAT PREVIOUS UNTIL THE END OF TIMES!!!

