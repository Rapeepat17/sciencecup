/**
 * SCI CUP - Image Storage Migration Tool
 * Migrates Base64 logos from Supabase teams table & bracket_data to Supabase Storage.
 *
 * Safety Constraints:
 * 1. "ห้ามลบไฟล์เดิมก่อนตรวจสอบไฟล์ใหม่" (Never delete/modify existing base64 before upload is verified)
 * 2. Full audit and reporting with success/failure counters.
 */

import { imageService } from '../services/image.service.ts';

async function runMigration() {
  console.log('================================================================');
  console.log('🚀 SCI CUP: Supabase Storage Logo Migration Tool');
  console.log('================================================================');
  console.log('Rule 1: Never overwrite/delete original logo before verification');
  console.log('Rule 2: Validate magic bytes, MIME types, and file sizes');
  console.log('----------------------------------------------------------------\n');

  const tournamentId = process.argv[2] || 'sci_cup_main';
  console.log(`[Target Tournament]: ${tournamentId}\n`);

  const startTime = Date.now();

  try {
    const report = await imageService.migrateLegacyBase64Logos(tournamentId);

    console.log('\n================================================================');
    console.log('📊 MIGRATION SUMMARY REPORT');
    console.log('================================================================');
    console.log(`Scan Timestamp  : ${report.timestamp}`);
    console.log(`Total Inspected : ${report.totalScanned}`);
    console.log(`✅ Migrated     : ${report.migratedCount}`);
    console.log(`⚠️  Skipped      : ${report.skippedCount}`);
    console.log(`❌ Failed       : ${report.failedCount}`);
    console.log('----------------------------------------------------------------');

    if (report.details.length > 0) {
      console.log('\nDetail Breakdown:');
      report.details.forEach((item, idx) => {
        const symbol = item.status === 'migrated' ? '✅' : item.status === 'skipped' ? '⏭️' : '❌';
        console.log(` ${idx + 1}. ${symbol} [${item.status.toUpperCase()}] ${item.teamName} (${item.teamId})`);
        if (item.status === 'migrated') {
          console.log(`    Original Size: ${(item.oldSize! / 1024).toFixed(1)} KB`);
          console.log(`    Storage Path : ${item.storagePath}`);
          console.log(`    Public URL   : ${item.newUrl}`);
        } else if (item.status === 'failed') {
          console.log(`    Reason: ${item.reason}`);
        } else {
          console.log(`    Note: ${item.reason}`);
        }
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n----------------------------------------------------------------');
    console.log(`⏱️ Completed in ${duration}s`);
    console.log('================================================================\n');

    if (report.failedCount > 0) {
      console.warn('⚠️ Some images could not be uploaded to Supabase Storage.');
      console.warn('   Note: If bucket "team-logos" does not exist yet, apply migration SQL:');
      console.warn('   supabase/migrations/20261016_storage_setup.sql in Supabase Dashboard.');
      console.warn('   Original Base64 data was preserved 100% intact.');
    }
  } catch (err: any) {
    console.error('❌ Migration encountered fatal error:', err?.message || err);
    process.exit(1);
  }
}

runMigration();
