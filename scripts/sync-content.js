const fs = require('fs');
const path = require('path');

const SOURCE_DIR = '/home/alelinux/concursos';
const TARGET_DIR = path.join(process.cwd(), 'content');

const TARGET_LOGS = path.join(TARGET_DIR, 'logs');
const TARGET_FLASHCARDS = path.join(TARGET_DIR, 'flashcards');
const TARGET_META = path.join(TARGET_DIR, 'meta');

function ensureDirectories() {
  [TARGET_DIR, TARGET_LOGS, TARGET_FLASHCARDS, TARGET_META].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function shouldCopy(srcPath, destPath) {
  if (!fs.existsSync(destPath)) return true;

  try {
    const srcStat = fs.statSync(srcPath);
    const destStat = fs.statSync(destPath);
    return srcStat.mtimeMs > destStat.mtimeMs || srcStat.size !== destStat.size;
  } catch {
    return true;
  }
}

function syncFiles() {
  console.log('🔄 Iniciando sincronização automática de conteúdo...');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.warn(`⚠️ Diretório de origem "${SOURCE_DIR}" não encontrado. Pulando sincronização.`);
    return;
  }

  ensureDirectories();

  let countLogs = 0;
  let countFlashcards = 0;
  let countMeta = 0;

  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const fileName = entry.name;
    const srcPath = path.join(SOURCE_DIR, fileName);

    // Metadados
    if (
      fileName === 'conteúdoParaMeuCargo.md' ||
      fileName === 'editalVerticalizado.md' ||
      fileName === 'cronograma_estudos.md'
    ) {
      const destPath = path.join(TARGET_META, fileName);
      if (shouldCopy(srcPath, destPath)) {
        fs.copyFileSync(srcPath, destPath);
        countMeta++;
      }
      continue;
    }

    // Logs de estudo (log_estudos_YYYYMMDD.md)
    if (fileName.startsWith('log_estudos_') && fileName.endsWith('.md')) {
      const destPath = path.join(TARGET_LOGS, fileName);
      if (shouldCopy(srcPath, destPath)) {
        fs.copyFileSync(srcPath, destPath);
        countLogs++;
      }
      continue;
    }

    // Flashcards (flashcards_*.csv ou missao*Flashcards.csv / missão*Flashcards.csv)
    if (
      fileName.endsWith('.csv') &&
      (fileName.startsWith('flashcards_') || fileName.toLowerCase().includes('miss'))
    ) {
      const destPath = path.join(TARGET_FLASHCARDS, fileName);
      if (shouldCopy(srcPath, destPath)) {
        fs.copyFileSync(srcPath, destPath);
        countFlashcards++;
      }
      continue;
    }
  }

  console.log(
    `✅ Sincronização concluída: ${countLogs} log(s), ${countFlashcards} flashcard(s), ${countMeta} metadado(s) atualizados/copiados.`
  );
}

syncFiles();
