"""EDA Workbench backend — M1 Technical Foundation.

Layers (Doc02): application orchestration -> domain -> execution -> infra.
Contracts in `contracts.py` are the single source of truth (SYS-016).
"""
__all__ = ["application", "contracts", "domain", "execution", "ipc", "persistence"]
__version__ = "0.1.0"
