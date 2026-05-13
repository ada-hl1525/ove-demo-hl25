# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files
#datas = collect_data_files('EXAMPLE_MODULE', include_py_files=False)

a = Analysis(
    ['main.py'],
    pathex=[".", "stubs"],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=["hooks"],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)

#a.binaries = [
#  (name, path, typ) for (name, path, typ) in a.binaries
#  if "EXAMPLE_PACKAGE" not in path
#]

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='ove-demo-hl25',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)