from datetime import datetime, timezone
from typing import Optional

# Cache durations (in seconds)
PROJECT_CACHE_DURATION = 24 * 60 * 60  # 24 hours for project data
README_CACHE_DURATION = 7 * 24 * 60 * 60  # 1 week for readme data

class CacheService:
    @staticmethod
    def is_cache_valid(cache_time: Optional[datetime], cache_duration: int) -> bool:
        """
        Generic function to check if a cache is valid based on timestamp and duration
        
        Args:
            cache_time: The timestamp when the cache was last updated
            cache_duration: The cache validity duration in seconds
            
        Returns:
            bool: True if cache is valid, False otherwise
        """
        if not cache_time:
            return False
        
        now = datetime.now(timezone.utc)
        
        # If cache_time is naive, make it timezone-aware
        if cache_time.tzinfo is None:
            cache_time = cache_time.replace(tzinfo=timezone.utc)
        
        return (now - cache_time).total_seconds() < cache_duration
    
    @staticmethod
    def get_current_time() -> datetime:
        """Get the current time in UTC"""
        return datetime.now(timezone.utc)

# Create a singleton instance
cache_service = CacheService() 