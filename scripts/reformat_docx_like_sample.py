from __future__ import annotations

import re
from copy import deepcopy
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.etree import ElementTree as ET


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}
W = f"{{{W_NS}}}"


def qn(tag: str) -> str:
    return f"{W}{tag}"


def ensure(parent: ET.Element, tag: str) -> ET.Element:
    child = parent.find(qn(tag))
    if child is None:
        child = ET.SubElement(parent, qn(tag))
    return child


def get_text(paragraph: ET.Element) -> str:
    return "".join(t.text or "" for t in paragraph.findall(".//w:t", NS)).strip()


def ensure_ppr(paragraph: ET.Element) -> ET.Element:
    ppr = paragraph.find(qn("pPr"))
    if ppr is None:
        ppr = ET.Element(qn("pPr"))
        paragraph.insert(0, ppr)
    return ppr


def set_spacing(ppr: ET.Element, before: int | None = None, after: int | None = None, line: int | None = None) -> None:
    spacing = ensure(ppr, "spacing")
    if before is not None:
        spacing.set(qn("before"), str(before))
    else:
        spacing.attrib.pop(qn("before"), None)
    if after is not None:
        spacing.set(qn("after"), str(after))
    else:
        spacing.attrib.pop(qn("after"), None)
    if line is not None:
        spacing.set(qn("line"), str(line))
        spacing.set(qn("lineRule"), "auto")


def set_indent(ppr: ET.Element, first_line: int | None = None, left: int | None = None, right: int | None = None, hanging: int | None = None) -> None:
    ind = ensure(ppr, "ind")
    if first_line is not None:
      ind.set(qn("firstLine"), str(first_line))
    else:
      ind.attrib.pop(qn("firstLine"), None)
    if left is not None:
      ind.set(qn("left"), str(left))
    else:
      ind.attrib.pop(qn("left"), None)
    if right is not None:
      ind.set(qn("right"), str(right))
    else:
      ind.attrib.pop(qn("right"), None)
    if hanging is not None:
      ind.set(qn("hanging"), str(hanging))
    else:
      ind.attrib.pop(qn("hanging"), None)


def set_align(ppr: ET.Element, val: str) -> None:
    jc = ensure(ppr, "jc")
    jc.set(qn("val"), val)


def ensure_run_rpr(run: ET.Element) -> ET.Element:
    rpr = run.find(qn("rPr"))
    if rpr is None:
        rpr = ET.Element(qn("rPr"))
        run.insert(0, rpr)
    return rpr


def set_run_font(run: ET.Element, size: int, bold: bool | None = None, italic: bool | None = None, caps: bool | None = None) -> None:
    rpr = ensure_run_rpr(run)
    rfonts = ensure(rpr, "rFonts")
    for key in ("ascii", "hAnsi", "cs", "eastAsia"):
        rfonts.set(qn(key), "Times New Roman")

    sz = ensure(rpr, "sz")
    sz.set(qn("val"), str(size))
    sz_cs = ensure(rpr, "szCs")
    sz_cs.set(qn("val"), str(size))

    if bold is not None:
        if bold:
            ensure(rpr, "b")
            ensure(rpr, "bCs")
        else:
            for tag in ("b", "bCs"):
                node = rpr.find(qn(tag))
                if node is not None:
                    rpr.remove(node)

    if italic is not None:
        if italic:
            ensure(rpr, "i")
            ensure(rpr, "iCs")
        else:
            for tag in ("i", "iCs"):
                node = rpr.find(qn(tag))
                if node is not None:
                    rpr.remove(node)

    if caps is not None:
        node = rpr.find(qn("caps"))
        if caps and node is None:
            ET.SubElement(rpr, qn("caps"))
        if not caps and node is not None:
            rpr.remove(node)


