from .disease import router as disease_router
from .irrigation import router as irrigation_router
from .ndvi import ndvi_router

__all__ = ["disease_router", "irrigation_router", "ndvi_router"]
