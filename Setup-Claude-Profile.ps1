# =====================================================
# SETUP AUTOMÁTICO - CLAUDE CLI HISTORY WRAPPER
# =====================================================
# Script para configurar automaticamente o PowerShell Profile
# com o wrapper de histórico do Claude CLI
# Versão: 1.0 - 2025-01-04

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$NoBackup,
    [switch]$Verbose
)

# Cores para output
$colors = @{
    Info = "`e[36m"      # Cyan
    Success = "`e[32m"   # Green  
    Warning = "`e[33m"   # Yellow
    Error = "`e[31m"     # Red
    Reset = "`e[0m"      # Reset
    Bold = "`e[1m"       # Bold
}

function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "Info"
    )
    Write-Host "$($colors[$Color])$Message$($colors.Reset)"
}

function Write-Step {
    param([string]$Message)
    Write-ColorMessage "🔄 $Message" "Info"
}

function Write-Success {
    param([string]$Message)
    Write-ColorMessage "✅ $Message" "Success"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorMessage "⚠️  $Message" "Warning"
}

function Write-Error {
    param([string]$Message)
    Write-ColorMessage "❌ $Message" "Error"
}

try {
    Write-ColorMessage "" 
    Write-ColorMessage "$($colors.Bold)🌊 SETUP CLAUDE CLI HISTORY WRAPPER$($colors.Reset)"
    Write-ColorMessage "═══════════════════════════════════════════════════════" "Info"
    Write-ColorMessage ""

    # 1. Verificar se PowerShell Profile existe
    Write-Step "Verificando PowerShell Profile..."
    
    $profilePath = $PROFILE.CurrentUserCurrentHost
    $profileDir = Split-Path $profilePath -Parent
    
    Write-ColorMessage "📍 Profile Path: $profilePath" "Info"
    
    if (Test-Path $profilePath) {
        Write-Success "Profile encontrado!"
        
        if (-not $NoBackup) {
            # Fazer backup do profile existente
            $backupPath = "$profilePath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Write-Step "Criando backup do profile atual..."
            Copy-Item $profilePath $backupPath
            Write-Success "Backup salvo: $backupPath"
        }
    } else {
        Write-Warning "Profile não encontrado. Será criado um novo."
        
        # Criar diretório do profile se não existir
        if (-not (Test-Path $profileDir)) {
            Write-Step "Criando diretório do profile..."
            New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
            Write-Success "Diretório criado: $profileDir"
        }
    }

    # 2. Código para adicionar ao profile
    $claudeWrapperCode = @"
# ========================================
# CLAUDE CLI HISTORY WRAPPER
# Adicionado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ========================================

# Função principal para executar Claude CLI com histórico automático
function Start-ClaudeWithHistory {
    [CmdletBinding()]
    param(
        [string]`$HistoryDir = "`$env:USERPROFILE\Documents\ClaudeHistory",
        [switch]`$ShowLocation,
        [switch]`$NoColor
    )
    
    # Configuração de cores (se habilitado)
    `$colors = @{
        Info = if (`$NoColor) { "" } else { "``e[36m" }      # Cyan
        Success = if (`$NoColor) { "" } else { "``e[32m" }   # Green  
        Warning = if (`$NoColor) { "" } else { "``e[33m" }   # Yellow
        Error = if (`$NoColor) { "" } else { "``e[31m" }     # Red
        Reset = if (`$NoColor) { "" } else { "``e[0m" }      # Reset
        Bold = if (`$NoColor) { "" } else { "``e[1m" }       # Bold
    }
    
    try {
        # Criar diretório de histórico se não existir
        if (-not (Test-Path `$HistoryDir)) {
            Write-Host "`$(`$colors.Info)📁 Criando diretório de histórico: `$HistoryDir`$(`$colors.Reset)"
            New-Item -ItemType Directory -Path `$HistoryDir -Force | Out-Null
        }
        
        # Gerar nome do arquivo com timestamp
        `$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        `$historyFile = Join-Path `$HistoryDir "claude_history_`$timestamp.txt"
        
        # Mostrar informações da sessão
        Write-Host ""
        Write-Host "`$(`$colors.Bold)🌊 CLAUDE CLI COM HISTÓRICO AUTOMÁTICO`$(`$colors.Reset)"
        Write-Host "`$(`$colors.Info)═══════════════════════════════════════`$(`$colors.Reset)"
        Write-Host "`$(`$colors.Info)📅 Data/Hora: `$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")`$(`$colors.Reset)"
        Write-Host "`$(`$colors.Info)📝 Histórico: `$historyFile`$(`$colors.Reset)"
        
        if (`$ShowLocation) {
            Write-Host "`$(`$colors.Info)📂 Diretório: `$HistoryDir`$(`$colors.Reset)"
        }
        
        Write-Host "`$(`$colors.Info)═══════════════════════════════════════`$(`$colors.Reset)"
        Write-Host ""
        
        # Verificar se claude-cli está disponível
        if (-not (Get-Command "claude-cli" -ErrorAction SilentlyContinue)) {
            Write-Host "`$(`$colors.Error)❌ ERRO: claude-cli não encontrado no PATH`$(`$colors.Reset)"
            Write-Host "`$(`$colors.Warning)💡 Instale com: npm install -g @anthropics/claude-cli`$(`$colors.Reset)"
            return
        }
        
        # Iniciar transcrição
        Write-Host "`$(`$colors.Success)🔄 Iniciando gravação do histórico...`$(`$colors.Reset)"
        Start-Transcript -Path `$historyFile -Append
        
        # Adicionar cabeçalho da sessão no arquivo
        Write-Output ""
        Write-Output "=========================================="
        Write-Output "CLAUDE CLI SESSION - `$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
        Write-Output "User: `$env:USERNAME"
        Write-Output "Computer: `$env:COMPUTERNAME"
        Write-Output "PowerShell: `$(`$PSVersionTable.PSVersion)"
        Write-Output "Working Directory: `$(Get-Location)"
        Write-Output "=========================================="
        Write-Output ""
        
        # Executar Claude CLI
        Write-Host "`$(`$colors.Success)🚀 Iniciando Claude CLI...`$(`$colors.Reset)"
        Write-Output "# Iniciando Claude CLI..."
        claude-cli
        
    }
    catch {
        Write-Host "`$(`$colors.Error)❌ ERRO durante execução: `$(`$_.Exception.Message)`$(`$colors.Reset)"
        Write-Output "# ERRO: `$(`$_.Exception.Message)"
    }
    finally {
        # Sempre parar a transcrição, mesmo em caso de erro
        try {
            Write-Output ""
            Write-Output "# Finalizando sessão Claude CLI - `$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
            Write-Output "=========================================="
            
            Stop-Transcript
            
            Write-Host ""
            Write-Host "`$(`$colors.Success)✅ Histórico salvo com sucesso!`$(`$colors.Reset)"
            Write-Host "`$(`$colors.Info)📁 Arquivo: `$historyFile`$(`$colors.Reset)"
            
            # Mostrar tamanho do arquivo
            if (Test-Path `$historyFile) {
                `$fileSize = (Get-Item `$historyFile).Length
                `$fileSizeKB = [math]::Round(`$fileSize / 1KB, 2)
                Write-Host "`$(`$colors.Info)📊 Tamanho: `$fileSizeKB KB`$(`$colors.Reset)"
            }
            
            Write-Host ""
        }
        catch {
            Write-Host "`$(`$colors.Warning)⚠️  Aviso: Erro ao finalizar transcrição: `$(`$_.Exception.Message)`$(`$colors.Reset)"
        }
    }
}

# Função auxiliar para listar históricos
function Get-ClaudeHistory {
    [CmdletBinding()]
    param(
        [string]`$HistoryDir = "`$env:USERPROFILE\Documents\ClaudeHistory",
        [int]`$Last = 10
    )
    
    if (-not (Test-Path `$HistoryDir)) {
        Write-Host "❌ Diretório de histórico não encontrado: `$HistoryDir"
        return
    }
    
    `$historyFiles = Get-ChildItem -Path `$HistoryDir -Filter "claude_history_*.txt" | 
                   Sort-Object LastWriteTime -Descending |
                   Select-Object -First `$Last
    
    if (`$historyFiles.Count -eq 0) {
        Write-Host "📝 Nenhum histórico encontrado em: `$HistoryDir"
        return
    }
    
    Write-Host "📚 Últimos `$(`$historyFiles.Count) históricos do Claude CLI:"
    Write-Host "═══════════════════════════════════════════════════════"
    
    foreach (`$file in `$historyFiles) {
        `$size = [math]::Round(`$file.Length / 1KB, 2)
        Write-Host "📅 `$(`$file.LastWriteTime.ToString("yyyy-MM-dd HH:mm")) | 📊 `$size KB | 📁 `$(`$file.Name)"
    }
    
    Write-Host ""
    Write-Host "💡 Para abrir um histórico: notepad ```"`$HistoryDir\[nome_arquivo]```""
}

