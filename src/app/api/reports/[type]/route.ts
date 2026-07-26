import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { handleApiError } from '@/lib/api-errors';
import { getReport, REPORT_TYPES, type ReportType } from '@/server/services/reports';

export async function GET(_request: Request, { params }: { params: { type: string } }) {
  try {
    requireRole(await getCurrentUser(), ['LANDLORD', 'ACCOUNTANT']);
    if (!REPORT_TYPES.includes(params.type as ReportType)) {
      return NextResponse.json({ error: 'Unknown report type.' }, { status: 404 });
    }
    const report = await getReport(params.type as ReportType);
    return NextResponse.json({ report });
  } catch (err) {
    return handleApiError(err);
  }
}
