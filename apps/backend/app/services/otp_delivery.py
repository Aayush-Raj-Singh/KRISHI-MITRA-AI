from __future__ import annotations

import asyncio
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from typing import Protocol

import httpx

from app.core.config import settings
from app.core.exceptions import ExternalServiceUnavailableError
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True)
class OTPDeliveryPayload:
    phone: str
    otp: str
    channel: str


class OTPDeliveryProvider(Protocol):
    async def send_otp(self, payload: OTPDeliveryPayload) -> None: ...


class ConsoleOTPProvider:
    async def send_otp(self, payload: OTPDeliveryPayload) -> None:
        if settings.is_production:
            raise ExternalServiceUnavailableError(
                "Console OTP delivery is not allowed in production"
            )
        logger.info(
            "otp_console_delivery",
            phone=payload.phone,
            channel=payload.channel,
            otp=payload.otp,
        )


class SMTPOTPProvider:
    @property
    def configured(self) -> bool:
        return bool(settings.smtp_host and settings.smtp_from_email)

    async def send_otp(self, payload: OTPDeliveryPayload) -> None:
        if payload.channel != "email":
            logger.warning("otp_smtp_unsupported_channel", channel=payload.channel)
            return

        if not self.configured:
            logger.warning("otp_smtp_not_configured")
            if settings.is_production:
                raise ExternalServiceUnavailableError("SMTP OTP delivery is not configured")
            return

        subject = "KrishiMitra verification code"
        body = (
            f"Your KrishiMitra verification code is {payload.otp}. "
            f"It expires in {settings.password_reset_expire_minutes} minutes."
        )
        await asyncio.to_thread(
            self._send_sync,
            to_email=payload.phone,
            subject=subject,
            body=body,
        )
        logger.info("otp_smtp_delivery_success", recipient=payload.phone)

    def _send_sync(self, to_email: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = settings.smtp_from_email
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username and settings.smtp_password:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)


class TwilioOTPProvider:
    def __init__(self) -> None:
        self.account_sid = settings.twilio_account_sid
        self.auth_token = settings.twilio_auth_token
        self.from_number = settings.twilio_from_number
        self.status_callback_url = settings.twilio_status_callback_url
        self.mock_mode = settings.twilio_mock_mode

    @property
    def configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.from_number)

    @staticmethod
    def _is_retryable_http_error(exc: Exception) -> bool:
        if isinstance(
            exc, (httpx.TimeoutException, httpx.TransportError, httpx.RemoteProtocolError)
        ):
            return True
        if isinstance(exc, httpx.HTTPStatusError):
            return exc.response.status_code in {408, 409, 425, 429, 500, 502, 503, 504}
        return False

    async def send_otp(self, payload: OTPDeliveryPayload) -> None:
        if payload.channel == "email":
            smtp_provider = SMTPOTPProvider()
            await smtp_provider.send_otp(payload)
            return

        if not self.configured or self.mock_mode:
            if settings.is_production:
                raise ExternalServiceUnavailableError("Twilio OTP delivery is unavailable")
            logger.info(
                "otp_twilio_mock_delivery",
                phone=payload.phone,
                channel=payload.channel,
            )
            return

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        data = {
            "To": payload.phone,
            "From": self.from_number,
            "Body": f"Your KrishiMitra verification code is {payload.otp}. It expires in {settings.password_reset_expire_minutes} minutes.",
        }
        if self.status_callback_url:
            data["StatusCallback"] = self.status_callback_url

        async with httpx.AsyncClient(timeout=10) as client:
            for attempt in range(1, 4):
                try:
                    response = await client.post(
                        url,
                        data=data,
                        auth=(self.account_sid or "", self.auth_token or ""),
                    )
                    response.raise_for_status()
                    break
                except Exception as exc:
                    if attempt >= 3 or not self._is_retryable_http_error(exc):
                        raise
                    await asyncio.sleep(min(0.25 * attempt, 1.0))
        logger.info("otp_twilio_delivery_success", phone=payload.phone)


def get_otp_provider() -> OTPDeliveryProvider:
    provider = settings.otp_provider
    if provider == "twilio":
        return TwilioOTPProvider()
    if provider == "smtp":
        return SMTPOTPProvider()
    return ConsoleOTPProvider()
