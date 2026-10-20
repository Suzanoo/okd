"""Read XLSX package evidence without calculating or changing the input files.
Usage: python tests/workbook-audit.py path.xlsx [another.xlsx]
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from posixpath import normpath

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def audit(filename):
    path = Path(filename)
    data = path.read_bytes()
    with zipfile.ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {r.attrib["Id"]: r.attrib["Target"] for r in rels}
        sheets = []
        for sheet in workbook.find("m:sheets", NS):
            target = targets[sheet.attrib[f"{{{REL}}}id"]]
            target = target.lstrip("/") if target.startswith("/") else normpath("xl/" + target)
            xml = ET.fromstring(archive.read(target))
            cells = xml.findall(".//m:c", NS)
            formulas = [c for c in cells if c.find("m:f", NS) is not None]
            def missing(cell):
                value = cell.find("m:v", NS)
                return value is None or value.text is None
            sheets.append({"name": sheet.attrib["name"], "state": sheet.attrib.get("state", "visible"),
                           "formulas": len(formulas), "empty_formula_values": sum(missing(c) for c in formulas),
                           "error_cells": [c.attrib["r"] for c in cells if c.attrib.get("t") == "e"]})
        return {"file": path.name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
                "external_link_parts": [n for n in archive.namelist() if n.startswith("xl/externalLinks/")],
                "sheets": sheets}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    print(json.dumps([audit(f) for f in sys.argv[1:]], ensure_ascii=False, indent=2))