def format_paragraph(paragraph: ET.Element, *, size: int, align: str, first_line: int, line: int, before: int, after: int, bold: bool | None = None, italic: bool | None = None, caps: bool | None = None) -> None:
    ppr = ensure_ppr(paragraph)
    pstyle = ppr.find(qn("pStyle"))
    if pstyle is not None:
        ppr.remove(pstyle)
    set_spacing(ppr, before=before, after=after, line=line)
    set_indent(ppr, first_line=first_line)
    set_align(ppr, align)
    for run in paragraph.findall("w:r", NS):
        if get_text(run):
            set_run_font(run, size=size, bold=bold, italic=italic, caps=caps)


def main() -> None:
    source = Path("/Users/dimqvak/Documents/code/finance-planner/docs/prakticheskaya-rabota-finance-planner.docx")
    sample = Path("/Users/dimqvak/Downloads/СиПИ_9-10.docx")
    output = Path("/Users/dimqvak/Documents/code/finance-planner/docs/prakticheskaya-rabota-finance-planner-formatted.docx")

    with ZipFile(source) as src_zip, ZipFile(sample) as sample_zip:
        doc_root = ET.fromstring(src_zip.read("word/document.xml"))
        sample_doc = ET.fromstring(sample_zip.read("word/document.xml"))
        sample_body = sample_doc.find("w:body", NS)
        assert sample_body is not None
        sample_sect = sample_body.find("w:sectPr", NS)
        assert sample_sect is not None

        body = doc_root.find("w:body", NS)
        assert body is not None

        nonempty_top_level_index = 0
        heading_re = re.compile(r"^\d+\.\s")

        for child in body:
            tag = child.tag.split("}")[-1]
            if tag != "p":
                continue

            text = get_text(child)
            if not text:
                continue

            nonempty_top_level_index += 1

            if nonempty_top_level_index in {1, 2, 3}:
                format_paragraph(
                    child,
                    size=28,
                    align="center",
                    first_line=0,
                    line=240,
                    before=0 if nonempty_top_level_index != 1 else 120,
                    after=0,
                    bold=(nonempty_top_level_index == 1),
                )
            elif nonempty_top_level_index in {4, 5, 6}:
                format_paragraph(
                    child,
                    size=28,
                    align="right",
                    first_line=0,
                    line=240,
                    before=0,
                    after=0,
                )
            elif nonempty_top_level_index == 7:
                format_paragraph(
                    child,
                    size=28,
                    align="center",
                    first_line=0,
                    line=240,
                    before=0,
                    after=0,
                )
            elif heading_re.match(text):
                format_paragraph(
                    child,
                    size=32,
                    align="left",
                    first_line=0,
                    line=240,
                    before=851,
                    after=567,
                    bold=True,
                )
            else:
                format_paragraph(
                    child,
                    size=28,
                    align="both",
                    first_line=709,
                    line=360,
                    before=0,
                    after=0,
                )

        for table in body.findall(".//w:tbl", NS):
            rows = table.findall("w:tr", NS)
            for row_idx, row in enumerate(rows):
                for cell in row.findall("w:tc", NS):
                    for para in cell.findall(".//w:p", NS):
                        text = get_text(para)
                        if not text:
                            continue
                        is_header = row_idx == 0
                        format_paragraph(
                            para,
                            size=24,
                            align="center" if is_header else "left",
                            first_line=0,
                            line=240,
                            before=0,
                            after=0,
                            bold=True if is_header else None,
                        )

        existing_sect = body.find("w:sectPr", NS)
        if existing_sect is not None:
            body.remove(existing_sect)
        body.append(deepcopy(sample_sect))

        output.parent.mkdir(parents=True, exist_ok=True)
        with ZipFile(output, "w", compression=ZIP_DEFLATED) as out_zip:
            for info in src_zip.infolist():
                if info.filename == "word/document.xml":
                    out_zip.writestr(info.filename, ET.tostring(doc_root, encoding="utf-8", xml_declaration=True))
                else:
                    out_zip.writestr(info, src_zip.read(info.filename))


if __name__ == "__main__":
    main()
