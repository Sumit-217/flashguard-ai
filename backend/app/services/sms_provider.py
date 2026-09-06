"""SMS provider abstraction and demo implementation for FlashGuard AI.

Provides a pluggable provider interface so live telecom gateways
(e.g., Twilio, AWS SNS, local GSM modem, CDAC emergency cell broadcast)
can be seamlessly integrated in the future without modifying the API contract.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class SMSDeliveryResult:
    """Standardized result of an SMS dispatch operation."""

    success: bool
    delivery_mode: str
    recipient: str
    message: str


class BaseSMSProvider(ABC):
    """Abstract base class for SMS delivery providers."""

    @abstractmethod
    def send(self, phone_number: str, message: str) -> SMSDeliveryResult:
        """Send or simulate sending an emergency SMS message.

        Args:
            phone_number: Recipient mobile number.
            message: Formatted emergency text alert.

        Returns:
            SMSDeliveryResult containing success flag, mode,
            masked recipient, and message.
        """
        pass


class DemoSMSProvider(BaseSMSProvider):
    """Demonstration provider for SIH presentations.

    Simulates instant SMS delivery for evaluation without requiring paid telecom
    gateways or external third-party API credentials.
    """

    DELIVERY_MODE: str = "SMS_DEMO"

    def send(self, phone_number: str, message: str) -> SMSDeliveryResult:
        """Simulate SMS dispatch and return a structured demo delivery payload."""
        # Never store or log raw phone numbers; mask preserving only last 4 digits
        cleaned = phone_number.strip()
        masked = (
            "*" * (len(cleaned) - 4) + cleaned[-4:]
            if len(cleaned) > 4
            else "*" * len(cleaned)
        )
        return SMSDeliveryResult(
            success=True,
            delivery_mode=self.DELIVERY_MODE,
            recipient=masked,
            message=message,
        )
