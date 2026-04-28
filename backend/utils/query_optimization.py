"""
Query optimization utilities for reducing database queries.
Provides helper functions for select_related and prefetch_related optimization.
"""
from django.db.models import QuerySet, Prefetch
from typing import Optional, List


def optimize_business_queryset(queryset: QuerySet) -> QuerySet:
    """Optimize Business queryset by reducing database queries."""
    return queryset.select_related(
        'owner',  # Foreign key to User
    ).prefetch_related(
        'businessdocument_set',  # Related documents
        'businessphoto_set',  # Related photos
        'businessteammember_set',  # Related team members
    )


def optimize_order_queryset(queryset: QuerySet) -> QuerySet:
    """Optimize Order queryset by reducing database queries."""
    return queryset.select_related(
        'business',  # Foreign key
        'user',  # Foreign key
    ).prefetch_related(
        'orderitem_set',  # Related items
    )


def optimize_lead_queryset(queryset: QuerySet) -> QuerySet:
    """Optimize Lead queryset by reducing database queries."""
    return queryset.select_related(
        'business',  # Foreign key
    )


def optimize_business_detail_queryset(queryset: QuerySet) -> QuerySet:
    """Optimize Business detail queryset with all related data."""
    from django.db.models import Prefetch

    return queryset.select_related(
        'owner',
    ).prefetch_related(
        Prefetch('businessdocument_set'),
        Prefetch('businessphoto_set'),
        Prefetch('businessteammember_set'),
    )


# Query optimization decorators
def with_query_optimization(optimizer_func):
    """
    Decorator to automatically optimize querysets.
    """
    def decorator(view_func):
        def wrapper(self, *args, **kwargs):
            queryset = self.get_queryset()
            self.queryset = optimizer_func(queryset)
            return view_func(self, *args, **kwargs)
        return wrapper
    return decorator
