"""
Module centralisé de notifications email
"""
from .notifier import EventType, notify_admin, notify_user

__all__ = ["EventType", "notify_admin", "notify_user"]