# Função para abrir diretório de históricos
function Open-ClaudeHistoryFolder {
    param(
        [string]`$HistoryDir = "`$env:USERPROFILE\Documents\ClaudeHistory"
    )
    
    if (Test-Path `$HistoryDir) {
        Start-Process explorer.exe `$HistoryDir
        Write-Host "📂 Abrindo diretório de históricos: `$HistoryDir"
    } else {
        Write-Host "❌ Diretório não encontrado: `$HistoryDir"
    }
}

# Criar aliases amigáveis
Set-Alias -Name "claude-h" -Value "Start-ClaudeWithHistory" -Force
Set-Alias -Name "claude-history" -Value "Get-ClaudeHistory" -Force
Set-Alias -Name "claude-folder" -Value "Open-ClaudeHistoryFolder" -Force

# Mensagem de boas-vindas (apenas na primeira vez)
if (`$env:CLAUDE_WRAPPER_LOADED -ne "1") {
    Write-Host "🌊 Claude CLI History Wrapper carregado!" -ForegroundColor Cyan
    Write-Host "💡 Use 'claude-h' para Claude com histórico automático" -ForegroundColor Yellow
    `$env:CLAUDE_WRAPPER_LOADED = "1"
}

# ========================================
# FIM DO CLAUDE CLI HISTORY WRAPPER
# ========================================

