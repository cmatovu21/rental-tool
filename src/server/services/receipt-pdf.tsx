import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { formatUgx } from '@/lib/money';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  subheader: { fontSize: 10, color: '#666', marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1 solid #eee', paddingBottom: 8 },
  label: { color: '#666' },
  value: { fontFamily: 'Helvetica-Bold' },
  amountBox: { marginTop: 24, padding: 16, backgroundColor: '#EAF4EE', borderRadius: 4 },
  amountLabel: { fontSize: 10, color: '#123821', marginBottom: 4 },
  amount: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#123821' },
  footer: { marginTop: 40, fontSize: 9, color: '#999' },
});

export interface ReceiptPdfData {
  receiptNumber: string;
  issuedAt: Date;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  method: string;
  referenceNumber: string | null;
  paymentType: string;
  paidForPeriod: Date | null;
}

const METHOD_LABELS: Record<string, string> = {
  MTN_MOBILE_MONEY: 'MTN Mobile Money',
  AIRTEL_MONEY: 'Airtel Money',
  BANK_TRANSFER: 'Bank Transfer',
  CASH: 'Cash',
};

function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <Text style={styles.header}>RentLedger</Text>
        <Text style={styles.subheader}>Payment Receipt · {data.receiptNumber}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Tenant</Text>
          <Text style={styles.value}>{data.tenantName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Property / Unit</Text>
          <Text style={styles.value}>{data.propertyName} · {data.unitNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment method</Text>
          <Text style={styles.value}>{METHOD_LABELS[data.method] ?? data.method}</Text>
        </View>
        {data.referenceNumber && (
          <View style={styles.row}>
            <Text style={styles.label}>Reference number</Text>
            <Text style={styles.value}>{data.referenceNumber}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Payment type</Text>
          <Text style={styles.value}>{data.paymentType}</Text>
        </View>
        {data.paidForPeriod && (
          <View style={styles.row}>
            <Text style={styles.label}>For period</Text>
            <Text style={styles.value}>{data.paidForPeriod.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Date issued</Text>
          <Text style={styles.value}>{data.issuedAt.toLocaleDateString('en-GB')}</Text>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount received</Text>
          <Text style={styles.amount}>{formatUgx(data.amount)}</Text>
        </View>

        <Text style={styles.footer}>
          This receipt was generated automatically by RentLedger. Keep it as proof of payment.
        </Text>
      </Page>
    </Document>
  );
}

export async function generateReceiptPdf(data: ReceiptPdfData): Promise<string> {
  const buffer = await renderToBuffer(<ReceiptDocument data={data} />);
  const filename = `${data.receiptNumber}.pdf`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/receipts/${filename}`;
}
