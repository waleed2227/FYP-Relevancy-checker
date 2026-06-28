# NO_VALUE Import Fix Report

**Project:** AI-Based FYP Relevancy System  
**File:** `backend/app/services/auth_service.py`  
**Date:** June 2026  
**Scope:** SQLAlchemy type-checking fix only — no auth/business logic changes

---

## 1. Problem

Cursor/basedpyright reported on line 6:

```text
"NO_VALUE" is not exported from module "sqlalchemy.orm.attributes"
Import from "sqlalchemy.orm.base" instead
```

Runtime worked fine; this was a **static analysis / public API surface** issue, not a runtime import failure.

---

## 2. Original Code

**Import:**

```python
from sqlalchemy.orm.attributes import NO_VALUE
```

**Usage** (in `_loaded_relationship`):

```python
def _loaded_relationship(parent: User | Student | Professor, attr: str):
    """Return a relationship value only if already loaded (never triggers lazy IO)."""
    value = inspect(parent).attrs[attr].loaded_value
    if value is NO_VALUE:
        return None
    return value
```

**Purpose:** When building `UserResponse` in async contexts, the helper must read relationship data **only if already eager-loaded**. Comparing `loaded_value` to `NO_VALUE` detects an unloaded attribute without triggering a lazy database fetch (which would raise `MissingGreenlet`).

---

## 3. Runtime Verification (Before Fix)

```powershell
cd backend
python -c "from sqlalchemy.orm.attributes import NO_VALUE; from sqlalchemy.orm.base import NO_VALUE as B; print(NO_VALUE is B)"
```

**Result:** `True` — both paths resolve to the same sentinel object (`LoaderCallableStatus.NO_VALUE`).

The old import worked at runtime because SQLAlchemy still exposes `NO_VALUE` on `attributes` internally, but it is **not part of the typed public export list** that basedpyright uses.

---

## 4. Why basedpyright Complained

| Factor | Detail |
|--------|--------|
| SQLAlchemy 2.x typing | Public re-export of `NO_VALUE` is declared on `sqlalchemy.orm.base` |
| `sqlalchemy.orm.attributes` | Module implements internals; stubs do not export `NO_VALUE` |
| basedpyright | Enforces stub exports → reports “could not resolve” / “not exported” |

This is intentional: application code should use the **documented import path**, not internal module attributes.

---

## 5. Final Implementation

**Single-line import change:**

```python
from sqlalchemy.orm.base import NO_VALUE
```

All other code unchanged:

- `_loaded_relationship()` logic identical  
- `user_to_response()` unchanged  
- Auth queries, registration, login, eager-load options unchanged  

---

## 6. Runtime Behavior Changed?

| Aspect | Changed? |
|--------|----------|
| `NO_VALUE` object identity | **No** — same sentinel |
| `_loaded_relationship()` return values | **No** |
| `user_to_response()` output | **No** |
| Authentication / API responses | **No** |
| Database queries | **No** |

**Verification after fix:**

```powershell
cd backend
python -c "from sqlalchemy.orm.base import NO_VALUE; from app.services.auth_service import _loaded_relationship; print('import OK', NO_VALUE)"
python -m pytest tests/test_auth_service.py -q
```

---

## 7. Alternative Considered (Not Used)

Refactor to avoid `NO_VALUE` entirely:

```python
insp = inspect(parent)
if attr in insp.unloaded:
    return None
return insp.attrs[attr].loaded_value
```

This would also preserve behavior using public `InstanceState.unloaded`. It was **not chosen** because the recommended one-line import fix is simpler, matches basedpyright’s suggestion, and is the official public path for the same sentinel.

---

## 8. Summary

| Item | Detail |
|------|--------|
| Root cause | Non-public import path for typed stubs |
| Fix | `from sqlalchemy.orm.base import NO_VALUE` |
| Lines changed | 1 (import only) |
| Business logic | Unchanged |
| Type-checker | Should clear the `NO_VALUE` export warning after reload |

---

*End of report.*
