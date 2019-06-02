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
__cinnamon_tools_cli_{current_date}(){
    local cur prev cmd xlets_slugs
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
    esac

    # Handle --xxxxxx=
    if [[ ${prev} == "--"* && ${cur} == "=" ]] ; then
        compopt -o filenames
        COMPREPLY=(*)
        return 0
    fi

    # Handle --xxxxx=path
    case ${prev} in
        "="|"-o")
            # Unescape space
            cur=${cur//\\ / }
            # Expand tilde to $HOME
            [[ ${cur} == "~/"* ]] && cur=${cur/\~/$HOME}
            # Show completion if path exist (and escape spaces)
            compopt -o filenames
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
            "menu build build_themes generate dev repo -h --help --manual --version -r \
--restart-cinnamon" -- "${cur}") )
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
            "system_executable docs docs_no_api base_xlet" -- "${cur}") )
        ;;
    "build")
        COMPREPLY=( $(compgen -W \
            "-a --all-xlets -x --xlet= -d --domain= -o --output= -n --no-confirmation -r \
--restart-cinnamon -y --dry-run" -- "${cur}") )
        _decide_nospace_{current_date} ${COMPREPLY[0]}
        ;;
    "build_themes")
        COMPREPLY=( $(compgen -W \
            "-t --theme-name= -o --output= -n --no-confirmation -r --restart-cinnamon \
-y --dry-run" -- "${cur}") )
        _decide_nospace_{current_date} ${COMPREPLY[0]}
        ;;
    "dev")
        COMPREPLY=( $(compgen -W \
            "-x --xlet= generate_meta_file create_localized_help generate_trans_stats \
update_pot_files update_spanish_localizations create_changelogs " -- "${cur}") )
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
    esac

    # Completion of options and sub-commands.
    cmd="${COMP_WORDS[3]}"

    case $cmd in
    "init"|"update")
        COMPREPLY=( $(compgen -W " -y --dry-run" -- "${cur}") )
        ;;
    esac
} &&
complete -F __cinnamon_tools_cli_{current_date} {executable_name}
