#!/bin/bash

# It would have been impossible to create this without the following post on Stack Exchange!!!
# https://unix.stackexchange.com/a/55622

_have {executable_name} &&
_decide_nospace_{current_date}(){
    if [[ ${1} == "--"*"=" ]] ; then
        compopt -o nospace
    fi
} &&
_list_dirs_{current_date}(){
    # Source: https://stackoverflow.com/a/31603260 <3
    (
        cd "${1}" && \
        set -- */; printf "%s\n" "${@%/}";
    )
} &&
__cinnamon_tools_cli_{current_date}(){
    local cur prev cmd xlets_slugs applets_dir extensions_dir
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    applets_dir="{full_path_to_app_folder}/applets"
    extensions_dir="{full_path_to_app_folder}/extensions"
    applets_slugs=`_list_dirs_{current_date} ${applets_dir}`
    extensions_slugs=`_list_dirs_{current_date} ${extensions_dir}`
    xlets_slugs=("${applets_slugs[@]}"\n"${extensions_slugs[@]}")

    case $prev in
        --xlet)
            COMPREPLY=( $( compgen -W "${xlets_slugs[*]}") )
            return 0
            ;;
        -x)
            COMPREPLY=( $( compgen -W "${xlets_slugs[*]}" -- ${cur}) )
            return 0
            ;;
    esac

    # # Handle --xxxxx=path
    if [[ ${prev} == "=" ]] ; then
        if [[ ${cur} != *"/"* ]]; then
            COMPREPLY=( $( compgen -W "${xlets_slugs[*]}" -- ${cur}) )
            return 0
        fi
    fi

    # Completion of commands.
    if [[ $COMP_CWORD == 1 ]]; then
        COMPREPLY=( $(compgen -W \
            "menu build build_themes generate dev repo -h --help --manual --version -r \
--restart-cinnamon" -- "${cur}") )
        return 0
    fi

    # Completion of options and sub-commands.
    cmd="${COMP_WORDS[1]}"

    case $cmd in
    "menu")
        COMPREPLY=( $(compgen -W \
            "-d --domain= -o --output= -n --no-confirmation" -- "${cur}") )
        _decide_nospace_{current_date} ${COMPREPLY[0]}
        ;;
    "repo")
        COMPREPLY=( $(compgen -W \
            "submodules subtrees" -- "${cur}") )
        ;;
    "generate")
        COMPREPLY=( $(compgen -W \
            "system_executable docs docs_no_api base_xlet" -- "${cur}") )
        ;;
    "build")
        COMPREPLY=( $(compgen -W \
            "-a --all-xlets -x --xlet= -d --domain= -o --output= -n --no-confirmation -r \
--restart-cinnamon" -- "${cur}") )
        _decide_nospace_{current_date} ${COMPREPLY[0]}
        ;;
    "build_themes")
        COMPREPLY=( $(compgen -W \
            "-t --theme-name= -o --output= -n --no-confirmation -r --restart-cinnamon" -- "${cur}") )
        _decide_nospace_{current_date} ${COMPREPLY[0]}
        ;;
    "dev")
        COMPREPLY=( $(compgen -W \
            "generate_meta_file create_localized_help generate_trans_stats \
update_pot_files update_spanish_localizations create_changelogs " -- "${cur}") )
        ;;
    esac

    # Completion of options and sub-commands.
    cmd="${COMP_WORDS[2]}"

    case $cmd in
    "docs"|"docs_no_api")
        COMPREPLY=( $(compgen -W \
            "-f --force-clean-build -u --update-inventories" -- "${cur}") )
        ;;
    "submodules"|"subtrees")
        COMPREPLY=( $(compgen -W \
            "init update" -- "${cur}") )
        ;;
    esac
} &&
complete -F __cinnamon_tools_cli_{current_date} {executable_name}
