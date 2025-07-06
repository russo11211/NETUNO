# ========================================
# CLAUDE CLI HISTORY WRAPPER - PowerShell
# ========================================
# Automatiza o salvamento de histórico das sessões do Claude CLI
# Versão: 1.0 - 2025-01-04

# Função principal para executar Claude CLI com histórico automático
function Start-ClaudeWithHistory {
    [CmdletBinding()]
    param(
        [string]$HistoryDir = "$env:USERPROFILE\Documents\ClaudeHistory",
        [switch]$ShowLocation,
        [switch]$NoColor
    )
    
    # Configuração de cores (se habilitado)
    $colors = @{
        Info = if ($NoColor) { "" } else { "`e[36m" }      # Cyan
        Success = if ($NoColor) { "" } else { "`e[32m" }   # Green  
        Warning = if ($NoColor) { "" } else { "`e[33m" }   # Yellow
        Error = if ($NoColor) { "" } else { "`e[31m" }     # Red
        Reset = if ($NoColor) { "" } else { "`e[0m" }      # Reset
        Bold = if ($NoColor) { "" } else { "`e[1m" }       # Bold
    }
    
    try {
        # Criar diretório de histórico se não existir
        if (-not (Test-Path $HistoryDir)) {
            Write-Host "$($colors.Info)📁 Criando diretório de histórico: $HistoryDir$($colors.Reset)"
            New-Item -ItemType Directory -Path $HistoryDir -Force | Out-Null
        }
        
        # Gerar nome do arquivo com timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $historyFile = Join-Path $HistoryDir "claude_history_$timestamp.txt"
        
        # Mostrar informações da sessão
        Write-Host ""
        Write-Host "$($colors.Bold)🌊 CLAUDE CLI COM HISTÓRICO AUTOMÁTICO$($colors.Reset)"
        Write-Host "$($colors.Info)═══════════════════════════════════════$($colors.Reset)"
        Write-Host "$($colors.Info)📅 Data/Hora: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")$($colors.Reset)"
        Write-Host "$($colors.Info)📝 Histórico: $historyFile$($colors.Reset)"
        
        if ($ShowLocation) {
            Write-Host "$($colors.Info)📂 Diretório: $HistoryDir$($colors.Reset)"
        }
        
        Write-Host "$($colors.Info)═══════════════════════════════════════$($colors.Reset)"
        Write-Host ""
        
        # Verificar se claude-cli está disponível
        if (-not (Get-Command "claude-cli" -ErrorAction SilentlyContinue)) {
            Write-Host "$($colors.Error)❌ ERRO: claude-cli não encontrado no PATH$($colors.Reset)"
            Write-Host "$($colors.Warning)💡 Instale com: npm install -g @anthropics/claude-cli$($colors.Reset)"
            return
        }
        
        # Iniciar transcrição
        Write-Host "$($colors.Success)🔄 Iniciando gravação do histórico...$($colors.Reset)"
        Start-Transcript -Path $historyFile -Append
        
        # Adicionar cabeçalho da sessão no arquivo
        Write-Output ""
        Write-Output "=========================================="
        Write-Output "CLAUDE CLI SESSION - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
        Write-Output "User: $env:USERNAME"
        Write-Output "Computer: $env:COMPUTERNAME"
        Write-Output "PowerShell: $($PSVersionTable.PSVersion)"
        Write-Output "Working Directory: $(Get-Location)"
        Write-Output "=========================================="
        Write-Output ""
        
        # Executar Claude CLI
        Write-Host "$($colors.Success)🚀 Iniciando Claude CLI...$($colors.Reset)"
        Write-Output "# Iniciando Claude CLI..."
        claude-cli
        
    }
    catch {
        Write-Host "$($colors.Error)❌ ERRO durante execução: $($_.Exception.Message)$($colors.Reset)"
        Write-Output "# ERRO: $($_.Exception.Message)"
    }
    finally {
        # Sempre parar a transcrição, mesmo em caso de erro
        try {
            Write-Output ""
            Write-Output "# Finalizando sessão Claude CLI - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
            Write-Output "=========================================="
            
            Stop-Transcript
            
            Write-Host ""
            Write-Host "$($colors.Success)✅ Histórico salvo com sucesso!$($colors.Reset)"
            Write-Host "$($colors.Info)📁 Arquivo: $historyFile$($colors.Reset)"
            
            # Mostrar tamanho do arquivo
            if (Test-Path $historyFile) {
                $fileSize = (Get-Item $historyFile).Length
                $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
                Write-Host "$($colors.Info)📊 Tamanho: $fileSizeKB KB$($colors.Reset)"
            }
            
            Write-Host ""
        }
        catch {
            Write-Host "$($colors.Warning)⚠️  Aviso: Erro ao finalizar transcrição: $($_.Exception.Message)$($colors.Reset)"
        }
    }
}

