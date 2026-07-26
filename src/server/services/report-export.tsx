import ExcelJS from 'exceljs';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { TabularReport } from '@/server/services/reports';

export function toCsv(report: TabularReport): string {
  const header = report.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const lines = report.rows.map((row) =>
    report.columns.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  return [header, ...lines].join('\n');
}

export async function toXlsx(report: TabularReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(report.title.slice(0, 31));
  sheet.columns = report.columns.map((c) => ({ header: c.label, key: c.key, width: 22 }));
  sheet.getRow(1).font = { bold: true };
  report.rows.forEach((row) => sheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

const pdfStyles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  title: { fontSize: 16, marginBottom: 12, fontFamily: 'Helvetica-Bold' },
  headerRow: { flexDirection: 'row', borderBottom: '1 solid #123821', paddingBottom: 4, marginBottom: 4 },
  row: { flexDirection: 'row', borderBottom: '0.5 solid #D8D2C4', paddingVertical: 3 },
  cell: { flex: 1, paddingRight: 6 },
  headerCell: { flex: 1, paddingRight: 6, fontFamily: 'Helvetica-Bold' },
});

function ReportDocument({ report }: { report: TabularReport }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{report.title}</Text>
        <View style={pdfStyles.headerRow}>
          {report.columns.map((c) => (
            <Text key={c.key} style={pdfStyles.headerCell}>
              {c.label}
            </Text>
          ))}
        </View>
        {report.rows.map((row, i) => (
          <View key={i} style={pdfStyles.row}>
            {report.columns.map((c) => (
              <Text key={c.key} style={pdfStyles.cell}>
                {String(row[c.key] ?? '')}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function toPdf(report: TabularReport): Promise<Buffer> {
  return renderToBuffer(<ReportDocument report={report} />);
}
