"""On-chain transfer schemas: eth_sendRawTransaction, eth_sendTransaction, ERC20 calldata.

Scope: Ethereum RPC transaction submission, ERC20 transfer/transferFrom.
Internal domain schemas for features-onchain-service and unified-defi-execution-interface.
Moved from UAC transfers.py.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# --- JSON-RPC transaction submission ---
# eth_sendRawTransaction params: [rawSignedTx] - single hex string
# Result: tx hash (hex string)


class EthSendRawTransactionResponse(BaseModel):
    """eth_sendRawTransaction JSON-RPC response."""

    jsonrpc: Literal["2.0"] = "2.0"
    id: int | str
    result: str | None = Field(None, description="Tx hash on success")
    error: dict[str, object] | None = Field(None, description="Error object on failure")


# --- eth_sendTransaction / eth_call transaction object (unsigned) ---
class EthTransactionRequest(BaseModel):
    """eth_sendTransaction / eth_call transaction object (unsigned)."""

    from_: str | None = Field(None, alias="from", description="Sender address")
    to: str | None = Field(None, description="Recipient (null for contract creation)")
    gas: str | None = Field(None, description="Gas limit (hex)")
    gasPrice: str | None = Field(None, description="Legacy gas price (hex)")
    maxFeePerGas: str | None = Field(None, description="EIP-1559 max fee (hex)")
    maxPriorityFeePerGas: str | None = Field(None, description="EIP-1559 priority fee (hex)")
    value: str | None = Field(None, description="Value in wei (hex)")
    data: str | None = Field(None, description="Calldata (hex)")
    nonce: str | None = Field(None, description="Nonce (hex)")
    chainId: str | None = Field(None, description="Chain ID (hex)")

    model_config = {"populate_by_name": True}


# --- eth_sendTransaction ---
class EthSendTransactionRequest(BaseModel):
    """eth_sendTransaction JSON-RPC request shape.

    params: [transactionObject] - unsigned tx for wallet to sign.
    """

    jsonrpc: Literal["2.0"] = "2.0"
    id: int | str
    method: Literal["eth_sendTransaction"] = "eth_sendTransaction"
    params: list[EthTransactionRequest] = Field(..., min_length=1, max_length=1)


# --- ERC20 calldata ---
# transfer(address,uint256) = 0xa9059cbb
# transferFrom(address,address,uint256) = 0x23b872dd
ERC20_TRANSFER_SELECTOR = "0xa9059cbb"
ERC20_TRANSFER_FROM_SELECTOR = "0x23b872dd"


class Erc20TransferFromCalldata(BaseModel):
    """ERC20 transferFrom(from, to, amount) calldata.

    Selector: 0x23b872dd
    ABI: transferFrom(address,address,uint256)
    """

    selector: Literal["0x23b872dd"] = ERC20_TRANSFER_FROM_SELECTOR
    from_: str = Field(..., alias="from", description="Source address (20 bytes)")
    to: str = Field(..., description="Recipient address (20 bytes)")
    amount: str = Field(..., description="Amount (uint256 wei string)")

    model_config = {"populate_by_name": True}
