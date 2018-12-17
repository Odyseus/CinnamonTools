#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Schemas for JSON data validation.
"""

settings_schema = {
    "description": "Mail system settings schema.",
    "type": "object",
    "additionalProperties": False,
    "required": [
        "ask_for_password",
        "mailing_list",
        "secret_service_name",
        "secret_user_name",
        "sender_address",
        "sender_username",
        "smtp_port",
        "smtp_server",
        "use_tls"
    ],
    "properties": {
        "ask_for_password": {
            "type": "boolean",
            "description": "If set to **False**, an attempt to get the sender's password from the system's keyring will be performed. The keys ``secret_service_name`` and ``secret_user_name`` should contain valid data to retrieve said password. If set to **True**, the mail system will always prompt for a password, and no attempt to retrieve a password from the system's keyring will be made.",
        },
        "sender_address": {
            "type": "string",
            "format": "email",
            "description": "The sender's e-mail address.",
        },
        "sender_username": {
            "type": "string",
            "description": "The sender's user name.",
        },
        "smtp_server": {
            "type": "string",
            "description": "The SMTP server for the sender's account.",
        },
        "smtp_port": {
            "type": "integer",
            "description": "The SMTP port for the sender's account.",
        },
        "secret_service_name": {
            "type": "string",
        },
        "secret_user_name": {
            "type": "string",
        },
        "use_tls": {
            "type": "boolean",
            "description": "Whether to use TLS or not."
        },
        "mailing_list": {
            "type": "array",
            "description": "A list of e-mail addresses to send e-mails to.",
            "items": {
                "anyOf": [{
                    "type": "string",
                    "format": "email"
                }]
            }
        },
    }
}


if __name__ == "__main__":
    pass
