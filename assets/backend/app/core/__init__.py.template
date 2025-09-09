import ssl
import warnings


def downgrade_ssl():
    warnings.warn(
        "Disabling VERIFY_X509_STRICT and VERIFY_X509_PARTIAL_CHAIN in create_default_context().\n"
        "This reverts Python 3.13's stricter SSL checks. Use only if you cannot fix your CA!"
    )

    _original_create_default_context = ssl.create_default_context

    def relaxed_create_default_context(
            purpose=ssl.Purpose.SERVER_AUTH,
            *,
            cafile=None,
            capath=None,
            cadata=None
    ):
        # Call the original function
        ctx = _original_create_default_context(purpose=purpose, cafile=cafile, capath=capath, cadata=cadata)

        # Remove the Python 3.13 flags:
        #   ssl.VERIFY_X509_STRICT       = 0x10000
        #   ssl.VERIFY_X509_PARTIAL_CHAIN = 0x80000
        if hasattr(ssl, "VERIFY_X509_STRICT"):
            ctx.verify_flags = ctx.verify_flags & ~ssl.VERIFY_X509_STRICT
        if hasattr(ssl, "VERIFY_X509_PARTIAL_CHAIN"):
            ctx.verify_flags = ctx.verify_flags & ~ssl.VERIFY_X509_PARTIAL_CHAIN

        return ctx

    # Monkey-patch the built-in function
    ssl.create_default_context = relaxed_create_default_context