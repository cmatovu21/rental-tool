import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { getReport, REPORT_TYPES, type ReportType } from '@/server/services/reports';
import { toCsv, toPdf, toXlsx } from '@/server/services/report-export';

export async function GET(request: Request, { params }: { params: { type: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'ACCOUNTANT']);
    if (!REPORT_TYPES.includes(params.type as ReportType)) {
      return NextResponse.json({ error: 'Unknown report type.' }, { status: 404 });
    }
    const format = new URL(request.url).searchParams.get('format') ?? 'csv';
    const report = await getReport(params.type as ReportType);
    const filenameBase = params.type;

    if (format === 'csv') {
      return new NextResponse(toCsv(report), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
        },
      });
    }
    if (format === 'xlsx') {
      const buffer = await toXlsx(report);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
        },
      });
    }
    if (format === 'pdf') {
      const buffer = await toPdf(report);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
        },
      });
    }
    return NextResponse.json({ error: 'Unknown format. Use csv, xlsx, or pdf.' }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
