# 🌊 Claude CLI History Wrapper - Guia Completo

Automatize o salvamento de histórico das suas sessões do Claude CLI no PowerShell!

## 🚀 Instalação Rápida (Recomendada)

### Opção 1: Setup Automático
```powershell
# Baixe e execute o script de setup
iwr https://raw.githubusercontent.com/seu-repo/Setup-Claude-Profile.ps1 -OutFile Setup-Claude-Profile.ps1
.\Setup-Claude-Profile.ps1

# Ou execute localmente se já tem os arquivos
.\Setup-Claude-Profile.ps1
```

### Opção 2: Setup Manual Passo a Passo

#### 1. Verificar se o Profile existe
```powershell
# Verificar localização do profile
echo $PROFILE

# Verificar se existe
Test-Path $PROFILE
```

#### 2. Criar Profile se não existir
```powershell
# Criar diretório se necessário
New-Item -ItemType Directory -Path (Split-Path $PROFILE -Parent) -Force

# Criar arquivo do profile
New-Item -ItemType File -Path $PROFILE -Force
```

#### 3. Abrir Profile para edição
```powershell
# Abrir no Notepad
notepad $PROFILE

# Ou no VS Code (se instalado)
code $PROFILE
```

#### 4. Adicionar o código ao Profile
Copie e cole o seguinte código no seu `$PROFILE`:

```powershell
# ========================================
# CLAUDE CLI HISTORY WRAPPER
# ========================================

function Start-ClaudeWithHistory {
    [CmdletBinding()]
    param(
        [string]$HistoryDir = "$env:USERPROFILE\Documents\ClaudeHistory",
        [switch]$ShowLocation,
        [switch]$NoColor
    )
    
    # Configuração de cores
    $colors = @{
        Info = if ($NoColor) { "" } else { "`e[36m" }
        Success = if ($NoColor) { "" } else { "`e[32m" }
        Warning = if ($NoColor) { "" } else { "`e[33m" }
        Error = if ($NoColor) { "" } else { "`e[31m" }
        Reset = if ($NoColor) { "" } else { "`e[0m" }
        Bold = if ($NoColor) { "" } else { "`e[1m" }
    }
    
    try {
        # Criar diretório de histórico
        if (-not (Test-Path $HistoryDir)) {
            Write-Host "$($colors.Info)📁 Criando diretório: $HistoryDir$($colors.Reset)"
            New-Item -ItemType Directory -Path $HistoryDir -Force | Out-Null
        }
        
        # Nome do arquivo com timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $historyFile = Join-Path $HistoryDir "claude_history_$timestamp.txt"
        
        # Informações da sessão
        Write-Host ""
        Write-Host "$($colors.Bold)🌊 CLAUDE CLI COM HISTÓRICO$($colors.Reset)"
        Write-Host "$($colors.Info)═══════════════════════════════$($colors.Reset)"
        Write-Host "$($colors.Info)📅 $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")$($colors.Reset)"
        Write-Host "$($colors.Info)📝 $historyFile$($colors.Reset)"
        if ($ShowLocation) {
            Write-Host "$($colors.Info)📂 $HistoryDir$($colors.Reset)"
        }
        Write-Host "$($colors.Info)═══════════════════════════════$($colors.Reset)"
        Write-Host ""
        
        # Verificar claude-cli
        if (-not (Get-Command "claude-cli" -ErrorAction SilentlyContinue)) {
            Write-Host "$($colors.Error)❌ claude-cli não encontrado$($colors.Reset)"
            Write-Host "$($colors.Warning)💡 Instale: npm install -g @anthropics/claude-cli$($colors.Reset)"
            return
        }
        
        # Iniciar gravação
        Write-Host "$($colors.Success)🔄 Iniciando gravação...$($colors.Reset)"
        Start-Transcript -Path $historyFile -Append
        
        # Cabeçalho do arquivo
        Write-Output ""
        Write-Output "=========================================="
        Write-Output "CLAUDE CLI SESSION - $(Get-Date)"
        Write-Output "User: $env:USERNAME @ $env:COMPUTERNAME"
        Write-Output "PowerShell: $($PSVersionTable.PSVersion)"
        Write-Output "Directory: $(Get-Location)"
        Write-Output "=========================================="
        Write-Output ""
        
        # Executar Claude CLI
        Write-Host "$($colors.Success)🚀 Iniciando Claude CLI...$($colors.Reset)"
        claude-cli
        
    }
    catch {
        Write-Host "$($colors.Error)❌ ERRO: $($_.Exception.Message)$($colors.Reset)"
        Write-Output "# ERRO: $($_.Exception.Message)"
    }
    finally {
        try {
            Write-Output ""
            Write-Output "# Sessão finalizada - $(Get-Date)"
            Write-Output "=========================================="
            Stop-Transcript
            
            Write-Host ""
            Write-Host "$($colors.Success)✅ Histórico salvo!$($colors.Reset)"
            Write-Host "$($colors.Info)📁 $historyFile$($colors.Reset)"
            
            if (Test-Path $historyFile) {
                $size = [math]::Round((Get-Item $historyFile).Length / 1KB, 2)
                Write-Host "$($colors.Info)📊 Tamanho: $size KB$($colors.Reset)"
            }
        }
        catch {
            Write-Host "$($colors.Warning)⚠️ Erro ao finalizar: $($_.Exception.Message)$($colors.Reset)"
        }
    }
}

