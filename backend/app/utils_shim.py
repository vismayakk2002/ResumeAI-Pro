"""Compatibility shim.

Your code imports `app.utils.security`, but your project layout under
`backend/app/utils/` is not being discovered by the running interpreter.

This module makes `app.utils` importable as a module; it also exposes the
`security` submodule.

If you later reorganize packages, you can remove this shim.
"""

from __future__ import annotations

import importlib
import sys

# Load the real security module and re-export it.
_security = importlib.import_module(".utils.security", package=__package__)

# Expose as app.utils.security
sys.modules[__name__ + ".security"] = _security

# NOTE: This file is intentionally left blank.
# The actual utilities live in the `app/utils/` package.


