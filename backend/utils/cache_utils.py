"""
Caching utilities for performance optimization.
Uses Django's cache framework with Redis as the backend.
"""
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from functools import wraps
from typing import Any, Callable, Optional
import hashlib
import json


def get_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a cache key from prefix and arguments."""
    key_parts = [prefix] + [str(arg) for arg in args]
    kwargs_str = json.dumps(kwargs, sort_keys=True, default=str)
    key_data = '|'.join(key_parts) + kwargs_str
    key_hash = hashlib.md5(key_data.encode()).hexdigest()
    return f"cache:{prefix}:{key_hash}"


def cache_result(timeout: int = 300):
    """
    Decorator to cache function results.

    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            cache_key = get_cache_key(func.__name__, *args, **kwargs)
            result = cache.get(cache_key)

            if result is None:
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout)

            return result
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str) -> None:
    """Invalidate all cache keys matching a pattern."""
    # Note: This is a simplified version. In production, use django-redis
    # with proper pattern matching or maintain a cache key registry
    pass


class CacheManager:
    """Context manager for cache invalidation."""

    def __init__(self, cache_keys: list):
        self.cache_keys = cache_keys

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        for key in self.cache_keys:
            cache.delete(key)


# Cache timeout constants
CACHE_TIMEOUT_SHORT = 300  # 5 minutes
CACHE_TIMEOUT_MEDIUM = 1800  # 30 minutes
CACHE_TIMEOUT_LONG = 3600  # 1 hour
CACHE_TIMEOUT_EXTRA_LONG = 86400  # 24 hours
