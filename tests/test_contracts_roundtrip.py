"""P1-3 — Generator round-trip + coverage baseline (FE-011).

Binds P0-2c (generator fail-loud) to the test suite: every contract model
in `MODELS` must produce a non-empty TypeScript stub, unregistered public
models must fail the gate, every dispatchable payload must survive a
`Request -> model_dump -> Request` round-trip, and `Response` must always
carry exactly one of `{data, error}`.
"""
from pathlib import Path
from typing import Any

import pytest
from pydantic import BaseModel

from backend import contracts
from backend.ipc import _COMMANDS, _QUERIES
from tools.generate_types import MODELS, OMIT_OK, _ts_type

GENERATED_TS = (
    Path(__file__).resolve().parents[1]
    / "frontend" / "src" / "shared" / "ipc" / "generated.ts"
)


def _public_models() -> set[str]:
    return {
        name for name, obj in vars(contracts).items()
        if isinstance(obj, type) and issubclass(obj, BaseModel)
        and obj.__module__ == contracts.__name__ and not name.startswith("_")
    }


def _fabricate(prop: dict[str, Any], defs: dict[str, Any]) -> Any:
    """Build one minimal valid value for a JSON-schema property."""
    ref = prop.get("$ref", "")
    if ref:
        return _fabricate(defs[ref.rsplit("/", 1)[-1]], defs)
    if "enum" in prop:
        return prop["enum"][0]
    for key in ("anyOf", "oneOf"):
        if key in prop:
            for sub in prop[key]:
                if sub.get("type") != "null":
                    return _fabricate(sub, defs)
            return None
    t = prop.get("type")
    if isinstance(t, list):
        inner = [x for x in t if x != "null"]
        return _fabricate({**prop, "type": inner[0]}, defs) if inner else None
    if t == "array":
        if prop.get("minItems", 0) > 0 and prop.get("items") is not None:
            return [_fabricate(prop["items"], defs)]  # minItems>=1 (e.g. CreatePlanPayload.steps)
        return []
    if t == "object":
        out: dict[str, Any] = {}
        for key in prop.get("required") or []:
            if key in (prop.get("properties") or {}):
                out[key] = _fabricate(prop["properties"][key], defs)
        return out
    if t == "integer":
        return 1
    if t == "number":
        return 1.0
    if t == "boolean":
        return True
    return "x"  # string


def _build_payload(model: type[BaseModel]) -> dict[str, Any]:
    schema = model.model_json_schema()
    defs = schema.get("$defs", {})
    props = schema.get("properties", {})
    return {
        name: _fabricate(props[name], defs)
        for name in schema.get("required", [])
    }


# -- generator binding (P0-2c) ---------------------------------------------

@pytest.mark.parametrize("name", MODELS)
def test_model_ts_stub_nonempty(name: str) -> None:
    model = getattr(contracts, name)
    stub = _ts_type(model.model_json_schema())
    assert stub.strip(), f"{name}: empty TS stub"
    assert stub.strip() != "unknown", f"{name}: TS stub degraded to unknown"


def test_generated_ts_contains_all_models() -> None:
    text = GENERATED_TS.read_text(encoding="utf-8")
    missing = [n for n in MODELS if f"export interface {n}" not in text]
    assert not missing, f"generated.ts missing interfaces: {missing}"


def test_unregistered_public_models_fail_gate() -> None:
    unregistered = _public_models() - set(MODELS) - OMIT_OK
    assert not unregistered, f"unregistered contract models: {sorted(unregistered)}"


def test_registry_payload_models_registered() -> None:
    names = {m.__name__ for m in {**_COMMANDS, **_QUERIES}.values()}
    assert names <= set(MODELS), f"dispatch payloads not in MODELS: {names - set(MODELS)}"


# -- Request / payload round-trips ------------------------------------------

def test_payload_roundtrip_all_commands_and_queries() -> None:
    for name, model in {**_COMMANDS, **_QUERIES}.items():
        payload = _build_payload(model)
        first = model(**payload)
        dumped = first.model_dump(mode="json")
        second = model(**dumped)
        assert second.model_dump(mode="json") == dumped, name


def test_request_envelope_roundtrip_all_commands_and_queries() -> None:
    for name, model in {**_COMMANDS, **_QUERIES}.items():
        req = contracts.Request(
            request_id="r-1", command=name, payload=_build_payload(model),
        )
        dumped = req.model_dump(mode="json")
        req2 = contracts.Request(**dumped)
        assert req2.model_dump(mode="json") == dumped, name
        assert req2.payload == dumped["payload"], name


# -- Response envelope invariant --------------------------------------------

def test_response_is_exactly_data_or_error() -> None:
    ok = contracts.Response(ok=True, data={"a": 1})
    err = contracts.Response(
        ok=False,
        error=contracts.ErrorContract(
            code=contracts.ErrorCode.NOT_FOUND, message="missing",
        ),
    )
    for resp in (ok, err):
        assert (resp.data is None) != (resp.error is None), resp
    assert ok.ok and ok.error is None
    assert not err.ok and err.data is None


def test_response_roundtrip() -> None:
    err = contracts.Response(
        ok=False,
        error=contracts.ErrorContract(
            code=contracts.ErrorCode.CONFLICT, message="stale",
            correlation_id="c-1", details={"k": "v"},
        ),
        correlation_id="c-1",
    )
    dumped = err.model_dump(mode="json")
    assert contracts.Response(**dumped).model_dump(mode="json") == dumped
