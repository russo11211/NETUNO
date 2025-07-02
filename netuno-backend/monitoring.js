/**
 * Sistema de monitoramento básico para o Netuno Backend
 * Inclui: métricas de performance, logs estruturados, alertas críticos
 */

const fs = require('fs').promises;
const path = require('path');

class MonitoringSystem {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0
      },
      errors: {
        total: 0,
        critical: 0,
        rateLimit: 0,
        auth: 0
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        startTime: new Date().toISOString()
      }
    };
    
    this.logs = [];
    this.alerts = [];
    this.maxLogSize = 1000; // Manter apenas os últimos 1000 logs
    
    // Iniciar coleta de métricas do sistema
    this.startSystemMetrics();
  }

  // Middleware para tracking de requests
  requestTracker() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Intercept response
      const originalSend = res.send;
      res.send = function(data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Atualizar métricas
        this.updateRequestMetrics(res.statusCode, responseTime);
        
        // Log estruturado
        this.logRequest(req, res, responseTime);
        
        return originalSend.call(this, data);
      }.bind(this);
      
      next();
    };
  }

  updateRequestMetrics(statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
      
      if (statusCode === 429) {
        this.metrics.errors.rateLimit++;
      } else if (statusCode === 401 || statusCode === 403) {
        this.metrics.errors.auth++;
      } else if (statusCode >= 500) {
        this.metrics.errors.critical++;
        this.triggerAlert('CRITICAL_ERROR', `HTTP ${statusCode} response`);
      }
    }
    
    // Calcular response time médio
    const totalRequests = this.metrics.requests.total;
    this.metrics.requests.avgResponseTime = 
      ((this.metrics.requests.avgResponseTime * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  logRequest(req, res, responseTime) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      level: res.statusCode >= 400 ? 'ERROR' : 'INFO'
    };
    
    this.addLog(logEntry);
  }

  addLog(logEntry) {
    this.logs.push(logEntry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
    
    // Log crítico no console
    if (logEntry.level === 'ERROR' && logEntry.statusCode >= 500) {
      console.error(`🚨 CRITICAL ERROR: ${logEntry.method} ${logEntry.url} - ${logEntry.statusCode} - ${logEntry.responseTime}`);
    }
  }

  triggerAlert(type, message) {
    const alert = {
      id: `alert_${Date.now()}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type)
    };
    
    this.alerts.push(alert);
    
    // Log alert no console
    const emoji = alert.severity === 'CRITICAL' ? '🚨' : '⚠️';
    console.log(`${emoji} ALERT [${alert.type}]: ${alert.message}`);
    
    // Manter apenas os últimos 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  getAlertSeverity(type) {
    const criticalTypes = ['CRITICAL_ERROR', 'SYSTEM_DOWN', 'DATABASE_ERROR'];
    return criticalTypes.includes(type) ? 'CRITICAL' : 'WARNING';
  }

  startSystemMetrics() {
    // Coletar métricas do sistema a cada 30 segundos
    setInterval(() => {
      this.metrics.system.uptime = process.uptime();
      this.metrics.system.memoryUsage = process.memoryUsage();
      
      // Alertas baseados em uso de memória
      const memUsage = process.memoryUsage();
      const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (memUsagePercent > 85) {
        this.triggerAlert('HIGH_MEMORY_USAGE', `Memory usage: ${memUsagePercent.toFixed(1)}%`);
      }
      
    }, 30000);
  }

  // Endpoint para métricas de saúde
  getHealthStatus() {
    const errorRate = (this.metrics.requests.failed / this.metrics.requests.total) * 100 || 0;
    const criticalAlerts = this.alerts.filter(a => a.severity === 'CRITICAL').length;
    
    let status = 'healthy';
    if (errorRate > 10 || criticalAlerts > 0) {
      status = 'unhealthy';
    } else if (errorRate > 5) {
      status = 'degraded';
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: this.metrics,
      errorRate: errorRate.toFixed(2) + '%',
      recentAlerts: this.alerts.slice(-10),
      memoryUsage: {
        used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
        total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100).toFixed(1)}%`
      }
    };
  }

  // Exportar logs para arquivo
  async exportLogs(filepath) {
    try {
      const logsData = {
        exportedAt: new Date().toISOString(),
        totalLogs: this.logs.length,
        logs: this.logs,
        metrics: this.metrics,
        alerts: this.alerts
      };
      
      await fs.writeFile(filepath, JSON.stringify(logsData, null, 2));
      return { success: true, filepath, totalLogs: this.logs.length };
    } catch (error) {
      console.error('Failed to export logs:', error);
      return { success: false, error: error.message };
    }
  }

  // Limpar logs antigos
  clearLogs(olderThanHours = 24) {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    const originalLength = this.logs.length;
    
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffTime);
    
    const removedCount = originalLength - this.logs.length;
    console.log(`🧹 Cleared ${removedCount} logs older than ${olderThanHours} hours`);
    
    return { removed: removedCount, remaining: this.logs.length };
  }
}

// Singleton instance
const monitoring = new MonitoringSystem();

module.exports = {
  monitoring,
  requestTracker: monitoring.requestTracker.bind(monitoring)
};