# Função auxiliar para listar históricos
function Get-ClaudeHistory {
    [CmdletBinding()]
    param(
        [string]$HistoryDir = "$env:USERPROFILE\Documents\ClaudeHistory",
        [int]$Last = 10
    )
    
    if (-not (Test-Path $HistoryDir)) {
        Write-Host "❌ Diretório de histórico não encontrado: $HistoryDir"
        return
    }
    
    $historyFiles = Get-ChildItem -Path $HistoryDir -Filter "claude_history_*.txt" | 
                   Sort-Object LastWriteTime -Descending |
                   Select-Object -First $Last
    
    if ($historyFiles.Count -eq 0) {
        Write-Host "📝 Nenhum histórico encontrado em: $HistoryDir"
        return
    }
    
    Write-Host "📚 Últimos $($historyFiles.Count) históricos do Claude CLI:"
    Write-Host "═══════════════════════════════════════════════════════"
    
    foreach ($file in $historyFiles) {
        $size = [math]::Round($file.Length / 1KB, 2)
        Write-Host "📅 $($file.LastWriteTime.ToString("yyyy-MM-dd HH:mm")) | 📊 $size KB | 📁 $($file.Name)"
    }
    
    Write-Host ""
    Write-Host "💡 Para abrir um histórico: notepad `"$HistoryDir\[nome_arquivo]`""
}

# Função para abrir diretório de históricos
function Open-ClaudeHistoryFolder {
    param(
        [string]$HistoryDir = "$env:USERPROFILE\Documents\ClaudeHistory"
    )
    
    if (Test-Path $HistoryDir) {
        Start-Process explorer.exe $HistoryDir
        Write-Host "📂 Abrindo diretório de históricos: $HistoryDir"
    } else {
        Write-Host "❌ Diretório não encontrado: $HistoryDir"
    }
}

# Criar aliases amigáveis
Set-Alias -Name "claude-h" -Value "Start-ClaudeWithHistory"
Set-Alias -Name "claude-history" -Value "Get-ClaudeHistory" 
Set-Alias -Name "claude-folder" -Value "Open-ClaudeHistoryFolder"

# Exportar funções para uso em outros scripts
Export-ModuleMember -Function Start-ClaudeWithHistory, Get-ClaudeHistory, Open-ClaudeHistoryFolder
Export-ModuleMember -Alias claude-h, claude-history, claude-folder

# Mensagem de carregamento (apenas ao importar o módulo)
if ($MyInvocation.InvocationName -ne ".") {
    Write-Host "🌊 Claude CLI History Wrapper carregado com sucesso!" -ForegroundColor Cyan
    Write-Host "💡 Use 'claude-h' para iniciar Claude com histórico automático" -ForegroundColor Yellow
    Write-Host "📚 Use 'claude-history' para ver históricos anteriores" -ForegroundColor Yellow
    Write-Host "📂 Use 'claude-folder' para abrir pasta de históricos" -ForegroundColor Yellow
}