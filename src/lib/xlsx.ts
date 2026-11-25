import { crc32 } from "node:zlib";

export interface SheetRow {
  cells: (string | number | null)[];
  isHeading?: boolean;
}

export interface Sheet {
  /** Unique, at most 31 characters, without []:*?/\ */
  name: string;
  rows: SheetRow[];
}

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const OFFICE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PACKAGE = "http://schemas.openxmlformats.org/package/2006";
const TYPES = "application/vnd.openxmlformats-officedocument.spreadsheetml";

/** Escapes text and drops characters XML 1.0 does not allow. */
function escapeXml(text: string): string {
  return text
    .replace(/[^\t\n\r -퟿-�\u{10000}-\u{10ffff}]/gu, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cellXml(value: string | number | null, isHeading: boolean): string {
  const style = isHeading ? ' s="1"' : "";
  if (value === null || value === "") return `<c${style}/>`;
  if (typeof value === "number") return `<c${style}><v>${value}</v></c>`;
  // Inline text is never parsed as a formula, whatever it starts with.
  return `<c${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function sheetXml({ rows }: Sheet): string {
  const body = rows
    .map(
      ({ cells, isHeading = false }) =>
        `<row>${cells.map((cell) => cellXml(cell, isHeading)).join("")}</row>`,
    )
    .join("");
  return `${XML}<worksheet xmlns="${MAIN}"><cols><col min="1" max="1" width="32" customWidth="1"/><col min="2" max="16" width="24" customWidth="1"/></cols><sheetData>${body}</sheetData></worksheet>`;
}

/** An uncompressed zip: enough for a workbook of text and numbers. */
function zip(files: [name: string, content: string][]): Buffer {
  const parts: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of files) {
    const path = Buffer.from(name);
    const data = Buffer.from(content);
    // Shared by the local and central headers: version, flags, method, time,
    // date (1980-01-01), checksum, sizes, name length, extra length.
    const fields = Buffer.alloc(26);
    fields.writeUInt16LE(20, 0);
    fields.writeUInt16LE(0x21, 8);
    fields.writeUInt32LE(crc32(data), 10);
    fields.writeUInt32LE(data.length, 14);
    fields.writeUInt32LE(data.length, 18);
    fields.writeUInt16LE(path.length, 22);
    parts.push(Buffer.from("PK\x03\x04"), fields, path, data);

    const tail = Buffer.alloc(14);
    tail.writeUInt32LE(offset, 10);
    directory.push(
      Buffer.from("PK\x01\x02\x14\x00", "latin1"),
      fields,
      tail,
      path,
    );
    offset += 4 + fields.length + path.length + data.length;
  }
  const central = Buffer.concat(directory);
  const end = Buffer.alloc(18);
  end.writeUInt16LE(files.length, 4);
  end.writeUInt16LE(files.length, 6);
  end.writeUInt32LE(central.length, 8);
  end.writeUInt32LE(offset, 12);
  return Buffer.concat([...parts, central, Buffer.from("PK\x05\x06"), end]);
}

export function writeXlsx(sheets: Sheet[]): Buffer {
  const ids = sheets.map((_, index) => index + 1);
  const styles = ids.length + 1;
  return zip([
    [
      "[Content_Types].xml",
      `${XML}<Types xmlns="${PACKAGE}/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${TYPES}.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="${TYPES}.styles+xml"/>${ids.map((id) => `<Override PartName="/xl/worksheets/sheet${id}.xml" ContentType="${TYPES}.worksheet+xml"/>`).join("")}</Types>`,
    ],
    [
      "_rels/.rels",
      `${XML}<Relationships xmlns="${PACKAGE}/relationships"><Relationship Id="rId1" Type="${OFFICE}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `${XML}<workbook xmlns="${MAIN}" xmlns:r="${OFFICE}"><sheets>${sheets.map(({ name }, index) => `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `${XML}<Relationships xmlns="${PACKAGE}/relationships">${ids.map((id) => `<Relationship Id="rId${id}" Type="${OFFICE}/worksheet" Target="worksheets/sheet${id}.xml"/>`).join("")}<Relationship Id="rId${styles}" Type="${OFFICE}/styles" Target="styles.xml"/></Relationships>`,
    ],
    [
      "xl/styles.xml",
      `${XML}<styleSheet xmlns="${MAIN}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`,
    ],
    ...sheets.map((sheet, index): [string, string] => [
      `xl/worksheets/sheet${index + 1}.xml`,
      sheetXml(sheet),
    ]),
  ]);
}
