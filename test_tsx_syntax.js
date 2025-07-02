// Teste de sintaxe TypeScript/TSX
const fs = require('fs');
const path = require('path');

// Verificar se há erros de sintaxe óbvios nos arquivos TSX
const filesToCheck = [
  '/mnt/c/Users/caue9/NETUNO-APP/netuno-frontend/src/app/app/components/DashboardTab.tsx',
  '/mnt/c/Users/caue9/NETUNO-APP/netuno-frontend/src/app/components/Dashboard.tsx'
];

console.log('Verificando sintaxe dos arquivos TSX...\n');

filesToCheck.forEach(filePath => {
  console.log(`Verificando: ${path.basename(filePath)}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificações básicas de sintaxe
    const lines = content.split('\n');
    let errors = [];
    
    // Verificar parênteses balanceados
    let openParens = 0;
    let openBraces = 0;
    let openBrackets = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Contar parênteses, chaves e colchetes
      for (const char of line) {
        switch (char) {
          case '(': openParens++; break;
          case ')': openParens--; break;
          case '{': openBraces++; break;
          case '}': openBraces--; break;
          case '[': openBrackets++; break;
          case ']': openBrackets--; break;
        }
      }
      
      // Verificar se há problemas óbvios
      if (line.includes('.toFixed') && !line.includes('try') && !line.includes('safeToFixed')) {
        errors.push(`Linha ${lineNum}: Possível .toFixed sem proteção`);
      }
      
      if (line.includes('undefined.') || line.includes('null.')) {
        errors.push(`Linha ${lineNum}: Possível acesso a propriedade de undefined/null`);
      }
      
      // Verificar JSX mal formado
      if (line.includes('<') && line.includes('>') && !line.includes('//')) {
        const openTags = (line.match(/</g) || []).length;
        const closeTags = (line.match(/>/g) || []).length;
        if (openTags !== closeTags && !line.includes('=>') && !line.includes('>=') && !line.includes('<=')) {
          errors.push(`Linha ${lineNum}: Possível JSX mal formado`);
        }
      }
    }
    
    // Verificar balanceamento final
    if (openParens !== 0) errors.push(`Parênteses desbalanceados: ${openParens}`);
    if (openBraces !== 0) errors.push(`Chaves desbalanceadas: ${openBraces}`);
    if (openBrackets !== 0) errors.push(`Colchetes desbalanceados: ${openBrackets}`);
    
    if (errors.length === 0) {
      console.log('  ✅ Sintaxe OK');
    } else {
      console.log('  ❌ Problemas encontrados:');
      errors.forEach(error => console.log(`    ${error}`));
    }
    
  } catch (error) {
    console.log(`  ❌ Erro ao ler arquivo: ${error.message}`);
  }
  
  console.log('');
});

console.log('Verificação de sintaxe concluída.');