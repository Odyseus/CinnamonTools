#!/usr/bin/python3
# -*- coding: utf-8 -*-

# These are convenience variables to store reusable data.
selected_bg_color = "#398ee7"
warning_color = "#fdde76"
error_color = "#cc0000"
link_color = "#0000ee"

# For this file to be usable, the settings variable should be declared and
# all data inside the settings dictionary is mandatory.
settings = {
    # The following 4 keys are used when parsing the Cinnamon theme Sass files.
    "selected_bg_color": selected_bg_color,
    "warning_color": warning_color,
    "error_color": error_color,
    "link_color": link_color,
    # This replacement data is used at themes build time to perform string substitutions.
    "replacement_data": [
        # Selected background color. Used by all themes.
        # This is basically the primary accent color.
        ("@selected_bg_color@", selected_bg_color),
        # Color that represents an HTML link. Used by all themes.
        ("@link_color@", link_color),
        # Color that represents information. Used by GTK3 theme.
        ("@info_color@", selected_bg_color),
        # Color that represents a question. Used by GTK3 theme.
        ("@question_color@", "#55c1ec"),
        # Color that represents a warning. Used by Cinnamon and GTK3 themes.
        ("@warning_color@", warning_color),
        # Color that represents an error. Used by Cinnamon and GTK3 themes.
        ("@error_color@", error_color),
        # Color that represents success. Used by GTK3 theme.
        ("@success_color@", "#4e9a06"),
        # Gradient colors for the image gtk-2.0/images/treeview/iconview-selected.svg
        ("@gradient_iconview_selected_1@", selected_bg_color),
        ("@gradient_iconview_selected_2@", "#3477bc"),
        # Gradient colors for the image gtk-2.0/images/treeview/progress-bar.svg
        ("@gradient_progress_bar_1@", selected_bg_color),
        ("@gradient_progress_bar_2@", "#3477bc"),
        # Gradient colors for the image gtk-2.0/images/treeview/row-selected.svg
        ("@gradient_row_selected_1@", selected_bg_color),
        ("@gradient_row_selected_2@", "#3477bc"),
        # Color for the image cinnamon/assets/switch-on.svg
        ("@gradient_switch_on@", selected_bg_color)
    ]
}
