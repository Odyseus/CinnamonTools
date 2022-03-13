#!/bin/bash

# It would have been impossible to create this without the following post on Stack Exchange!!!
# https://unix.stackexchange.com/a/55622

type "{executable_name}" &> /dev/null &&
_decide_nospace_{current_date}(){
    if [[ ${1} == "--"*"=" ]] ; then
        type "compopt" &> /dev/null && compopt -o nospace
    fi
} &&
_get_xlets_slugs_{current_date}(){
    echo $(cd {full_path_to_app_folder}; ./app.py print_xlets_slugs)
} &&
_get_theme_variants_{current_date}(){
    echo $(cd {full_path_to_app_folder}; ./app.py print_theme_variants)
} &&
__cinnamon_tools_cli_{current_date}(){
    local cur prev cmd xlets_slugs theme_variants
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    case $prev in
        --xlet)
            xlets_slugs=( $(_get_xlets_slugs_{current_date}) )
            COMPREPLY=( $( compgen -W "${xlets_slugs[*]}") )
            return 0
            ;;
        -x)
            xlets_slugs=( $(_get_xlets_slugs_{current_date}) )
            COMPREPLY=( $( compgen -W "${xlets_slugs[*]}" -- ${cur}) )
            return 0
            ;;
        --variant-name)
            theme_variants=( $(_get_theme_variants_{current_date}) )
            COMPREPLY=( $( compgen -W "${theme_variants[*]}") )
            return 0
            ;;
        -v)
            theme_variants=( $(_get_theme_variants_{current_date}) )
            COMPREPLY=( $( compgen -W "${theme_variants[*]}" -- ${cur}) )
            return 0
            ;;
    esac

    # Handle --xxxxxx=
    if [[ ${prev} == "--"* && ${cur} == "=" ]] ; then
        type "compopt" &> /dev/null && compopt -o filenames
        COMPREPLY=(*)
        return 0
    fi

    # Handle --xxxxx=path
    case ${prev} in
        "="|"-o"|"-e")
            # Unescape space
            cur=${cur//\\ / }
            # Expand tilde to $HOME
            [[ ${cur} == "~/"* ]] && cur=${cur/\~/$HOME}
            # Show completion if path exist (and escape spaces)
            type "compopt" &> /dev/null && compopt -o filenames
            local files=("${cur}"*)
            [[ -e ${files[0]} ]] && COMPREPLY=( "${files[@]// /\ }" )
            return 0
        ;;
    esac

    if [[ ${prev} == "=" ]] ; then
        if [[ ${cur} != *"/"* ]]; then
            xlets_slugs=( $(_get_xlets_slugs_{current_date}) )
            COMPREPLY=( $( compgen -W "${xlets_slugs[*]}" -- ${cur}) )
            return 0
        fi
    fi

    # Completion of commands.
    if [[ $COMP_CWORD == 1 ]]; then
        COMPREPLY=( $(compgen -W \
            "-h --help --version --manual -r --restart-cinnamon menu build_xlets build_themes \
dev_xlets dev_themes generate print_xlets_slugs print_theme_variants repo" -- "${cur}") )
        return 0
    fi

    # Completion of options and sub-commands.
    cmd="${COMP_WORDS[1]}"

    case $cmd in
    "repo")
        COMPREPLY=( $(compgen -W \
            "submodules subtrees" -- "${cur}") )
        ;;
    "generate")
        COMPREPLY=( $(compgen -W \
            "system_executable docs docs_no_api base_xlet repo_changelog themes_changelog \
all_changelogs" -- "${cur}") )
        ;;
    "build_xlets")
        COMPREPLY=( $(compgen -W \
            "-x --xlet-name= -d --domain= -o --output= -e --extra-files= -i --install-localizations \
-n --no-confirmation -r --restart-cinnamon" -- "${cur}") )
        _decide_nospace_{current_date} ${COMPREPLY[0]}
        ;;
    "build_themes")
        COMPREPLY=( $(compgen -W \
            "-t --theme-name= -v --variant-name= -o --output= -n --no-confirmation -r \
--restart-cinnamon" -- "${cur}") )
        _decide_nospace_{current_date} ${COMPREPLY[0]}
        ;;
    "dev_xlets")
        COMPREPLY=( $(compgen -W \
            "-x --xlet-name= generate_meta_file update_pot_files update_spanish_localizations \
create_xlets_changelogs create_localized_help generate_trans_stats check_js_modules" -- "${cur}") )
        ;;
    "dev_themes")
        COMPREPLY=( $(compgen -W \
            "-v --variant-name= generate_gtk_sass_includes_index parse_sass \
generate_thumbnails" -- "${cur}") )
        ;;
    esac

    # Completion of options and sub-commands.
    cmd="${COMP_WORDS[2]}"

    case $cmd in
    "docs"|"docs_no_api")
        COMPREPLY=( $(compgen -W "-f --force-clean-build -u --update-inventories" -- "${cur}") )
        ;;
    "submodules"|"subtrees")
        COMPREPLY=( $(compgen -W "init update" -- "${cur}") )
        ;;
    "parse_sass"|"generate_thumbnails")
        COMPREPLY=( $(compgen -W "-v --variant-name= -s --sass-parser=" -- "${cur}") )
        _decide_nospace_{current_date} ${COMPREPLY[0]}
        ;;
    esac

    return 0
} &&
complete -F __cinnamon_tools_cli_{current_date} {executable_name}