"@

    # 3. Verificar se já existe código similar no profile
    $needsUpdate = $true
    if (Test-Path $profilePath) {
        $existingContent = Get-Content $profilePath -Raw
        if ($existingContent -like "*CLAUDE CLI HISTORY WRAPPER*") {
            if ($Force) {
                Write-Warning "Código já existe no profile. Forçando atualização..."
                # Remover código antigo
                $lines = Get-Content $profilePath
                $newLines = @()
                $inClaudeSection = $false
                
                foreach ($line in $lines) {
                    if ($line -like "*CLAUDE CLI HISTORY WRAPPER*") {
                        $inClaudeSection = $true
                        continue
                    }
                    if ($inClaudeSection -and $line -like "*FIM DO CLAUDE CLI HISTORY WRAPPER*") {
                        $inClaudeSection = $false
                        continue
                    }
                    if (-not $inClaudeSection) {
                        $newLines += $line
                    }
                }
                
                $newLines | Set-Content $profilePath
            } else {
                Write-Warning "Código já existe no profile."
                Write-ColorMessage "Use -Force para sobrescrever" "Warning"
                $needsUpdate = $false
            }
        }
    }

    # 4. Adicionar código ao profile
    if ($needsUpdate) {
        Write-Step "Adicionando wrapper do Claude ao profile..."
        
        # Adicionar separador se o arquivo já existe e não está vazio
        if ((Test-Path $profilePath) -and (Get-Content $profilePath -Raw).Trim()) {
            Add-Content $profilePath "`n`n"
        }
        
        Add-Content $profilePath $claudeWrapperCode
        Write-Success "Código adicionado ao profile!"
    }

    # 5. Testar se está funcionando
    Write-Step "Testando instalação..."
    
    # Recarregar profile
    Write-Step "Recarregando profile..."
    . $profilePath
    Write-Success "Profile recarregado!"

    # Verificar comandos
    $commands = @("Start-ClaudeWithHistory", "Get-ClaudeHistory", "Open-ClaudeHistoryFolder")
    $aliases = @("claude-h", "claude-history", "claude-folder")
    
    foreach ($cmd in $commands) {
        if (Get-Command $cmd -ErrorAction SilentlyContinue) {
            Write-Success "Função '$cmd' disponível"
        } else {
            Write-Error "Função '$cmd' não encontrada"
        }
    }
    
    foreach ($alias in $aliases) {
        if (Get-Alias $alias -ErrorAction SilentlyContinue) {
            Write-Success "Alias '$alias' disponível"
        } else {
            Write-Error "Alias '$alias' não encontrado"
        }
    }

    # 6. Verificar claude-cli
    Write-Step "Verificando claude-cli..."
    if (Get-Command "claude-cli" -ErrorAction SilentlyContinue) {
        Write-Success "claude-cli encontrado no PATH"
    } else {
        Write-Warning "claude-cli não encontrado no PATH"
        Write-ColorMessage "💡 Instale com: npm install -g @anthropics/claude-cli" "Warning"
    }

    # 7. Resumo final
    Write-ColorMessage ""
    Write-ColorMessage "$($colors.Bold)🎉 SETUP CONCLUÍDO COM SUCESSO!$($colors.Reset)"
    Write-ColorMessage "═══════════════════════════════════════════════════════" "Success"
    Write-ColorMessage ""
    Write-ColorMessage "📋 COMANDOS DISPONÍVEIS:" "Info"
    Write-ColorMessage "  • claude-h              → Inicia Claude CLI com histórico" "Info"
    Write-ColorMessage "  • claude-history        → Lista históricos anteriores" "Info"
    Write-ColorMessage "  • claude-folder         → Abre pasta de históricos" "Info"
    Write-ColorMessage ""
    Write-ColorMessage "📁 ARQUIVOS:" "Info"
    Write-ColorMessage "  • Profile: $profilePath" "Info"
    Write-ColorMessage "  • Históricos: $env:USERPROFILE\Documents\ClaudeHistory" "Info"
    Write-ColorMessage ""
    Write-ColorMessage "🚀 PRÓXIMOS PASSOS:" "Info"
    Write-ColorMessage "  1. Feche e reabra o PowerShell (ou use: . `$PROFILE)" "Warning"
    Write-ColorMessage "  2. Digite 'claude-h' para testar" "Warning"
    Write-ColorMessage "  3. Históricos serão salvos automaticamente!" "Warning"
    Write-ColorMessage ""

} catch {
    Write-Error "Erro durante setup: $($_.Exception.Message)"
    Write-ColorMessage "Stack trace:" "Error"
    Write-ColorMessage $_.ScriptStackTrace "Error"
    exit 1
}