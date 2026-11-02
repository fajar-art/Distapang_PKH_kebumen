import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { logActivity } from '@/lib/auditLog';
import { sendNotificationToRole } from '@/lib/webPush';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request as any);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await request.json();
    const { request_id, action, reject_reason } = body; // action: 'APPROVE' or 'REJECT'

    if (!request_id || !action) {
      return NextResponse.json({ error: 'request_id dan action diperlukan' }, { status: 400 });
    }

    const [reqRows]: any = await pool.query(`SELECT * FROM correction_requests WHERE id = ?`, [request_id]);
    if (!reqRows || reqRows.length === 0) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 });
    }

    const reqData = reqRows[0];
    if (reqData.status !== 'PENDING') {
      return NextResponse.json({ error: 'Pengajuan ini sudah diproses sebelumnya' }, { status: 400 });
    }

    const adminName = auth.session.nama || 'Administrator';

    if (action === 'REJECT') {
      await pool.query(
        `UPDATE correction_requests SET status = 'REJECTED', handled_by = ?, handled_at = NOW() WHERE id = ?`,
        [adminName, request_id]
      );
      
      // Catat ke log
      await logActivity({
        module: reqData.module,
        submenu: reqData.submenu,
        tableName: reqData.table_name,
        recordId: reqData.record_id,
        action: 'CORRECTION_REJECTED',
        userName: adminName,
        details: { reason: reject_reason },
      });

      // Beritahu pemohon bahwa permohonannya ditolak
      if (reqData.requested_by) {
        sendNotificationToRole('Petugas Teknis', {
          title: 'Pengajuan Revisi Ditolak',
          body: `Pengajuan koreksi Anda pada modul ${reqData.module} (${reqData.submenu}) telah ditolak: ${reject_reason || 'Tidak memenuhi kriteria'}.`,
          url: '/beranda',
          type: 'koreksi',
        }, reqData.requested_by).catch(() => {});
      }

      return NextResponse.json({ success: true, message: 'Pengajuan ditolak' });
    }

    if (action === 'APPROVE') {
      const proposed = typeof reqData.proposed_changes === 'string' ? JSON.parse(reqData.proposed_changes) : reqData.proposed_changes;
      
      let targetTable = reqData.table_name;
      if (targetTable === 'sklb_sapi_po') targetTable = 'bitpro_sklb_populasi_sapi_po';
      if (targetTable === 'vaksinasi_pmk_harian') targetTable = 'vaksinasi_harian';
      if (targetTable === 'sapitime') targetTable = 'sapitime_master';
      if (targetTable === 'laporan_penyakit') targetTable = 'keswan_laporan_penyakit';

      let pkCol = 'id';
      if (targetTable === 'vaksinasi') pkCol = 'id_vaksinasi';
      if (targetTable === 'kegiatan_ktt') {
        try {
          const [descRows]: any = await pool.query('DESCRIBE kegiatan_ktt');
          const fields = (descRows || []).map((f: any) => f.Field);
          if (fields.includes('id')) pkCol = 'id';
          else if (fields.includes('id_kegiatan')) pkCol = 'id_kegiatan';
        } catch {
          pkCol = 'id';
        }
      }
      if (targetTable === 'dropping_dinas') pkCol = 'id_dropping_dinas';
      if (targetTable === 'distribusi_obat') pkCol = 'id_distribusi';
      if (targetTable === 'penggunaan_obat_puskeswan') pkCol = 'id_penggunaan';
      if (targetTable === 'barang') pkCol = 'id_barang';
      if (targetTable === 'keswan_laporan_penyakit') {
        try {
          const [descRows]: any = await pool.query('DESCRIBE keswan_laporan_penyakit');
          const fields = (descRows || []).map((f: any) => f.Field);
          if (fields.includes('id_laporan_penyakit')) pkCol = 'id_laporan_penyakit';
        } catch {}
      }

      if (proposed.ACTION === 'DELETE_REQUEST') {
        // Eksekusi DELETE dari tabel target
        const deleteQuery = `DELETE FROM ${targetTable} WHERE ${pkCol} = ?`;
        await pool.query(deleteQuery, [reqData.record_id]);
      } else {
        // Eksekusi UPDATE ke tabel target
        const keys = Object.keys(proposed);
        if (keys.length > 0) {
          const setClause = keys.map(k => `${k} = ?`).join(', ');
          const values = keys.map(k => proposed[k]);
          values.push(reqData.record_id);

          const updateQuery = `UPDATE ${targetTable} SET ${setClause} WHERE ${pkCol} = ?`;
          await pool.query(updateQuery, values);
        }
      }

      // 2. Tandai Approved
      await pool.query(
        `UPDATE correction_requests SET status = 'APPROVED', handled_by = ?, handled_at = NOW() WHERE id = ?`,
        [adminName, request_id]
      );

      // 3. Catat ke log
      const logAction = proposed.ACTION === 'DELETE_REQUEST' ? 'DELETE' : 'CORRECTION_APPROVED';
      await logActivity({
        module: reqData.module,
        submenu: reqData.submenu,
        tableName: reqData.table_name,
        recordId: reqData.record_id,
        action: logAction,
        userName: adminName,
        details: { changes: proposed },
      });

      // 4. Beritahu pemohon bahwa permohonannya disetujui
      if (reqData.requested_by) {
        sendNotificationToRole('Petugas Teknis', {
          title: 'Pengajuan Revisi Disetujui',
          body: `Pengajuan koreksi Anda pada modul ${reqData.module} (${reqData.submenu}) telah disetujui oleh ${adminName} dan data telah diperbarui.`,
          url: '/beranda',
          type: 'koreksi',
        }, reqData.requested_by).catch(() => {});
      }

      return NextResponse.json({ success: true, message: proposed.ACTION === 'DELETE_REQUEST' ? 'Data berhasil dihapus!' : 'Pengajuan disetujui dan data diperbarui!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Gagal memproses approval:', error);
    return NextResponse.json({ error: 'Gagal memproses approval', detail: error.message }, { status: 500 });
  }
}