# Função para ver históricos
function Get-ClaudeHistory {
    param(
        [string]$HistoryDir = "$env:USERPROFILE\Documents\ClaudeHistory",
        [int]$Last = 10
    )
    
    if (-not (Test-Path $HistoryDir)) {
        Write-Host "❌ Diretório não encontrado: $HistoryDir"
        return
    }
    
    $files = Get-ChildItem -Path $HistoryDir -Filter "claude_history_*.txt" |
             Sort-Object LastWriteTime -Descending |
             Select-Object -First $Last
    
    if ($files.Count -eq 0) {
        Write-Host "📝 Nenhum histórico encontrado"
        return
    }
    
    Write-Host "📚 Últimos $($files.Count) históricos:"
    Write-Host "══════════════════════════════════════"
    
    foreach ($file in $files) {
        $size = [math]::Round($file.Length / 1KB, 2)
        Write-Host "📅 $($file.LastWriteTime.ToString("MM-dd HH:mm")) | $size KB | $($file.Name)"
    }
}

# Função para abrir pasta
function Open-ClaudeHistoryFolder {
    param([string]$HistoryDir = "$env:USERPROFILE\Documents\ClaudeHistory")
    
    if (Test-Path $HistoryDir) {
        Start-Process explorer.exe $HistoryDir
    } else {
        Write-Host "❌ Diretório não encontrado: $HistoryDir"
    }
}

# Aliases amigáveis
Set-Alias -Name "claude-h" -Value "Start-ClaudeWithHistory" -Force
Set-Alias -Name "claude-history" -Value "Get-ClaudeHistory" -Force  
Set-Alias -Name "claude-folder" -Value "Open-ClaudeHistoryFolder" -Force

# Mensagem de carregamento
if ($env:CLAUDE_WRAPPER_LOADED -ne "1") {
    Write-Host "🌊 Claude CLI History Wrapper carregado!" -ForegroundColor Cyan
    Write-Host "💡 Use 'claude-h' para iniciar" -ForegroundColor Yellow
    $env:CLAUDE_WRAPPER_LOADED = "1"
}
```

#### 5. Salvar e recarregar Profile
```powershell
# Salvar o arquivo e recarregar
. $PROFILE

# Ou fechar e reabrir o PowerShell
```

## 📖 Como Usar

### Comandos Principais
```powershell
# Iniciar Claude CLI com histórico automático
claude-h

# Ver históricos anteriores (últimos 10)
claude-history

# Abrir pasta de históricos no Explorer
claude-folder

# Opções avançadas
claude-h -ShowLocation          # Mostra caminho completo
claude-h -NoColor              # Sem cores no output
claude-h -HistoryDir "C:\Logs"  # Diretório customizado
```

### Localização dos Arquivos
- **Históricos:** `$env:USERPROFILE\Documents\ClaudeHistory\`
- **Profile:** `$PROFILE` (geralmente em `Documents\PowerShell\`)
- **Formato:** `claude_history_2025-01-04_14-30-15.txt`

## 🔧 Solução de Problemas

### Profile não carrega automaticamente
```powershell
# Executar manualmente
. $PROFILE

# Verificar política de execução
Get-ExecutionPolicy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Claude-cli não encontrado
```powershell
# Instalar claude-cli
npm install -g @anthropics/claude-cli

# Verificar se está no PATH
claude-cli --version
```

### Erro de permissão para criar diretórios
```powershell
# Usar diretório alternativo
claude-h -HistoryDir "$env:TEMP\ClaudeHistory"
```

### Limpar históricos antigos
```powershell
# Ver históricos
claude-history

# Abrir pasta para limpeza manual
claude-folder

# Ou deletar arquivos antigos (exemplo: >30 dias)
Get-ChildItem "$env:USERPROFILE\Documents\ClaudeHistory" -Filter "*.txt" |
Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
Remove-Item
```

## 🎯 Recursos Avançados

### Histórico com informações detalhadas
Cada arquivo de histórico inclui:
- Timestamp de início e fim
- Usuário e computador
- Versão do PowerShell
- Diretório de trabalho
- Todo o output da sessão Claude CLI

### Funcionalidades extras
- **Backup automático** do profile antes de modificar
- **Cores configuráveis** no output
- **Detecção de crashes** com try/finally
- **Informações de tamanho** do arquivo
- **Timestamps precisos** em todos os logs

## 📝 Exemplo de Uso Completo

```powershell
# Terminal Session
PS> claude-h

🌊 CLAUDE CLI COM HISTÓRICO AUTOMÁTICO
═══════════════════════════════════════
📅 Data/Hora: 2025-01-04 14:30:15
📝 Histórico: C:\Users\User\Documents\ClaudeHistory\claude_history_2025-01-04_14-30-15.txt
═══════════════════════════════════════

🔄 Iniciando gravação do histórico...
🚀 Iniciando Claude CLI...

# [Sessão Claude CLI aqui]

✅ Histórico salvo com sucesso!
📁 Arquivo: C:\Users\User\Documents\ClaudeHistory\claude_history_2025-01-04_14-30-15.txt
📊 Tamanho: 15.7 KB

PS> claude-history
📚 Últimos 3 históricos do Claude CLI:
═══════════════════════════════════════════════════════
📅 2025-01-04 14:30 | 📊 15.7 KB | 📁 claude_history_2025-01-04_14-30-15.txt
📅 2025-01-04 10:15 | 📊 8.2 KB  | 📁 claude_history_2025-01-04_10-15-30.txt
📅 2025-01-03 16:45 | 📊 22.1 KB | 📁 claude_history_2025-01-03_16-45-12.txt
```

Pronto! Agora você pode usar `claude-h` a qualquer momento e ter todo seu histórico salvo automaticamente! 🎉