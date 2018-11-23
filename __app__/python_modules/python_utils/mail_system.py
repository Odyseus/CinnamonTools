#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Email system.

Send email to an email list.
"""
try:
    import keyring
except (SystemError, ImportError):
    keyring = None

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from smtplib import SMTP
from smtplib import SMTPException

__pass_setup_msg = """
There are two ways to specify a password to send e-mails:

1. Unattended: This requires to have the <keyring> Python 3 module installed and
the keys <secret_service_name> and <secret_user_name> specified in the mail
system settings. See documentation/manual page for details.
2. Always prompt: With the key called <ask_for_password> set to True in the
mail system settings, every attempt to send an e-mail will prompt for the
sender's e-mail password. This method supersedes the unattended method.

"""


class MailSystem():
    """Email system class.

    Attributes
    ----------
    logger : object
        See <class :any:`LogSystem`>.
    """

    _validator_set = {
        "ask_for_password",
        "mailing_list",
        "secret_service_name",
        "secret_user_name",
        "sender_address",
        "sender_username",
        "smtp_port",
        "smtp_server",
        "use_tls",
    }

    def __init__(self, mail_settings={}, logger=None):
        """Initialize.

        Parameters
        ----------
        mail_settings : dict
            Where all the data to send the email/s is stored.
        logger : object
            See <class :any:`LogSystem`>.
        """
        self._config = mail_settings
        self.logger = logger
        self._allowed = True

        self._validate_config()

    def _validate_config(self):
        """Validate mail settings.
        """
        missing_fields = []

        if not self._validator_set.issubset(self._config):
            missing_fields += [field for field in self._validator_set if field not in self._config]

        if missing_fields:
            self._allowed = False
            self.logger.warning("MailSystem::MissingMandatoryFields")
            self.logger.warning("The <%s> field/s is/are required." % ", ".join(missing_fields))

    def _get_password(self):
        """Get password.

        Returns
        -------
        str
            The serder's e-mail password.
        """
        ask_for_password = self._config.get("ask_for_password")
        sender_password = None
        secret_service_name = self._config.get("secret_service_name")
        secret_user_name = self._config.get("secret_user_name")
        use_keyring = keyring and secret_service_name and secret_user_name and not ask_for_password

        if use_keyring:
            sender_password = keyring.get_password(secret_service_name,
                                                   secret_user_name)
        elif ask_for_password:
            import getpass

            sender_password = getpass.getpass(prompt="Enter Sender E-Mail Password: ")

        return sender_password

    def send(self, subject, message):
        """Send the email/s.

        Parameters
        ----------
        subject : str
            The email subject.
        message : str
            The email body.

        Returns
        -------
        bool
            It returns only if it is not allowed to send emails.
        """
        if not self._allowed:
            return True

        sender_password = self._get_password()

        if not sender_password:
            self.logger.warning("No password could be obtained. Aborted.")
            self.logger.warning(__pass_setup_msg)
            return True

        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = self._config.get("sender_address")
        msg["To"] = ",".join(self._config.get("mailing_list"))

        msg.attach(MIMEText(message, "plain"))

        try:
            with SMTP(self._config.get("smtp_server"), self._config.get("smtp_port")) as s:
                if self._config.get("use_tls"):
                    s.ehlo()
                    s.starttls()

                s.ehlo()
                s.login(self._config.get("sender_username"), sender_password)
                s.sendmail(self._config.get("sender_address"),
                           self._config.get("mailing_list"), msg.as_string())
                s.close()

            self.logger.info("Email sent!")
        except SMTPException as e:
            self.logger.error("Could not send the e-mail/s: %s" % e)


if __name__ == "__main__":
    pass
