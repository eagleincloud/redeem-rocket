"""
Performance monitoring middleware for tracking query counts and response times.
"""
import time
import logging
from django.db import connection, reset_queries
from django.conf import settings

logger = logging.getLogger(__name__)


class PerformanceMonitoringMiddleware:
    """Middleware to monitor query counts and response times."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Reset query counter at start of request
        if settings.DEBUG:
            reset_queries()

        start_time = time.time()

        response = self.get_response(request)

        # Calculate response time
        response_time = time.time() - start_time

        # Log performance metrics
        if settings.DEBUG:
            query_count = len(connection.queries)
            logger.debug(
                f"Path: {request.path} | Method: {request.method} | "
                f"Response Time: {response_time:.3f}s | Queries: {query_count}"
            )

            # Warn if too many queries
            if query_count > 20:
                logger.warning(
                    f"High query count detected on {request.path}: {query_count} queries in {response_time:.3f}s"
                )

        return response
