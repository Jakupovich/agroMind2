from datetime import datetime

from pydantic import BaseModel


class SubscriptionPlan(BaseModel):
    name: str
    price_monthly: int
    max_cameras: int
    features: list[str]


class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    current_period_end: datetime | None = None
    cancel_at_period_end: bool = False


class CreateCheckoutRequest(BaseModel):
    plan: str
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    checkout_url: str


PLANS: dict[str, SubscriptionPlan] = {
    "standard": SubscriptionPlan(
        name="Standard",
        price_monthly=500,
        max_cameras=10,
        features=[
            "Violence detection",
            "Real-time alerts",
            "Dashboard notifications",
            "Email alerts",
            "Incident management",
        ],
    ),
    "professional": SubscriptionPlan(
        name="Professional",
        price_monthly=750,
        max_cameras=50,
        features=[
            "All Standard features",
            "Bullying detection",
            "Analytics dashboard",
            "Heatmaps",
            "SMS alerts",
            "Priority support",
        ],
    ),
    "enterprise": SubscriptionPlan(
        name="Enterprise",
        price_monthly=1000,
        max_cameras=999,
        features=[
            "All Professional features",
            "Weapon detection",
            "Predictive risk scoring",
            "Multi-site management",
            "API access",
            "Custom integrations",
            "Dedicated support",
        ],
    ),
}
