#!/usr/bin/python3
# -*- coding: utf-8 -*-
"""Email system.

Send email to an email list.
"""

from . import exceptions

try:
    import keyring
except (SystemError, ImportError):
    keyring = None
    raise exceptions.MissingDependencyModule("Module not installed: <keyring>")

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from smtplib import SMTP, SMTPException


class MailSystem():
    """Email system class.

    Attributes
    ----------
    allowed : bool
        If set to False, it will not allow to send the email/s.
    logger : object
        See <class :any:`LogSystem`>.
    mailing_list : list
        A list of email addresses to which to send the backup report/s.
    mandatory_fields : list
        A fixed list of mandatory fields. If any of them is missing, email/s will not be sent.
    sender_address : str
        The email address of the sender.
    sender_secret : tuple
        The "secret" tuple to retrieve the sender's password from the system keyring.
    sender_username : str
        The sender user name.
    smtp_port : int
        The port number of the SMTP server.
    smtp_server : str
        The SMTP server address.
    use_tls : bool
        Sets the use of TLS by the SMTP server.
    """

    mandatory_fields = [
        "smtp_server",
        "smtp_port",
        "sender_address",
        "sender_username",
        "sender_secret",
        "use_tls",
        "mailing_list",
    ]

    def __init__(self, logger, mail_settings):
        """Initialize.

        Parameters
        ----------
        logger : object
            See <class :any:`LogSystem`>.
        mail_settings : dict
            Where all the data to send the email/s is stored.
        """
        super(MailSystem, self).__init__()
        self.logger = logger
        self.allowed = True

        self.smtp_server = mail_settings.get("smtp_server", None)
        self.smtp_port = mail_settings.get("smtp_port", None)
        self.sender_address = mail_settings.get("sender_address", None)
        self.sender_username = mail_settings.get("sender_username", None)
        self.sender_secret = mail_settings.get("sender_secret", None)
        self.use_tls = mail_settings.get("use_tls", None)
        self.mailing_list = mail_settings.get("mailing_list", None)

        for f in self.mandatory_fields:
            if getattr(self, f, None) is None:
                self.allowed = False
                self.logger.error(
                    "Missing mandatory field <%s> for MailSystem." % f)

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
        if not self.allowed:
            return True

        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = self.sender_address
        msg["To"] = ",".join(self.mailing_list)

        msg.attach(MIMEText(message, "plain"))

        sender_password = keyring.get_password(*self.sender_secret)

        try:
            with SMTP(self.smtp_server, self.smtp_port) as s:
                if self.use_tls:
                    s.ehlo()
                    s.starttls()

                s.ehlo()
                s.login(self.sender_username, sender_password)
                s.sendmail(self.sender_address, self.mailing_list, msg.as_string())
                s.close()

            self.logger.info("Email sent!", "INFO")
        except SMTPException as e:
            self.logger.error("Could not send the emails: %s" % e)


if __name__ == "__main__":
    pass
