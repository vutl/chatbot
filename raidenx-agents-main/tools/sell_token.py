import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import requests
import asyncio
from auth.jwt_generator import get_jwt
from commons.send_telegram import TelegramMessenger
from tools.utils import json_to_dict
from tools.get_top_pair import fetch_top_pair
from tools.check_order import OrderChecker
from config import settings

checker = OrderChecker()

def sell_token(token_address: str, percent: float, wallet_address: str, jwt_token: str) -> str:
    """
    Sell a percentage of a token from a user's wallet

    Args:
        token_address (str): Token contract address
        percent (float): Percentage of tokens to sell (0-100)
        wallet_address (str): User's wallet address
        jwt_token (str): Authorization token
        
    Returns:
        str: Transaction result message containing:
            - Amount of tokens sold
            - Amount of SUI received
            - Sell percentage
            - Source wallet address
            - Transaction explorer URL
            
    Raises:
        RequestException: If API request fails
        ValueError: If percent is not between 0 and 100
        Exception: If sale operation fails with error message
    """
    try:
        percent = float(percent)
        if not (0 <= percent <= 100):
            return f"Error: Percent must be a percentage between 0 and 100. Received: {percent}"
        
        result = fetch_top_pair(token_address)
        if result is None:
            return f"Failed to fetch top pair information for {token_address}. Please try again later."
        
        network, pair_id = result
        
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "orderSetting": {
                "priorityFee": "0",
                "slippage": 40
            },
            "pairId": pair_id,
            "tokenAddress": token_address,
            "sellPercent": float(percent),
            "wallets": [wallet_address]
        }
        
        response = requests.post(
            f"{settings.raiden.api_orders_url}/api/v1/sui/orders/quick-sell",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        
        result = response.json()
        if not result:
            return "❌ Transaction Failed\n\n" \
                   "📊 Reason: Insufficient liquidity in this trading pair\n" \
                   "💡 Solutions:\n" \
                   "• Please retry once liquidity is added\n" \
                   "• Or reduce the amount of tokens to sell\n" \
                   "• Or try trading with a different token"
            
        order_id = result[0]["order"]["id"]
        
        status = checker.check_order_status(order_id, jwt_token)
        
        print(f"status-sell-token: {status}")
        
        explorer_url = f"https://suivision.xyz/txblock/{status['hash']}"
        
        message = (
            f"**Token Sale Success**\n"
            f"💰 Sold: `{float(status['amountIn']):.4f} tokens`\n"
            f"📈 Received: `{float(status['amountOut']):.6f} SUI`\n"
            f"📊 Percentage: `{float(status['sellPercent']):.1f}%`\n"
            f"🔗 [View Transaction]({explorer_url})\n"
            f"👛 `{wallet_address}`"
        )
        
        # messenger = TelegramMessenger()
        # asyncio.run(messenger.send_message(
        #     f"🔴 Sell Alert: User {displayName} ({userName}) has sold {percent}% of {token_address} token"
        # ))
        
        return message
        
    except requests.exceptions.RequestException as e:
        return f"Error occurred while making the sale: {str(e)}"
