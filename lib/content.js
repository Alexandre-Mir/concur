import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Extrai data no formato YYYYMMDD do nome do arquivo.
 */
function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * Extrai fase do nome do arquivo (fase1, fase2, missão1, missao2, etc).
 */
function extractFaseFromFilename(filename) {
  const match = filename.match(/(?:fase|miss[aã]o)(\d+)/i);
  if (!match) return null;
  return match[0].toLowerCase().replace('ã', 'a');
}

/**
 * Lê todos os flashcards de arquivos CSV em content/flashcards/.
 *
 * Formato CSV (delimitador ;):
 *   Linha 1: comentário iniciando com #
 *   Colunas: tipo;frente;verso;contexto;tag1;tag2;...tagN
 *
 * Após o 4º campo (contexto), todos os valores restantes são tags.
 */
export function getAllFlashcards() {
  const flashcardsDir = path.join(CONTENT_DIR, 'flashcards');

  if (!fs.existsSync(flashcardsDir)) return [];

  const csvFiles = fs
    .readdirSync(flashcardsDir)
    .filter((f) => f.endsWith('.csv'));

  const allCards = [];
  let globalId = 0;

  for (const file of csvFiles) {
    const filePath = path.join(flashcardsDir, file);

    let raw;
    try {
      raw = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.error(`[content] Erro ao ler ${file}:`, err.message);
      continue;
    }

    const date = extractDateFromFilename(file);
    const fase = extractFaseFromFilename(file);

    // Processa linha a linha para controlar parsing de tags
    const lines = raw.split('\n').filter((line) => line.trim() !== '');

    for (const line of lines) {
      // Ignora linhas de comentário
      if (line.trim().startsWith('#')) continue;

      const parts = line.split(';').map((p) => p.trim());

      // Precisa de ao menos tipo, frente, verso
      if (parts.length < 3) continue;

      const tipo = parts[0] || '';
      const frente = parts[1] || '';
      const verso = parts[2] || '';
      const contexto = parts[3] || '';
      const tags = parts.slice(4).filter((t) => t !== '');

      globalId++;
      allCards.push({
        id: globalId,
        tipo,
        frente,
        verso,
        contexto,
        tags,
        arquivo: file,
        data: date,
        fase,
      });
    }
  }

  return allCards;
}

/**
 * Lê todos os logs de estudo em content/logs/.
 * Extrai metadados do cabeçalho markdown e pontuação.
 */
export function getAllStudyLogs() {
  const logsDir = path.join(CONTENT_DIR, 'logs');

  if (!fs.existsSync(logsDir)) return [];

  const mdFiles = fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  return mdFiles.map((file) => {
    const filePath = path.join(logsDir, file);

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.error(`[content] Erro ao ler ${file}:`, err.message);
      return null;
    }

    const slug = path.basename(file, '.md');

    // Extrai metadados do cabeçalho
    const dataMatch = content.match(/\*\*Data:\*\*\s*(.+)/);
    const faseMatch = content.match(/\*\*Fase do Ciclo:\*\*\s*(.+)/);
    const focoMatch = content.match(/\*\*Foco Técnico:\*\*\s*(.+)/);

    const data = dataMatch ? dataMatch[1].trim() : null;
    const fase = faseMatch ? faseMatch[1].trim() : null;
    const foco = focoMatch ? focoMatch[1].trim() : null;

    // Extrai pontuação do resultado (ex: "8/8 (100%)")
    const scoreMatch = content.match(
      /###\s*Resultado:\s*(\d+)\/(\d+)\s*\((\d+)%\)/
    );
    const score = scoreMatch ? `${scoreMatch[1]}/${scoreMatch[2]}` : null;
    const scorePercent = scoreMatch ? parseInt(scoreMatch[3], 10) : null;

    // Extrai tabela de evolução
    const evolution = extractEvolutionTable(content);

    return { slug, data, fase, foco, score, scorePercent, content, evolution };
  }).filter(Boolean);
}

/**
 * Extrai a tabela de evolução da seção "📊 Evolução do Ciclo".
 */
