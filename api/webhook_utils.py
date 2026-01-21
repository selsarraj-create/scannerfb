import requests
import json
import logging

class WebhookResponse:
    """Mock response object for failed requests"""
    def __init__(self, status_code, text):
        self.status_code = status_code
        self.text = text

def send_webhook(url, payload):
    """
    Send a webhook to the CRM.
    Returns the response object or a mock response with error details if failed.
    """
    if not url:
        return WebhookResponse(0, "No webhook URL configured")
    
    try:
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ModelScanner/1.0'
        }
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response
    except requests.exceptions.Timeout:
        print(f"Webhook timeout after 10 seconds")
        return WebhookResponse(0, "Timeout: Request took longer than 10 seconds")
    except requests.exceptions.ConnectionError as e:
        print(f"Webhook connection error: {str(e)}")
        return WebhookResponse(0, f"Connection Error: {str(e)[:200]}")
    except requests.exceptions.SSLError as e:
        print(f"Webhook SSL error: {str(e)}")
        return WebhookResponse(0, f"SSL Error: {str(e)[:200]}")
    except requests.exceptions.RequestException as e:
        print(f"Webhook request error: {str(e)}")
        return WebhookResponse(0, f"Request Error: {str(e)[:200]}")
    except Exception as e:
        print(f"Webhook unexpected error: {str(e)}")
        return WebhookResponse(0, f"Unexpected Error: {str(e)[:200]}")
