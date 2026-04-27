from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_role
from app.models.organization import Organization
from app.models.user import User
from app.schemas.billing import (
    PLANS,
    CheckoutResponse,
    CreateCheckoutRequest,
    SubscriptionPlan,
    SubscriptionResponse,
)

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/plans", response_model=dict[str, SubscriptionPlan])
async def list_plans():
    return PLANS


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization).where(Organization.id == user.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return SubscriptionResponse(plan=org.subscription_plan, status=org.subscription_status)


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    body: CreateCheckoutRequest,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY

    result = await db.execute(
        select(Organization).where(Organization.id == user.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    price_map = {
        "standard": settings.STRIPE_PRICE_STANDARD,
        "professional": settings.STRIPE_PRICE_PROFESSIONAL,
        "enterprise": settings.STRIPE_PRICE_ENTERPRISE,
    }
    price_id = price_map.get(body.plan)
    if not price_id:
        raise HTTPException(status_code=400, detail="Price not configured for this plan")

    if not org.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=org.name,
            metadata={"organization_id": str(org.id)},
        )
        org.stripe_customer_id = customer.id
        await db.flush()

    session = stripe.checkout.Session.create(
        customer=org.stripe_customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        metadata={"organization_id": str(org.id), "plan": body.plan},
    )
    return CheckoutResponse(checkout_url=session.url)
