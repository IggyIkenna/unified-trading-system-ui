"""On-chain transfer schemas — eth_sendRawTransaction, ERC20 calldata.

Internal domain schemas for features-onchain-service and unified-defi-execution-interface.
Moved from UAC transfers.py.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ERC20_TRANSFER_SELECTOR = "0xa9059cbb"
ERC20_TRANSFER_FROM_SELECTOR = "0x23b872dd"


class EthSendRawTransactionRequest(BaseModel):
    """eth_sendRawTransaction JSON-RPC request shape.

    params: [rawSignedTx] - single hex string.
    """

    jsonrpc: Literal["2.0"] = "2.0"
    id: int | str
    method: Literal["eth_sendRawTransaction"] = "eth_sendRawTransaction"
    params: list[str] = Field(..., min_length=1, max_length=1)


class Erc20TransferCalldata(BaseModel):
    """ERC20 transfer(to, amount) calldata.

    Selector: 0xa9059cbb
    ABI: transfer(address,uint256)
    """

    selector: Literal["0xa9059cbb"] = ERC20_TRANSFER_SELECTOR
    to: str = Field(..., description="Recipient address (20 bytes)")
    amount: str = Field(..., description="Amount (uint256 wei string)")
