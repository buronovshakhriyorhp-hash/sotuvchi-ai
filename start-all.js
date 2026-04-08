#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';

console.log('\n🚀 Nexus ERP - Tizimni boshlash...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function runCommand(cmd, args, cwd = process.cwd(), label = '') {
  return new Promise((resolve, reject) => {
    console.log(`${label}`);
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: isWindows
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${label} failed with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    // 1. Database konteynerini boshlash
    await runCommand(
      'docker',
      ['compose', '-f', 'docker-compose.yml', 'up', '-d', 'db'],
      process.cwd(),
      '📦 Database konteynerini boshlayabman...'
    );

    // 2. Database tayyor bo'lishini kutish
    console.log('\n⏳ Database tayyor bo\'lishini kutayabman (3 soniya)...\n');
    await sleep(3000);

    // 3. Migrations va seed-ni o'tkazish
    const backendPath = path.join(process.cwd(), 'backend');
    
    await runCommand(
      'npm',
      ['run', 'db:migrate'],
      backendPath,
      '🔄 Migratsiyalar o\'tkazayabman...'
    );

    await runCommand(
      'npm',
      ['run', 'db:seed'],
      backendPath,
      '🌱 Database-ni seed-layabman...'
    );

    // 4. Backend va Frontend-ni ishga tushirish
    console.log('\n✅ Database tayyor!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Backend va Frontend-ni boshlayabman...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await runCommand(
      'npm',
      ['run', 'dev'],
      process.cwd(),
      ''
    );

  } catch (error) {
    console.error('\n❌ Xatolik:', error.message);
    process.exit(1);
  }
}

main();
