"""MongoDB collections with an in-process fallback for an offline demo.

MongoDB remains the persistent deployment option.  The fallback makes the
prototype usable at a hackathon when MongoDB has not been installed; it is
explicitly ephemeral and is not a replacement for production storage.
"""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from threading import RLock
from typing import Any
from uuid import uuid4

from pymongo import MongoClient

from app.config import settings


class MemoryCursor:
    def __init__(self, records: list[dict[str, Any]]):
        self.records = records

    def sort(self, key_or_pairs: Any, direction: int | None = None):
        if isinstance(key_or_pairs, list):
            key, direction = key_or_pairs[0]
        else:
            key = key_or_pairs
        self.records.sort(key=lambda record: record.get(key) or 0, reverse=(direction == -1))
        return self

    def limit(self, count: int):
        self.records = self.records[:count]
        return self

    def __iter__(self):
        return iter(self.records)


@dataclass
class MemoryInsertResult:
    inserted_id: str


@dataclass
class MemoryDeleteResult:
    deleted_count: int


class MemoryCollection:
    def __init__(self):
        self._records: list[dict[str, Any]] = []
        self._lock = RLock()

    @staticmethod
    def _matches(record: dict[str, Any], query: dict[str, Any] | None) -> bool:
        if not query:
            return True
        if "$or" in query:
            return any(MemoryCollection._matches(record, option) for option in query["$or"])
        return all(record.get(key) == value for key, value in query.items())

    def count_documents(self, query: dict[str, Any] | None = None) -> int:
        with self._lock:
            return sum(1 for record in self._records if self._matches(record, query))

    def find(self, query: dict[str, Any] | None = None) -> MemoryCursor:
        with self._lock:
            return MemoryCursor([deepcopy(record) for record in self._records if self._matches(record, query)])

    def find_one(self, query: dict[str, Any] | None = None, sort: list[tuple[str, int]] | None = None):
        cursor = self.find(query)
        if sort:
            cursor.sort(sort)
        return next(iter(cursor), None)

    def insert_one(self, document: dict[str, Any]) -> MemoryInsertResult:
        with self._lock:
            record = deepcopy(document)
            record.setdefault("_id", f"memory_{uuid4().hex}")
            self._records.append(record)
            return MemoryInsertResult(record["_id"])

    def insert_many(self, documents: list[dict[str, Any]]):
        return [self.insert_one(document) for document in documents]

    def delete_one(self, query: dict[str, Any]) -> MemoryDeleteResult:
        with self._lock:
            for index, record in enumerate(self._records):
                if self._matches(record, query):
                    self._records.pop(index)
                    return MemoryDeleteResult(deleted_count=1)
            return MemoryDeleteResult(deleted_count=0)

    def update_one(self, query: dict[str, Any], update: dict[str, Any], upsert: bool = False):
        with self._lock:
            for index, record in enumerate(self._records):
                if self._matches(record, query):
                    new_record = deepcopy(record)
                    new_record.update(deepcopy(update.get("$set", {})))
                    self._records[index] = new_record
                    return
            if upsert:
                new_record = deepcopy(query)
                new_record.update(deepcopy(update.get("$set", {})))
                self.insert_one(new_record)


client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=1200)
try:
    client.admin.command("ping")
    db = client[settings.MONGO_DB_NAME]
    scan_collection = db["scan_history"]
    assets_collection = db["assets"]
    users_collection = db["users"]
    chat_collection = db["chat_history"]
    storage_mode = "mongodb"
except Exception:  # Local offline/demo fallback.
    db = None
    scan_collection = MemoryCollection()
    assets_collection = MemoryCollection()
    users_collection = MemoryCollection()
    chat_collection = MemoryCollection()
    storage_mode = "memory"


def get_database():
    """Return the Mongo database when available; otherwise ``None``."""
    return db
