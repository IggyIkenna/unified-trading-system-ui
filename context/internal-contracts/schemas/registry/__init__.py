"""Internal endpoint registry -- declares cross-service contract schemas."""

from pydantic import BaseModel


class InternalEndpointSpec(BaseModel):
    """Declares an internal service-to-service endpoint contract."""

    service: str  # e.g. "execution-service"
    endpoint: str  # e.g. "/api/v1/orders"
    request_schema: str  # e.g. "OrderRequest"
    response_schema: str  # e.g. "OrderResponse"
    event_types: list[str] = []  # PubSub event types this endpoint emits


INTERNAL_ENDPOINTS: list[InternalEndpointSpec] = []