function extractEvolutionTable(markdown) {
  const sectionMatch = markdown.match(
    /##\s*📊\s*Evolução do Ciclo\s*\n([\s\S]*?)(?=\n##\s|$)/
  );
  if (!sectionMatch) return [];

  const section = sectionMatch[1];

  // Encontra linhas da tabela (ignora cabeçalho e separador)
  const tableLines = section
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .filter((line) => !line.includes('---'));

  if (tableLines.length < 2) return [];

  // Primeira linha é o cabeçalho
  const headers = tableLines[0]
    .split('|')
    .map((h) => h.trim())
    .filter(Boolean);

  return tableLines.slice(1).map((line) => {
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);

    return {
      sessao: cells[0] || '',
      data: cells[1] || '',
      fase: cells[2] || '',
      nivel: cells[3] || '',
      questoes: cells[4] || '',
      acerto: cells[5] || '',
    };
  });
}

/**
 * Lê content/meta/conteúdoParaMeuCargo.md e parseia a tabela de tópicos.
 * Procura marcadores: ✅ (dominado), 🔄 (visto), ❌ (não estudado).
 */
export function getTopicDomainMap() {
  const metaFile = path.join(CONTENT_DIR, 'meta', 'conteúdoParaMeuCargo.md');

  if (!fs.existsSync(metaFile)) {
    return { areas: [], stats: { dominado: 0, visto: 0, naoEstudado: 0, total: 0 } };
  }

  const content = fs.readFileSync(metaFile, 'utf-8');
  const lines = content.split('\n');

  const areas = [];
  let currentArea = null;
  const stats = { dominado: 0, visto: 0, naoEstudado: 0, total: 0 };

  for (const line of lines) {
    // Detecta cabeçalhos de área (## ou ###)
    const areaMatch = line.match(/^#{2,3}\s+(.+)/);
    if (areaMatch) {
      currentArea = { nome: areaMatch[1].trim(), topicos: [] };
      areas.push(currentArea);
      continue;
    }

    // Detecta linhas com marcadores de status
    const statusMatch = line.match(/(✅|🔄|❌)\s*(.+)/);
    if (statusMatch && currentArea) {
      let status;
      switch (statusMatch[1]) {
        case '✅':
          status = 'dominado';
          stats.dominado++;
          break;
        case '🔄':
          status = 'visto';
          stats.visto++;
          break;
        case '❌':
          status = 'naoEstudado';
          stats.naoEstudado++;
          break;
      }
      stats.total++;

      currentArea.topicos.push({
        nome: statusMatch[2].trim(),
        status,
      });
    }
  }

  return { areas, stats };
}

/**
 * Retorna dados de evolução do log mais recente.
 */
export function getEvolutionData() {
  const logs = getAllStudyLogs();

  if (logs.length === 0) return [];

  // Último log (já ordenado por nome de arquivo)
  const latest = logs[logs.length - 1];

  return latest.evolution || [];
}

/**
 * Lê content/meta/editalVerticalizado.md e parseia as disciplinas e tópicos.
 */
export function getEditalVerticalizado() {
  const filePath = path.join(CONTENT_DIR, 'meta', 'editalVerticalizado.md');
  if (!fs.existsSync(filePath)) return { disciplinas: [] };

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error('[content] Erro ao ler editalVerticalizado.md:', err.message);
    return { disciplinas: [] };
  }

  const lines = content.split('\n');
  const disciplinas = [];
  let currentDisciplina = null;
  let globalId = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line === '---' || line.startsWith('# Conteúdo')) continue;

    // Cabeçalho de disciplina (##)
    if (line.startsWith('## ')) {
      const nome = line.replace(/^##\s+/, '').trim();
      currentDisciplina = {
        id: `disc-${disciplinas.length + 1}`,
        nome,
        topicos: [],
      };
      disciplinas.push(currentDisciplina);
      continue;
    }

    // Subseção (###)
    if (line.startsWith('### ')) {
      const subnome = line.replace(/^###\s+/, '').trim();
      if (currentDisciplina) {
        currentDisciplina.topicos.push({
          id: `hdr-${++globalId}`,
          isHeader: true,
          texto: subnome,
        });
      }
      continue;
    }

    // Tópico/Item numerado ou lista
    if (
      /^\d+\./.test(line) ||
      /^-\s*\d+/.test(line) ||
      line.startsWith('- ')
    ) {
      const texto = line.replace(/^-\s*/, '').trim();
      if (currentDisciplina && texto) {
        currentDisciplina.topicos.push({
          id: `item-${++globalId}`,
          isHeader: false,
          texto,
        });
      }
    }
  }

  return { disciplinas };
}

