"""
Python client functions for interacting with the FastAPI Polly backend
Uses the requests library to make HTTP calls to the FastAPI endpoints
"""

import requests
from typing import Dict, Any, Optional
import json


def register_user(username: str, password: str, base_url: str = "http://127.0.0.1:8000") -> Dict[str, Any]:
    """
    Register a new user via the FastAPI /register endpoint
    
    Args:
        username (str): The username for the new user
        password (str): The password for the new user
        base_url (str): The base URL of the FastAPI server (default: http://127.0.0.1:8000)
    
    Returns:
        Dict[str, Any]: Response containing user data or error information
        
    Example:
        >>> result = register_user("john_doe", "secure_password123")
        >>> if result["success"]:
        ...     print(f"User registered: {result['data']['username']}")
        ... else:
        ...     print(f"Registration failed: {result['error']}")
    """
    
    # Prepare the endpoint URL
    url = f"{base_url}/register"
    
    # Prepare the request payload
    payload = {
        "username": username,
        "password": password
    }
    
    # Set headers
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        # Make the POST request
        response = requests.post(
            url=url,
            json=payload,
            headers=headers,
            timeout=30  # 30 second timeout
        )
        
        # Check if the request was successful
        if response.status_code == 200 or response.status_code == 201:
            return {
                "success": True,
                "data": response.json(),
                "status_code": response.status_code
            }
        else:
            # Handle error responses
            try:
                error_data = response.json()
                error_message = error_data.get("detail", f"HTTP {response.status_code}")
            except json.JSONDecodeError:
                error_message = f"HTTP {response.status_code}: {response.text}"
            
            return {
                "success": False,
                "error": error_message,
                "status_code": response.status_code
            }
            
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": "Could not connect to the FastAPI server. Make sure it's running.",
            "status_code": None
        }
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Request timed out. The server might be slow to respond.",
            "status_code": None
        }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Request failed: {str(e)}",
            "status_code": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "status_code": None
        }


# Example usage and testing function
def test_register_user():
    """
    Test function to demonstrate user registration
    """
    print("Testing user registration...")
    
    # Test with sample data
    result = register_user("test_user_123", "secure_password456")
    
    if result["success"]:
        print("✅ Registration successful!")
        print(f"User data: {result['data']}")
    else:
        print("❌ Registration failed!")
        print(f"Error: {result['error']}")
        if result.get('status_code'):
            print(f"Status code: {result['status_code']}")


def get_polls(skip: int = 0, limit: int = 10, base_url: str = "http://127.0.0.1:8000") -> Dict[str, Any]:
    """
    Fetch paginated poll data from the FastAPI /polls endpoint
    
    Args:
        skip (int): Number of polls to skip (default: 0)
        limit (int): Maximum number of polls to return (default: 10)
        base_url (str): The base URL of the FastAPI server (default: http://127.0.0.1:8000)
    
    Returns:
        Dict[str, Any]: Response containing poll data or error information
        
    Example:
        >>> result = get_polls(skip=0, limit=5)
        >>> if result["success"]:
        ...     polls = result['data']
        ...     for poll in polls:
        ...         print(f"Poll: {poll['question']} (ID: {poll['id']})")
        ... else:
        ...     print(f"Failed to fetch polls: {result['error']}")
    """
    
    # Prepare the endpoint URL with query parameters
    url = f"{base_url}/polls"
    
    # Set query parameters
    params = {
        "skip": skip,
        "limit": limit
    }
    
    # Set headers
    headers = {
        "Accept": "application/json"
    }
    
    try:
        # Make the GET request
        response = requests.get(
            url=url,
            params=params,
            headers=headers,
            timeout=30  # 30 second timeout
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            polls_data = response.json()
            
            # Validate that we received a list
            if not isinstance(polls_data, list):
                return {
                    "success": False,
                    "error": "Invalid response format: expected list of polls",
                    "status_code": response.status_code
                }
            
            return {
                "success": True,
                "data": polls_data,
                "status_code": response.status_code,
                "pagination": {
                    "skip": skip,
                    "limit": limit,
                    "returned_count": len(polls_data)
                }
            }
        else:
            # Handle error responses
            try:
                error_data = response.json()
                error_message = error_data.get("detail", f"HTTP {response.status_code}")
            except json.JSONDecodeError:
                error_message = f"HTTP {response.status_code}: {response.text}"
            
            return {
                "success": False,
                "error": error_message,
                "status_code": response.status_code
            }
            
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": "Could not connect to the FastAPI server. Make sure it's running.",
            "status_code": None
        }
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "error": "Request timed out. The server might be slow to respond.",
            "status_code": None
        }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Request failed: {str(e)}",
            "status_code": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "status_code": None
        }


def test_get_polls():
    """
    Test function to demonstrate fetching paginated polls
    """
    print("Testing poll fetching...")
    
    # Test with default pagination
    result = get_polls()
    
    if result["success"]:
        print("✅ Poll fetching successful!")
        polls = result['data']
        print(f"Retrieved {len(polls)} polls")
        
        # Display poll information
        for poll in polls:
            print(f"  - Poll ID: {poll.get('id')}")
            print(f"    Question: {poll.get('question')}")
            print(f"    Created by: {poll.get('created_by')}")
            print(f"    Created at: {poll.get('created_at')}")
            
            # Display options if available
            options = poll.get('options', [])
            if options:
                print(f"    Options ({len(options)}):")
                for option in options:
                    vote_count = option.get('vote_count', 0)
                    print(f"      • {option.get('text')} (votes: {vote_count})")
            print()
    else:
        print("❌ Poll fetching failed!")
        print(f"Error: {result['error']}")
        if result.get('status_code'):
            print(f"Status code: {result['status_code']}")
    
    # Test with custom pagination
    print("\nTesting with custom pagination (skip=5, limit=3)...")
    result_paginated = get_polls(skip=5, limit=3)
    
    if result_paginated["success"]:
        print(f"✅ Paginated request successful! Retrieved {len(result_paginated['data'])} polls")
        pagination_info = result_paginated.get('pagination', {})
        print(f"Pagination: skip={pagination_info.get('skip')}, limit={pagination_info.get('limit')}")
    else:
        print(f"❌ Paginated request failed: {result_paginated['error']}")


if __name__ == "__main__":
    # Run the tests when script is executed directly
    print("=== Testing User Registration ===")
    test_register_user()
    
    print("\n=== Testing Poll Fetching ===")
    test_get_polls()