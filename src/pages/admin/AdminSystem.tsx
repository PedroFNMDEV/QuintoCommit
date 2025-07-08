import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Server, Settings, Database, Shield, Activity, AlertTriangle,
  CheckCircle, Clock, HardDrive, Cpu, MemoryStick, Network,
  ChevronLeft, RefreshCw, Save, Download, Trash2, Eye, EyeOff,
  Globe, Lock, Mail, Bell, Calendar, FileText, RotateCcw
} from 'lucide-react';

interface SystemConfig {
  dominio_padrao: string;
  codigo_servidor_atual: number;
  manutencao: string;
  max_usuarios_por_servidor: number;
  backup_automatico: string;
  logs_retention_days: number;
  email_notifications: string;
}

interface WowzaStatus {
  status: string;
  version: string;
  uptime: string;
  connections: {
    current: number;
    peak: number;
    total: number;
  };
  bandwidth: {
    incoming: string;
    outgoing: string;
    peak_outgoing: string;
  };
  applications: {
    live: {
      status: string;
      connections: number;
      streams: number;
    };
    playback: {
      status: string;
      connections: number;
      streams: number;
    };
  };
  server_info: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: string;
  };
}

interface DatabaseStats {
  total_accounts: number;
  active_accounts: number;
  active_streams: number;
  total_viewer_limit: number;
  avg_bitrate: number;
  total_storage_allocated: number;
  total_storage_used_gb: number;
}

const AdminSystem: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [wowzaStatus, setWowzaStatus] = useState<WowzaStatus | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');

      // Carregar configurações
      const configResponse = await fetch('/api/admin/system/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Carregar status do Wowza
      const wowzaResponse = await fetch('/api/admin/system/wowza-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const configData = await configResponse.json();
      const wowzaData = await wowzaResponse.json();

      if (configData.success) {
        setConfig(configData.data);
      }

      if (wowzaData.success) {
        setWowzaStatus(wowzaData.data.wowza);
        setDbStats(wowzaData.data.database);
      }
    } catch (error) {
      console.error('Error loading system data:', error);
      toast.error('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('admin_token');

      const response = await fetch('/api/admin/system/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Configurações salvas com sucesso');
      } else {
        toast.error(data.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/system/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Backup iniciado com sucesso');
      } else {
        toast.error(data.error || 'Erro ao iniciar backup');
      }
    } catch (error) {
      console.error('Error starting backup:', error);
      toast.error('Erro de conexão');
    }
  };

  const handleCleanup = async () => {
    const days = prompt('Quantos dias de dados manter? (padrão: 90)');
    const retentionDays = days ? parseInt(days) : 90;

    if (isNaN(retentionDays) || retentionDays < 1) {
      toast.error('Número de dias inválido');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/system/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: retentionDays }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Erro ao executar limpeza');
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast.error('Erro de conexão');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'offline':
      case 'stopped':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Carregando dados do sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadSystemData}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                title="Atualizar"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'config'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Configurações
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === 'maintenance'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manutenção
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Server Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Server className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Status do Wowza</p>
                    <p className={`text-lg font-bold ${wowzaStatus?.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                      {wowzaStatus?.status?.toUpperCase() || 'OFFLINE'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uptime: {wowzaStatus?.uptime || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Conexões Ativas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {wowzaStatus?.connections.current || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Pico: {wowzaStatus?.connections.peak || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Contas Ativas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dbStats?.active_accounts || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {dbStats?.total_accounts || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <HardDrive className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Armazenamento</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatBytes((dbStats?.total_storage_used_gb || 0) * 1024 * 1024 * 1024)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Alocado: {formatBytes((dbStats?.total_storage_allocated || 0) * 1024 * 1024 * 1024)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wowza Applications Status */}
            {wowzaStatus && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Status das Aplicações Wowza</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Live Streaming</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wowzaStatus.applications.live.status)}`}>
                          {wowzaStatus.applications.live.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conexões:</span>
                          <span className="font-medium">{wowzaStatus.applications.live.connections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Streams:</span>
                          <span className="font-medium">{wowzaStatus.applications.live.streams}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Playback</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wowzaStatus.applications.playback.status)}`}>
                          {wowzaStatus.applications.playback.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conexões:</span>
                          <span className="font-medium">{wowzaStatus.applications.playback.connections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Streams:</span>
                          <span className="font-medium">{wowzaStatus.applications.playback.streams}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Server Performance */}
            {wowzaStatus?.server_info && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Performance do Servidor</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Cpu className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{wowzaStatus.server_info.cpu_usage}%</p>
                      <p className="text-sm text-gray-600">CPU</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <MemoryStick className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{wowzaStatus.server_info.memory_usage}%</p>
                      <p className="text-sm text-gray-600">Memória</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <HardDrive className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{wowzaStatus.server_info.disk_usage}%</p>
                      <p className="text-sm text-gray-600">Disco</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Network className="h-8 w-8 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{wowzaStatus.server_info.network_io}</p>
                      <p className="text-sm text-gray-600">Rede I/O</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && config && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Configurações Gerais</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="h-4 w-4 inline mr-2" />
                      Domínio Padrão
                    </label>
                    <input
                      type="text"
                      value={config.dominio_padrao}
                      onChange={(e) => setConfig({ ...config, dominio_padrao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Server className="h-4 w-4 inline mr-2" />
                      Máximo de Usuários por Servidor
                    </label>
                    <input
                      type="number"
                      value={config.max_usuarios_por_servidor}
                      onChange={(e) => setConfig({ ...config, max_usuarios_por_servidor: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      Modo Manutenção
                    </label>
                    <select
                      value={config.manutencao}
                      onChange={(e) => setConfig({ ...config, manutencao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="nao">Desabilitado</option>
                      <option value="sim">Habilitado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Download className="h-4 w-4 inline mr-2" />
                      Backup Automático
                    </label>
                    <select
                      value={config.backup_automatico}
                      onChange={(e) => setConfig({ ...config, backup_automatico: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="sim">Habilitado</option>
                      <option value="nao">Desabilitado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-4 w-4 inline mr-2" />
                      Retenção de Logs (dias)
                    </label>
                    <input
                      type="number"
                      value={config.logs_retention_days}
                      onChange={(e) => setConfig({ ...config, logs_retention_days: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      min="1"
                      max="365"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Bell className="h-4 w-4 inline mr-2" />
                      Notificações por Email
                    </label>
                    <select
                      value={config.email_notifications}
                      onChange={(e) => setConfig({ ...config, email_notifications: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="sim">Habilitado</option>
                      <option value="nao">Desabilitado</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backup */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Download className="h-5 w-5 mr-2" />
                    Backup do Sistema
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    Criar backup completo do banco de dados e configurações do sistema.
                  </p>
                  <button
                    onClick={handleBackup}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Iniciar Backup</span>
                  </button>
                </div>
              </div>

              {/* Cleanup */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Limpeza de Dados
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">
                    Remover logs antigos, sessões expiradas e dados desnecessários.
                  </p>
                  <button
                    onClick={handleCleanup}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Executar Limpeza</span>
                  </button>
                </div>
              </div>
            </div>

            {/* System Logs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Logs do Sistema
                  </h3>
                  <button
                    onClick={() => navigate('/admin/logs')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Ver todos →
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Visualizar e gerenciar logs de atividades administrativas e do sistema.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">1,247</p>
                    <p className="text-sm text-gray-600">Logs hoje</p>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">8,934</p>
                    <p className="text-sm text-gray-600">Esta semana</p>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">34,567</p>
                    <p className="text-sm text-gray-600">Este mês</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSystem;